import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { ResultSetHeader } from "mysql2/promise";

// Payload shape expected from your ReceiveForm:
// {
//   hospitalName: string,
//   receiverName: string,
//   receiverTitle: string,
//   serialNumbers: string[]
// }

export async function POST(request: NextRequest) {
  const pool = getDB();
  const conn = await pool.getConnection();

  try {
    const body = await request.json();
    const { hospitalName, receiverName, receiverTitle, serialNumbers } = body ?? {};

    if (
      !hospitalName ||
      !receiverName ||
      !receiverTitle ||
      !Array.isArray(serialNumbers) ||
      serialNumbers.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

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

    for (const serial of serials) {
      const [res] = await conn.execute<ResultSetHeader>(
        `UPDATE dosimeters
            SET status = 'received',
                received_at = NOW(),
                hospital_name = ?,
                received_by = ?,
                receiver_title = ?
          WHERE serial_number = ?`,
        [hospitalName, receiverName, receiverTitle, serial]
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

    await conn.execute(
      `INSERT INTO notifications (type, message, is_read)
       VALUES (?, ?, ?)`,
      ["reception", `${hospitalName} has received ${receivedCount} dosimeters. Receiver: ${receiverName} (${receiverTitle})`, 0]
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
    console.error("Error receiving dosimeters:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
