// app/api/inventory/hospitals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    let rows: any[] = [];
    if (q.length > 0) {
      // search by substring, limit results
      const like = "%" + q + "%";
      const [r] = await db.query(
        `SELECT DISTINCT hospital_name 
         FROM dosimeters
         WHERE hospital_name IS NOT NULL
           AND hospital_name <> ''
           AND hospital_name LIKE ?
         ORDER BY hospital_name
         LIMIT 50`,
        [like]
      );
      rows = r as any[];
    } else {
      // return top distinct hospital names (limit to 200)
      const [r] = await db.query(
        `SELECT DISTINCT hospital_name 
         FROM dosimeters
         WHERE hospital_name IS NOT NULL
           AND hospital_name <> ''
         ORDER BY hospital_name
         LIMIT 200`
      );
      rows = r as any[];
    }

    const hospitals = (rows || [])
      .map((row) => row.hospital_name)
      .filter(Boolean);

    return NextResponse.json({ hospitals });
  } catch (err: any) {
    console.error("❌ Error fetching hospitals:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
