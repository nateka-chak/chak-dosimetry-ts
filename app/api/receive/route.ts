import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { ResultSetHeader } from "mysql2/promise";

// Payload can be:
// {
//   hospitalName | hospital: string,
//   receiverName | receiver: string,
//   receiverTitle | title: string,
//   serialNumbers | dosimeters | serials: string[]
// }

export async function POST(request: NextRequest) {
  const pool = getDB();
  const conn = await pool.getConnection();

  try {
    const body = await request.json();
    console.log("📥 Incoming receive payload:", body);

    // Map variations
    const hospital =
      body.hospital || body.hospitalName || null;
    const receiver =
      body.receiverName || body.receiver || null;
    const receiverTitle =
      body.receiverTitle || body.title || null;
    const serialNumbers: string[] =
      body.serialNumbers || body.dosimeters || body.serials || [];

    // Validation
    if (
      !hospital ||
      !receiver ||
      !receiverTitle ||
      !Array.isArray(serialNumbers) ||
      serialNumbers.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Clean serials
    const serials: string[] = serialNumbers
      .map((s: string) => (typeof s === "string" ? s.trim() : ""))
      .filter((s: string) => s.length > 0);

    if (serials.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one valid serial number is required" },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    let receivedCount = 0;

    // Update each dosimeter
    for (const serial of serials) {
      const [res] = await conn.execute<ResultSetHeader>(
        `UPDATE dosimeters
            SET status = 'received',
                received_at = NOW(),
                hospital_name = ?,
                received_by = ?,
                receiver_title = ?
          WHERE serial_number = ?`,
        [hospital, receiver, receiverTitle, serial]
      );
      if (res.affectedRows > 0) receivedCount++;
    }

    if (receivedCount === 0) {
      await conn.rollback();
      return NextResponse.json(
        { success: false, error: "No valid serial numbers found" },
        { status: 400 }
      );
    }

    // Create notification
    await conn.execute(
      `INSERT INTO notifications (type, message, is_read)
       VALUES (?, ?, ?)`,
      [
        "reception",
        `${hospital} has received ${receivedCount} dosimeter(s). Receiver: ${receiver} (${receiverTitle})`,
        0,
      ]
    );

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Dosimeters received successfully",
      data: { receivedCount },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    console.error("❌ Error receiving dosimeters:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
