import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    const { id } = params;
    const { action, comment } = await req.json();

    if (!action) {
      return NextResponse.json(
        { success: false, error: "No action provided" },
        { status: 400 }
      );
    }

    // ✅ 1. Check if request exists
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM requests WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // ✅ 2. Update status and comment (nullable)
    await db.query<ResultSetHeader>(
      "UPDATE requests SET status = ?, comment = ? WHERE id = ?",
      [action, comment || null, id]
    );

    const request = rows[0];
    const { hospital, requested_by, quantity } = request;

    // ✅ 3. If approved, optionally adjust inventory (optional logic)
    if (action === "approved") {
      await db.query(
        `
        UPDATE inventory 
        SET available_quantity = GREATEST(available_quantity - ?, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE item_name = 'Dosimeter'
        `,
        [quantity]
      );
    }

    // ✅ 4. Create notification for approval/rejection
    const notificationType = action === "approved" ? "approval" : "rejection";
    const notificationMessage = action === "approved"
      ? `Request from ${hospital} for ${quantity} item${quantity !== 1 ? 's' : ''} has been approved. Requested by: ${requested_by}`
      : `Request from ${hospital} for ${quantity} item${quantity !== 1 ? 's' : ''} has been rejected${comment ? `: ${comment}` : ''}. Requested by: ${requested_by}`;

    await db.query(
      "INSERT INTO notifications (type, message, is_read) VALUES (?, ?, 0)",
      [notificationType, notificationMessage]
    ).catch((err) => {
      console.error("Failed to create notification for approval/rejection:", err);
      // Don't fail the approval/rejection if notification fails
    });

    return NextResponse.json({
      success: true,
      message: `Request ${action} successfully`,
    });
  } catch (err: any) {
    console.error("❌ Error in PATCH /api/approvals/[id]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error while updating request" },
      { status: 500 }
    );
  }
}
