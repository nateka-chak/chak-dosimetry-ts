import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";

// ======================= GET all shipments =======================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hospital = searchParams.get("hospital");
    const partner = searchParams.get("partner");

    let whereClause = "";
    let params: any[] = [];

    if (hospital) {
      whereClause = "WHERE s.destination = ?";
      params.push(hospital);
    } else if (partner) {
      whereClause = "WHERE s.destination = ?";
      params.push(partner);
    }

    const shipments = await query<any>(
      `
      SELECT 
        s.id,
        s.destination,
        s.address,
        s.contact_person,
        s.contact_phone,
        s.courier_name,
        s.courier_staff,
        s.dispatched_at,
        s.receiver_name,
        s.receiver_title,
        s.created_at,
        s.comment,
        COUNT(sd.dosimeter_id) AS items,
        CASE 
          WHEN s.status = 'dispatched' 
            AND TIMESTAMPDIFF(HOUR, s.dispatched_at, NOW()) > 1 
          THEN 'in_transit'
          ELSE s.status
        END AS status
      FROM shipments s
      LEFT JOIN shipment_dosimeters sd ON s.id = sd.shipment_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.created_at DESC
      `,
      params
    );

    return NextResponse.json({ success: true, data: shipments });
  } catch (err) {
    console.error("GET /api/shipments error:", err);
    return NextResponse.json(
      { success: false, data: [], error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

// ======================= POST new shipment =======================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      hospital,
      address,
      contactPerson,
      contactPhone,
      dosimeters,
      courierName,
      courierStaff,
      comment,
    } = body;

    const result: any = await query(
      `INSERT INTO shipments 
        (destination, address, contact_person, contact_phone, courier_name, courier_staff, status, dispatched_at, comment) 
       VALUES (?, ?, ?, ?, ?, ?, 'dispatched', NOW(), ?)`,
      [
        hospital,
        address,
        contactPerson,
        contactPhone,
        courierName,
        courierStaff,
        comment,
      ]
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
        (
          await query<any>(`SELECT id FROM dosimeters WHERE serial_number=?`, [
            serial,
          ])
        )[0].id;

      await query(
        `INSERT INTO shipment_dosimeters (shipment_id, dosimeter_id) 
         VALUES (?, ?)`,
        [shipmentId, dosimeterId]
      );
    }

    return NextResponse.json({ success: true, shipmentId });
  } catch (err) {
    console.error("POST /api/shipments error:", err);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}

// ======================= PATCH: mark shipment as received =======================
// ======================= PATCH: mark shipment as received or returned =======================
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      shipmentId,
      hospitalName,
      receiverName,
      receiverTitle,
      serialNumbers,
      dosimeterIds,
      status, // 👈 new field coming from frontend ("received" | "returned")
    } = body;

    let shipmentIdToUpdate = shipmentId;

    // Resolve shipmentId dynamically if not provided
    if (!shipmentIdToUpdate) {
      if (dosimeterIds?.length > 0) {
        const rows: any = await query(
          `SELECT shipment_id FROM shipment_dosimeters WHERE dosimeter_id = ? LIMIT 1`,
          [dosimeterIds[0]]
        );
        if (rows.length > 0) shipmentIdToUpdate = rows[0].shipment_id;
      } else if (serialNumbers?.length > 0) {
        const rows: any = await query(
          `SELECT sd.shipment_id
           FROM shipment_dosimeters sd
           JOIN dosimeters d ON sd.dosimeter_id = d.id
           WHERE d.serial_number = ?
           LIMIT 1`,
          [serialNumbers[0]]
        );
        if (rows.length > 0) shipmentIdToUpdate = rows[0].shipment_id;
      }
    }

    if (!shipmentIdToUpdate) {
      return NextResponse.json(
        { error: "shipmentId, dosimeterIds, or serialNumbers required" },
        { status: 400 }
      );
    }

    // 🧠 Decide final status
    const isReturn = status === "returned";
    const shipmentStatus = isReturn ? "returned" : "delivered";
    const dosimeterStatus = isReturn ? "returned" : "received";

    // ✅ Update shipment
    await query(
      `UPDATE shipments 
       SET status=?, receiver_name=?, receiver_title=? 
       WHERE id=?`,
      [shipmentStatus, receiverName, receiverTitle, shipmentIdToUpdate]
    );

    // ✅ Update dosimeters
    if (dosimeterIds?.length > 0) {
      for (const id of dosimeterIds) {
        await query(
          `UPDATE dosimeters 
           SET status=?, hospital_name=? 
           WHERE id=?`,
          [dosimeterStatus, hospitalName, id]
        );
      }
    } else if (serialNumbers?.length > 0) {
      for (const serial of serialNumbers) {
        await query(
          `UPDATE dosimeters 
           SET status=?, hospital_name=? 
           WHERE serial_number=?`,
          [dosimeterStatus, hospitalName, serial]
        );
      }
    }

    return NextResponse.json({
      success: true,
      shipmentId: shipmentIdToUpdate,
      updatedCount: dosimeterIds?.length || serialNumbers?.length || 0,
      message: isReturn
        ? "Dosimeters marked as returned to CHAK."
        : "Shipment marked as received.",
    });
  } catch (err) {
    console.error("PATCH /api/shipments error:", err);
    return NextResponse.json(
      { error: "Failed to confirm receipt" },
      { status: 500 }
    );
  }
}