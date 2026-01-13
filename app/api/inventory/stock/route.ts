import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";

export async function GET() {
  try {
    const db = getDB();
    const [rows] = await db.query("SELECT COUNT(*) as stock FROM dosimeters WHERE status = 'available'");
    const stock = (rows as any)[0]?.stock || 0;

    return NextResponse.json({ stock });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
