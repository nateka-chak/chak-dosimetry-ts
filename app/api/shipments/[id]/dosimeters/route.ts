import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shipmentId = params.id;

    // Fetch dosimeters associated with this shipment
    const dosimeters = await query<any>(
      `
      SELECT 
        d.id,
        d.serial_number,
        d.model,
        d.type,
        d.status,
        d.hospital_name,
        d.created_at
      FROM dosimeters d
      INNER JOIN shipment_dosimeters sd ON d.id = sd.dosimeter_id
      WHERE sd.shipment_id = ?
      ORDER BY d.serial_number ASC
      `,
      [shipmentId]
    );

    return NextResponse.json({ 
      success: true, 
      data: dosimeters,
      count: dosimeters.length 
    });
  } catch (err) {
    console.error(`GET /api/shipments/${params.id}/dosimeters error:`, err);
    return NextResponse.json(
      { 
        success: false, 
        data: [], 
        error: "Failed to fetch shipment dosimeters" 
      },
      { status: 500 }
    );
  }
}