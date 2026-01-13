import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const { serials } = await req.json();

    if (!serials || !Array.isArray(serials)) {
      return NextResponse.json({ success: false, error: "Invalid serials" }, { status: 400 });
    }

    const db = getDB();
    let added = 0;

    for (const serial of serials) {
      await db.query("INSERT INTO dosimeters (serial_number, status) VALUES (?, 'available')", [serial]);
      added++;
    }

    return NextResponse.json({ success: true, added });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
