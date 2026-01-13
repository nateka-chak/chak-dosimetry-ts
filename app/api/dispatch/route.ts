import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export async function POST(request: NextRequest) {
  const pool = getDB();
  const conn = await pool.getConnection();

  try {
    const body = await request.json();
    console.log("📦 Incoming dispatch payload:", body);

    const hospital = body.hospital || body.hospitalName || null;
    const address = body.address || body.location || null;
    const contactPerson = body.contactPerson || body.contactName || null;
    const contactPhone = body.contactPhone || body.phone || body.contact || null;
    const courierName = body.courier_name || body.courierName || null;
    const courierStaff = body.courier_staff || body.courierStaff || null;
    const dosimeterIds: number[] = body.dosimeterIds || []; // ✅ New: array of dosimeter IDs
    const comment = body.comment || null;

    // ✅ Condition fields (optional, batch applies same condition to all)
    const { dosimeter_device, dosimeter_case, pin_holder, strap_clip } = body;

    if (
      !hospital ||
      !contactPerson ||
      !contactPhone ||
      !courierName ||
      !courierStaff ||
      !Array.isArray(dosimeterIds) ||
      dosimeterIds.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "All fields (including dosimeters) are required" },
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

    await conn.beginTransaction();

    // ✅ Create shipment
    const [shipmentRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO shipments 
        (destination, address, contact_person, contact_phone, courier_name, courier_staff, status, dispatched_at, comment)
       VALUES (?, ?, ?, ?, ?, ?, 'dispatched', NOW(), ?)`,
      [hospital, address, contactPerson, contactPhone, courierName, courierStaff, comment]
    );
    const shipmentId = (shipmentRes as any).insertId;

    // ✅ Update all selected dosimeters in one batch
    await conn.query(
      `UPDATE dosimeters
          SET status = 'dispatched',
              dispatched_at = NOW(),
              hospital_name = ?,
              dosimeter_device = ?,
              dosimeter_case = ?,
              pin_holder = ?,
              strap_clip = ?
        WHERE id IN (?) AND status = 'available'`,
      [
        hospital,
        dosimeter_device ? 1 : 0,
        dosimeter_case ? 1 : 0,
        pin_holder ? 1 : 0,
        strap_clip ? 1 : 0,
        dosimeterIds,
      ]
    );

    // ✅ Link dosimeters to this shipment
    const shipmentValues = dosimeterIds.map((id) => [shipmentId, id]);
    await conn.query(
      `INSERT INTO shipment_dosimeters (shipment_id, dosimeter_id) VALUES ?`,
      [shipmentValues]
    );

    // ✅ Add notification
    await conn.execute(
      `INSERT INTO notifications (type, message, is_read)
       VALUES (?, ?, ?)`,
      [
        "dispatch",
        `New shipment dispatched to ${hospital} by ${courierName} (${courierStaff}) with ${dosimeterIds.length} dosimeters`,
        0,
      ]
    );

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Dosimeters dispatched successfully",
      data: { shipmentId, dispatchedCount: dosimeterIds.length },
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

// ✅ New endpoint: fetch available dosimeters for dropdown
export async function GET_AVAILABLE() {
  try {
    const pool = getDB();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, serial_number FROM dosimeters WHERE status = 'available' ORDER BY id ASC`
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Error fetching available dosimeters:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch available dosimeters" },
      { status: 500 }
    );
  }
}
