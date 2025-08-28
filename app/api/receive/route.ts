import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { ResultSetHeader } from "mysql2/promise";

export async function POST(request: NextRequest) {
  const pool = getDB();
  const conn = await pool.getConnection();

  try {
    const body = await request.json();
    console.log("📥 Incoming receive payload:", body);

    const hospital = body.hospital || body.hospitalName || null;
    const receiver = body.receiverName || body.receiver || null;
    const receiverTitle = body.receiverTitle || body.title || null;
    const serialNumbers: string[] =
      body.serialNumbers || body.dosimeters || body.serials || [];

    if (!hospital || !receiver || !receiverTitle || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    // Clean serials
    const serials: string[] = serialNumbers
      .map((s: string) => (typeof s === "string" ? s.trim() : ""))
      .filter((s: string) => s.length > 0);

    if (serials.length === 0) {
      return NextResponse.json({ success: false, error: "At least one valid serial number is required" }, { status: 400 });
    }

    await conn.beginTransaction();

    let receivedCount = 0;
    let shipmentIdToUpdate: number | null = null;
    let courierName: string | null = null;
    let courierStaff: string | null = null;

    // Update each dosimeter and find the shipment
    for (const serial of serials) {
      // Get shipment info if not already
      if (!shipmentIdToUpdate) {
        const [rows]: any = await conn.execute(
          `SELECT sd.shipment_id, s.courier_name, s.courier_staff
           FROM shipment_dosimeters sd
           JOIN shipments s ON sd.shipment_id = s.id
           JOIN dosimeters d ON sd.dosimeter_id = d.id
           WHERE d.serial_number = ?
           LIMIT 1`,
          [serial]
        );
        if (rows.length > 0) {
          shipmentIdToUpdate = rows[0].shipment_id;
          courierName = rows[0].courier_name;
          courierStaff = rows[0].courier_staff;
        }
      }

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
      return NextResponse.json({ success: false, error: "No valid serial numbers found" }, { status: 400 });
    }

    // ✅ Update shipment status to delivered and keep courier info
    if (shipmentIdToUpdate) {
      await conn.execute(
        `UPDATE shipments
           SET status = 'delivered'
           WHERE id = ?`,
        [shipmentIdToUpdate]
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
      data: {
        receivedCount,
        shipmentId: shipmentIdToUpdate,
        courierName,
        courierStaff
      },
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error("❌ Error receiving dosimeters:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  } finally {
    conn.release();
  }
}
