import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const { hospital, requestedBy, quantity } = await req.json();

    const db = getDB();
    const [result] = await db.query(
      "INSERT INTO requests (hospital, requested_by, quantity, status) VALUES (?, ?, ?, 'pending')",
      [hospital, requestedBy, quantity]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error: any) {
    console.error("Error inserting request:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDB();
    const [rows] = await db.query("SELECT * FROM requests ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
