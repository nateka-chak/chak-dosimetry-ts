import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export async function POST(request: NextRequest) {
  const pool = getDB();
  const conn = await pool.getConnection();

  try {
    const body = await request.json();
    console.log("📦 Incoming dispatch payload:", body);

    // Allow multiple naming variations from frontend
    const hospital = body.hospital || body.hospitalName || null;
    const address = body.address || body.location || null;
    const contactPerson = body.contactPerson || body.contactName || null;
    const contactPhone = body.contactPhone || body.phone || body.contact || null;
    const courierName = body.courier_name || body.courierName || null;   // ✅ courier_name
    const courierStaff = body.courier_staff || body.courierStaff || null; // ✅ courier_staff
    const dosimeters: string[] = body.dosimeters || body.serials || [];

    // Validation
    if (
      !hospital ||
      !contactPerson ||
      !contactPhone ||
      !courierName ||
      !courierStaff ||
      !Array.isArray(dosimeters) ||
      dosimeters.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "All fields (including courier) are required" },
        { status: 400 }
      );
    }

    // Clean serials
    const serials: string[] = dosimeters
      .map((s: string) => (typeof s === "string" ? s.trim() : ""))
      .filter((s: string) => s.length > 0);

    if (serials.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one valid serial number is required" },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    // Insert shipment with full details
    const [shipmentRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO shipments 
        (destination, address, contact_person, contact_phone, courier_name, courier_staff, status, dispatched_at)
       VALUES (?, ?, ?, ?, ?, ?, 'dispatched', NOW())`,
      [hospital, address, contactPerson, contactPhone, courierName, courierStaff]
    );
    const shipmentId = shipmentRes.insertId;

    // For each dosimeter
    for (const serial of serials) {
      const [existing] = await conn.execute<RowDataPacket[]>(
        `SELECT id FROM dosimeters WHERE serial_number = ?`,
        [serial]
      );

      let dosimeterId: number;

      if (existing.length > 0) {
        dosimeterId = (existing[0] as any).id;

        await conn.execute(
          `UPDATE dosimeters
             SET status = 'dispatched',
                 dispatched_at = NOW(),
                 hospital_name = ?
           WHERE serial_number = ?`,
          [hospital, serial]
        );
      } else {
        const [ins] = await conn.execute<ResultSetHeader>(
          `INSERT INTO dosimeters (serial_number, status, hospital_name, dispatched_at)
           VALUES (?, 'dispatched', ?, NOW())`,
          [serial, hospital]
        );
        dosimeterId = ins.insertId;
      }

      await conn.execute(
        `INSERT INTO shipment_dosimeters (shipment_id, dosimeter_id)
         VALUES (?, ?)`,
        [shipmentId, dosimeterId]
      );
    }

    // Create notification
    await conn.execute(
      `INSERT INTO notifications (type, message, is_read)
       VALUES (?, ?, ?)`,
      [
        "dispatch",
        `New shipment dispatched to ${hospital} by ${courierName} (${courierStaff}) with ${serials.length} dosimeters`,
        0,
      ]
    );

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Dosimeters dispatched successfully",
      data: { shipmentId, dispatchedCount: serials.length },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    console.error("❌ Error dispatching dosimeters:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}

export async function GET() {
  try {
    const pool = getDB();
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT s.*,
             COUNT(sd.dosimeter_id) AS items
        FROM shipments s
   LEFT JOIN shipment_dosimeters sd
          ON s.id = sd.shipment_id
    GROUP BY s.id
    ORDER BY s.dispatched_at DESC
      `
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Error fetching shipments:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}
