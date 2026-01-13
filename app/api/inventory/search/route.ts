import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { RowDataPacket } from "mysql2/promise";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const statusParam = (searchParams.get("status") || "").trim();
    const category = (searchParams.get("category") || "dosimeter").toLowerCase();
    const shouldFilterByType = category !== "all" && category !== "dosimeter";
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const offset = Number(searchParams.get("offset") || 0);

    const db = getDB();
    const params: (string | number)[] = [];

    const filters: string[] = [];
    // Only narrow down by type for non-default categories so that the main
    // Dosimeters view always shows all records from the dosimeters table.
    if (shouldFilterByType) {
      filters.push("LOWER(type) = ?");
      params.push(category);
    }

    let sql = `
      SELECT id, serial_number, model, type, status, hospital_name
      FROM dosimeters
    `;

    if (filters.length) {
      sql += ` WHERE ${filters.join(" AND ")}`;
    }

    // ✅ Handle multiple statuses like "available,returned"
    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        sql += `${filters.length ? " AND" : " WHERE"} status IN (${statuses.map(() => "?").join(",")})`;
        params.push(...statuses);
      }
    }

    // 🔍 Handle text search
    if (q) {
      sql += `${filters.length || statusParam ? " AND" : " WHERE"} (serial_number LIKE ? OR model LIKE ? OR type LIKE ? OR hospital_name LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query<RowDataPacket[]>(sql, params);
    const hasMore = rows.length >= limit;

    // Add category field for compatibility
    const rowsWithCategory = rows.map((r) => ({
      ...r,
      category: category === "all" ? (r.type?.toLowerCase() || "dosimeter") : category,
    }));

    return new NextResponse(
      JSON.stringify({ rows: rowsWithCategory, hasMore }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store", // disable caching
        },
      }
    );
  } catch (err) {
    console.error("❌ inventory search error:", err);
    const errorMessage = err instanceof Error ? err.message : "Server error";
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
