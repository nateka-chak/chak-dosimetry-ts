// app/api/dosimeters/available/route.ts
import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { RowDataPacket } from "mysql2/promise";

export async function GET() {
  try {
    const pool = getDB();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, serial_number 
         FROM dosimeters 
        WHERE status = 'available' 
        ORDER BY id ASC`
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Error fetching available dosimeters:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch available dosimeters" },
      { status: 500 }
    );
  }
}
