import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

// GET: fetch all notifications with stats
export async function GET() {
  try {
    const db = getDB();

    console.log("🔍 Fetching notifications from database...");

    // Get all notifications
    const [notifications] = await db.query<RowDataPacket[]>(
      "SELECT id, type, message, is_read, created_at, updated_at FROM notifications ORDER BY created_at DESC, id DESC"
    );

    console.log("✅ Notifications fetched:", notifications.length);

    // Get stats
    const [totalResult] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM notifications");
    const [unreadResult] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as unread FROM notifications WHERE is_read = 0");
    
    const total = totalResult[0]?.total || 0;
    const unread = unreadResult[0]?.unread || 0;
    const read = total - unread;

    console.log("📊 Stats - Total:", total, "Unread:", unread, "Read:", read);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: 1,
          limit: 50,
          total,
          totalPages: 1
        },
        unreadCount: unread,
        stats: {
          total,
          unread,
          read
        }
      }
    });
  } catch (error: any) {
    console.error("❌ Error fetching notifications:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// POST: create new notification
export async function POST(request: Request) {
  try {
    const { type, message } = await request.json();

    if (!type || !message) {
      return NextResponse.json(
        { success: false, error: "Type and message are required" },
        { status: 400 }
      );
    }

    const db = getDB();
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO notifications (type, message, is_read, created_at, updated_at) 
       VALUES (?, ?, 0, NOW(), NOW())`,
      [type, message]
    );

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertId,
        type,
        message,
        is_read: 0,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("POST /api/notifications error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PATCH: update notification (mark as read/unread, mark all as read)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, is_read, markAllAsRead } = body;

    const db = getDB();

    if (markAllAsRead) {
      // Mark all notifications as read
      const [result] = await db.execute<ResultSetHeader>(
        "UPDATE notifications SET is_read = 1, updated_at = NOW() WHERE is_read = 0"
      );
      
      return NextResponse.json({
        success: true,
        message: `Marked ${result.affectedRows} notifications as read`
      });
    }

    if (!id || typeof is_read === 'undefined') {
      return NextResponse.json(
        { success: false, error: "ID and is_read are required" },
        { status: 400 }
      );
    }

    const [result] = await db.execute<ResultSetHeader>(
      "UPDATE notifications SET is_read = ?, updated_at = NOW() WHERE id = ?",
      [is_read ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Notification ${is_read ? 'marked as read' : 'marked as unread'}`
    });
  } catch (err) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE: delete notification or all read notifications
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, deleteAllRead } = body;

    const db = getDB();

    if (deleteAllRead) {
      // Delete all read notifications
      const [result] = await db.execute<ResultSetHeader>(
        "DELETE FROM notifications WHERE is_read = 1"
      );
      
      return NextResponse.json({
        success: true,
        message: `Deleted ${result.affectedRows} read notifications`
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const [result] = await db.execute<ResultSetHeader>(
      "DELETE FROM notifications WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (err) {
    console.error("DELETE /api/notifications error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}