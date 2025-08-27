import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { DispatchFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: DispatchFormData = await request.json();
    const { hospital, address, contactPerson, contactPhone, dosimeters } = body;

    // Validate input
    if (!hospital || !contactPerson || !contactPhone || !dosimeters || dosimeters.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Start transaction
    await query('START TRANSACTION');

    // Insert shipment
    const shipmentResult = await query(
      `INSERT INTO shipments (destination, address, contact_person, contact_phone, status) 
       VALUES (?, ?, ?, ?, 'dispatched')`,
      [hospital, address, contactPerson, contactPhone]
    );

    const shipmentId = shipmentResult.insertId;
    let processed = 0;

    // Process each dosimeter
    for (const serialNumber of dosimeters) {
      // Check if dosimeter exists
      const existingdosimeter = await query(
        'SELECT id FROM dosimeters WHERE serial_number = ?',
        [serialNumber]
      );

      if (existingdosimeter.length > 0) {
        // Update existing dosimeter
        await query(
          `UPDATE dosimeters 
           SET status = 'dispatched', dispatched_at = NOW(), hospital_name = ?
           WHERE serial_number = ?`,
          [hospital, serialNumber]
        );
        
        // Link to shipment
        await query(
          'INSERT INTO shipment_dosimeters (shipment_id, dosimeter_id) VALUES (?, ?)',
          [shipmentId, existingdosimeter[0].id]
        );
      } else {
        // Insert new dosimeter
        const dosimeterResult = await query(
          `INSERT INTO dosimeters (serial_number, status, hospital_name, dispatched_at) 
           VALUES (?, 'dispatched', ?, NOW())`,
          [serialNumber, hospital]
        );
        
        // Link to shipment
        await query(
          'INSERT INTO shipment_dosimeters (shipment_id, dosimeter_id) VALUES (?, ?)',
          [shipmentId, dosimeterResult.insertId]
        );
      }

      processed++;
    }

    // Create notification
    await query(
      'INSERT INTO notifications (type, message, is_read) VALUES (?, ?, ?)',
      ['dispatch', `New shipment dispatched to ${hospital} with ${dosimeters.length} dosimeters`, 0]
    );

    await query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'dosimeters dispatched successfully',
      data: {
        shipmentId,
        dispatchedCount: dosimeters.length
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error dispatching dosimeters:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const shipments = await query(`
      SELECT s.*, COUNT(sd.dosimeter_id) as items 
      FROM shipments s 
      LEFT JOIN shipment_dosimeters sd ON s.id = sd.shipment_id 
      GROUP BY s.id 
      ORDER BY s.dispatched_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: shipments
    });

  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}
