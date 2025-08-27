import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

// GET: latest notifications
export async function GET() {
  try {
    const pool = getDB();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10`
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST: mark a notification as read (expects { id: number })
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification id is required" },
        { status: 400 }
      );
    }

    const pool = getDB();
    const [res] = await pool.execute<ResultSetHeader>(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`,
      [id]
    );

    if (res.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (err) {
    console.error("Error updating notification:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
