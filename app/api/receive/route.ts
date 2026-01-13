import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

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

    // ✅ New condition fields
    const { dosimeter_device, dosimeter_case, pin_holder, strap_clip } = body;
    // ✅ Optional fields that might be sent
    const { id, received_by, receiver_title, status } = body;

    if (
      !hospital ||
      !receiver ||
      !receiverTitle ||
      !id ||
      !received_by ||
      !receiver_title ||
      !Array.isArray(serialNumbers) ||
      serialNumbers.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // ✅ Validate hospital exists
    const [hospitalCheck] = await conn.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as c FROM dosimeters WHERE hospital_name = ?`,
      [hospital]
    );
    if ((hospitalCheck as any)[0].c === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid hospital. Not found in system." },
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
    let shipmentIdToUpdate: number | null = null;
    let courierName: string | null = null;
    let courierStaff: string | null = null;

    // ✅ Determine final shipment status — default "delivered", unless "returned" is explicitly sent
    const finalShipmentStatus =
      status && status.toLowerCase() === "returned" ? "returned" : "delivered";

    for (const serial of serials) {
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
           SET status = ?,
               received_at = NOW(),
               hospital_name = ?,
               received_by = ?,
               receiver_title = ?,
               dosimeter_device = ?,
               dosimeter_case = ?,
               pin_holder = ?,
               strap_clip = ?
         WHERE serial_number = ?`,
        [
          finalShipmentStatus === "returned" ? "returned" : "received",
          hospital,
          receiver,
          receiverTitle,
          dosimeter_device ? 1 : 0,
          dosimeter_case ? 1 : 0,
          pin_holder ? 1 : 0,
          strap_clip ? 1 : 0,
          serial,
        ]
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

    // ✅ Update shipment status accordingly
    if (shipmentIdToUpdate) {
      await conn.execute(
        `UPDATE shipments
           SET status = ?
           WHERE id = ?`,
        [finalShipmentStatus, shipmentIdToUpdate]
      );
    }

    // ✅ Send proper notification
    const notifType = finalShipmentStatus === "returned" ? "return" : "reception";
    const notifMessage =
      finalShipmentStatus === "returned"
        ? `${hospital} has returned ${receivedCount} item${receivedCount !== 1 ? 's' : ''}. Receiver: ${receiver} (${receiverTitle})`
        : `${hospital} has received ${receivedCount} item${receivedCount !== 1 ? 's' : ''}. Receiver: ${receiver} (${receiverTitle})`;

    await conn.execute(
      `INSERT INTO notifications (type, message, is_read)
       VALUES (?, ?, ?)`,
      [notifType, notifMessage, 0]
    );

    await conn.commit();

    return NextResponse.json({
      success: true,
      message:
        finalShipmentStatus === "returned"
          ? "Items returned successfully"
          : "Items received successfully",
      data: {
        receivedCount,
        shipmentId: shipmentIdToUpdate,
        courierName,
        courierStaff,
        finalShipmentStatus,
      },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    console.error("❌ Error receiving/returning dosimeters:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
