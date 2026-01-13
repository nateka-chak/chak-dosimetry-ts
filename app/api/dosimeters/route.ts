import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";

// GET all dosimeters
export async function GET() {
  try {
    const db = getDB();
    const [rows] = await db.query("SELECT * FROM dosimeters ORDER BY id DESC");
    return NextResponse.json({ dosimeters: rows });
  } catch (error: any) {
    console.error("❌ Error fetching dosimeters:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create a new dosimeter
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      serial_number,
      hospital_name,
      status,
      dosimeter_device,
      dosimeter_case,
      pin_holder,
      strap_clip,
    } = body;

    if (!serial_number) {
      return NextResponse.json(
        { success: false, error: "Serial number is required" },
        { status: 400 }
      );
    }

    const db = getDB();
    const [result] = await db.query(
      `INSERT INTO dosimeters 
        (serial_number, status, hospital_name, dosimeter_device, dosimeter_case, pin_holder, strap_clip) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        serial_number,
        status || "dispatched",
        hospital_name || null,
        dosimeter_device ? 1 : 0,
        dosimeter_case ? 1 : 0,
        pin_holder ? 1 : 0,
        strap_clip ? 1 : 0,
      ]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
    });
  } catch (error: any) {
    console.error("❌ Error creating dosimeter:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
