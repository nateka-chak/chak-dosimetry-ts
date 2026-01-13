import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function GET() {
  try {
    const hospitals = await query<any>(
      `SELECT DISTINCT destination FROM shipments WHERE destination IS NOT NULL AND destination <> '' ORDER BY destination ASC`
    );
    return NextResponse.json({ success: true, data: hospitals });
  } catch (err) {
    console.error("GET /api/hospitals error:", err);
    return NextResponse.json({ success: false, data: [], error: "Failed to fetch hospitals" }, { status: 500 });
  }
}
