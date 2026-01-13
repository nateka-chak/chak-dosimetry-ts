import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { RowDataPacket } from "mysql2/promise";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const statusParam = (searchParams.get("status") || "").trim();
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const offset = Number(searchParams.get("offset") || 0);

    const db = getDB();
    const params: any[] = [];

    let sql = `
      SELECT id, serial_number, model, type, status, hospital_name 
      FROM dosimeters 
      WHERE 1=1
    `;

    // ✅ Handle multiple statuses like "available,returned"
    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        sql += ` AND status IN (${statuses.map(() => "?").join(",")})`;
        params.push(...statuses);
      }
    }

    // 🔍 Handle text search
    if (q) {
      sql += ` AND (serial_number LIKE ? OR model LIKE ? OR type LIKE ? OR hospital_name LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query<RowDataPacket[]>(sql, params);
    const hasMore = rows.length >= limit;

    return new NextResponse(
      JSON.stringify({ rows, hasMore }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store", // disable caching
        },
      }
    );
  } catch (err: any) {
    console.error("❌ inventory search error:", err);
    return new NextResponse(
      JSON.stringify({ error: err.message || "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
