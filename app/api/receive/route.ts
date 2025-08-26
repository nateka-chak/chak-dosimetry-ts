import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { extractSerialNumbers } from '@/lib/ocr';
import { ReceiveFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ReceiveFormData = await request.json();
    const { hospitalName, receiverName, receiverTitle, serialNumbers } = body;

    // Validate input
    if (!hospitalName || !receiverName || !receiverTitle || !serialNumbers || serialNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Start transaction
    await query('START TRANSACTION');

    let receivedCount = 0;

    // Process each serial number
    for (const serialNumber of serialNumbers) {
      const result = await query(
        `UPDATE dosimetries 
         SET status = 'received', received_at = NOW(), 
             hospital_name = ?, received_by = ?, receiver_title = ?
         WHERE serial_number = ?`,
        [hospitalName, receiverName, receiverTitle, serialNumber]
      );

      if (result.affectedRows > 0) {
        receivedCount++;
      }
    }

    if (receivedCount === 0) {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'No valid serial numbers found' },
        { status: 400 }
      );
    }

    // Create notification
    await query(
      'INSERT INTO notifications (type, message, is_read) VALUES (?, ?, ?)',
      ['reception', `${hospitalName} has received ${receivedCount} dosimetries. Receiver: ${receiverName} (${receiverTitle})`, 0]
    );

    await query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Dosimetries received successfully',
      data: { receivedCount }
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error receiving dosimetries:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
