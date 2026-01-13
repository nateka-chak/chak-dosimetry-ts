import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import { promises as fs } from "fs";
import path from "path";

// POST /api/requests
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const hospital = formData.get("hospital") as string;
    const requestedBy = formData.get("requestedBy") as string;
    const phone = formData.get("phone") as string;
    const location = formData.get("location") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const document = formData.get("document") as File | null;

    if (!hospital || !requestedBy || !quantity || isNaN(quantity)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    let documentPath: string | null = null;

    // ✅ Save uploaded PDF
    if (document) {
      const bytes = await document.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const safeName = document.name.replace(/\s+/g, "-");
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);

      // ❌ don’t hardcode /chak-dosimetry-ts
      // ✅ just use /uploads, Next.js basePath will prepend automatically
      documentPath = `/uploads/${fileName}`;
    }

    const db = getDB();
    const [result] = await db.query(
      "INSERT INTO requests (hospital, requested_by, phone, location, quantity, status, document) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
      [hospital, requestedBy, phone, location, quantity, documentPath]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error: any) {
    console.error("❌ Error inserting request:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/requests
export async function GET() {
  try {
    const db = getDB();
    const [rows] = await db.query(
      "SELECT id, hospital, requested_by, phone, location, quantity, status, document, created_at FROM requests ORDER BY id DESC"
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("❌ Error fetching requests:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
// You can add more handlers (PUT, DELETE) as needed