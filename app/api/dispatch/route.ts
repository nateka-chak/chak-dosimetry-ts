import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { DispatchFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: DispatchFormData = await request.json();
    const { hospital, address, contactPerson, contactPhone, dosimetries } = body;

    // Validate input
    if (!hospital || !contactPerson || !contactPhone || !dosimetries || dosimetries.length === 0) {
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

    // Process each dosimetry
    for (const serialNumber of dosimetries) {
      // Check if dosimetry exists
      const existingDosimetry = await query(
        'SELECT id FROM dosimetries WHERE serial_number = ?',
        [serialNumber]
      );

      if (existingDosimetry.length > 0) {
        // Update existing dosimetry
        await query(
          `UPDATE dosimetries 
           SET status = 'dispatched', dispatched_at = NOW(), hospital_name = ?
           WHERE serial_number = ?`,
          [hospital, serialNumber]
        );
        
        // Link to shipment
        await query(
          'INSERT INTO shipment_dosimetries (shipment_id, dosimetry_id) VALUES (?, ?)',
          [shipmentId, existingDosimetry[0].id]
        );
      } else {
        // Insert new dosimetry
        const dosimetryResult = await query(
          `INSERT INTO dosimetries (serial_number, status, hospital_name, dispatched_at) 
           VALUES (?, 'dispatched', ?, NOW())`,
          [serialNumber, hospital]
        );
        
        // Link to shipment
        await query(
          'INSERT INTO shipment_dosimetries (shipment_id, dosimetry_id) VALUES (?, ?)',
          [shipmentId, dosimetryResult.insertId]
        );
      }

      processed++;
    }

    // Create notification
    await query(
      'INSERT INTO notifications (type, message, is_read) VALUES (?, ?, ?)',
      ['dispatch', `New shipment dispatched to ${hospital} with ${dosimetries.length} dosimetries`, 0]
    );

    await query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Dosimetries dispatched successfully',
      data: {
        shipmentId,
        dispatchedCount: dosimetries.length
      }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error dispatching dosimetries:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const shipments = await query(`
      SELECT s.*, COUNT(sd.dosimetry_id) as items 
      FROM shipments s 
      LEFT JOIN shipment_dosimetries sd ON s.id = sd.shipment_id 
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
