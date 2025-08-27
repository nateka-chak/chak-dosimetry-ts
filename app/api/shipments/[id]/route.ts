import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { hospitalName, receiverName, receiverTitle, serialNumbers } = body;

    // Update shipment
    await query(
      `UPDATE shipments 
       SET status='delivered' 
       WHERE id=?`,
      [params.id]
    );

    // Update dosimeters
    for (const serial of serialNumbers) {
      await query(
        `UPDATE dosimeters 
         SET status='received', hospital_name=?, received_by=?, receiver_title=?, received_at=NOW() 
         WHERE serial_number=?`,
        [hospitalName, receiverName, receiverTitle, serial]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/shipments error:", err);
    return NextResponse.json({ error: "Failed to update shipment" }, { status: 500 });
  }
}
