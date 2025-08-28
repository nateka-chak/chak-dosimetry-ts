import { NextResponse } from "next/server";
import { query } from "@/lib/database";

// GET all shipments with dynamic in_transit
export async function GET() {
  try {
    const shipments = await query<any>(`
      SELECT 
        s.id,
        s.destination,
        s.address,
        s.contact_person,
        s.contact_phone,
        s.courier_name,
        s.courier_staff,
        s.status,
        s.dispatched_at,
        s.receiver_name,
        s.receiver_title,
        s.created_at,
        CASE 
          WHEN s.status = 'dispatched' 
            AND TIMESTAMPDIFF(HOUR, s.dispatched_at, NOW()) > 1 
          THEN 'in_transit'
          ELSE s.status
        END AS status
      FROM shipments s
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json(shipments);
  } catch (err) {
    console.error("GET /api/shipments error:", err);
    return NextResponse.json({ error: "Failed to fetch shipments" }, { status: 500 });
  }
}

// POST new shipment (dispatch)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { hospital, address, contactPerson, contactPhone, dosimeters, courierName, courierStaff } = body;

    const result: any = await query(
      `INSERT INTO shipments 
        (destination, address, contact_person, contact_phone, courier_name, courier_staff, status, dispatched_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'dispatched', NOW())`,
      [hospital, address, contactPerson, contactPhone, courierName, courierStaff]
    );

    const shipmentId = result.insertId;

    // Link dosimeters
    for (const serial of dosimeters) {
      const [dosimeterResult]: any = await query(
        `INSERT INTO dosimeters (serial_number, status, hospital_name) 
         VALUES (?, 'dispatched', ?) 
         ON DUPLICATE KEY UPDATE status='dispatched', hospital_name=?`,
        [serial, hospital, hospital]
      );

      const dosimeterId =
        dosimeterResult.insertId ||
        (await query<any>(`SELECT id FROM dosimeters WHERE serial_number=?`, [serial]))[0].id;

      await query(
        `INSERT INTO shipment_dosimeters (shipment_id, dosimeter_id) 
         VALUES (?, ?)`,
        [shipmentId, dosimeterId]
      );
    }

    return NextResponse.json({ success: true, shipmentId });
  } catch (err) {
    console.error("POST /api/shipments error:", err);
    return NextResponse.json({ error: "Failed to create shipment" }, { status: 500 });
  }
}

// PATCH: mark shipment as received
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { shipmentId, hospitalName, receiverName, receiverTitle, serialNumbers } = body;

    let shipmentIdToUpdate = shipmentId;

    if (!shipmentIdToUpdate && serialNumbers?.length > 0) {
      const rows: any = await query(
        `SELECT sd.shipment_id
         FROM shipment_dosimeters sd
         JOIN dosimeters d ON sd.dosimeter_id = d.id
         WHERE d.serial_number = ?
         LIMIT 1`,
        [serialNumbers[0]]
      );

      if (rows.length > 0) shipmentIdToUpdate = rows[0].shipment_id;
      else return NextResponse.json({ error: "Could not find shipment for these serials" }, { status: 404 });
    }

    if (!shipmentIdToUpdate)
      return NextResponse.json({ error: "shipmentId or serialNumbers required" }, { status: 400 });

    // Update shipment to delivered
    await query(
      `UPDATE shipments 
       SET status='delivered', receiver_name=?, receiver_title=? 
       WHERE id=?`,
      [receiverName, receiverTitle, shipmentIdToUpdate]
    );

    // Update dosimeters
    if (serialNumbers?.length > 0) {
      for (const serial of serialNumbers) {
        await query(
          `UPDATE dosimeters 
           SET status='received', hospital_name=? 
           WHERE serial_number=?`,
          [hospitalName, serial]
        );
      }
    }

    return NextResponse.json({ success: true, shipmentId: shipmentIdToUpdate });
  } catch (err) {
    console.error("PATCH /api/shipments error:", err);
    return NextResponse.json({ error: "Failed to confirm receipt" }, { status: 500 });
  }
}
