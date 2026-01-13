import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import * as XLSX from "xlsx";
import { readFile } from "fs/promises";
import path from "path";

// ✅ POST: upload + parse inventory file
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let dosimeters: any[] = [];

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      // ✅ Parse Excel
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      dosimeters = XLSX.utils.sheet_to_json(sheet);
    } else if (file.name.endsWith(".docx")) {
      // ✅ Parse Word (basic text extraction)
      const { default: mammoth } = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      // Example: split lines, map fields manually
      dosimeters = result.value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => ({
          serial_number: `DOC-${idx}-${Date.now()}`,
          model: "Unknown",
          type: "Dosimeter",
          status: "available",
          comment: line,
        }));
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported file type" },
        { status: 400 }
      );
    }

    if (dosimeters.length === 0) {
      return NextResponse.json(
        { success: false, error: "No data extracted from file" },
        { status: 400 }
      );
    }

    const db = getDB();

    for (const d of dosimeters) {
      await db.query(
        `INSERT INTO dosimeters 
          (serial_number, model, type, status, hospital_name, contact_person, contact_phone, leasing_period, calibration_date, expiry_date, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
           model=VALUES(model), type=VALUES(type), status=VALUES(status), hospital_name=VALUES(hospital_name),
           contact_person=VALUES(contact_person), contact_phone=VALUES(contact_phone),
           leasing_period=VALUES(leasing_period), calibration_date=VALUES(calibration_date),
           expiry_date=VALUES(expiry_date), comment=VALUES(comment)`,
        [
          d.serial_number || `AUTO-${Date.now()}-${Math.random()}`,
          d.model || "Unknown",
          d.type || "Dosimeter",
          d.status || "available",
          d.hospital_name || null,
          d.contact_person || null,
          d.contact_phone || null,
          d.leasing_period || null,
          d.calibration_date || null,
          d.expiry_date || null,
          d.comment || null,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      inserted: dosimeters.length,
    });
  } catch (err: any) {
    console.error("❌ Upload error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
