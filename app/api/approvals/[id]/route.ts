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

    // ✅ 3. If approved, optionally adjust inventory (optional logic)
    if (action === "approved") {
      const { quantity } = rows[0];

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
