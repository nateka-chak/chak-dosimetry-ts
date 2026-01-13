// app/api/items/route.ts (Next 13 app router style)
import { NextResponse } from 'next/server';
import { getDB } from '@/lib/database';
import type { RowDataPacket } from 'mysql2/promise';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const page = Number(url.searchParams.get('page') || 1);
    const limit = Number(url.searchParams.get('limit') || 20);
    const offset = (page - 1) * limit;

    const db = getDB();
    
    // For now, if category is 'dosimeter' or empty, return dosimeters
    // TODO: Implement unified items table with category support
    if (!category || category === 'dosimeter') {
      const [items] = await db.query<RowDataPacket[]>(
        `SELECT id, serial_number as serialNumber, model, type, status, 
         hospital_name as hospitalName, expiry_date as expiryDate, 
         created_at as createdAt, updated_at as updatedAt
         FROM dosimeters 
         ORDER BY updated_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return NextResponse.json({ items: items.map(item => ({
        ...item,
        category: { key: 'dosimeter', label: 'Dosimeters' }
      })) });
    }

    // For other categories, return empty array until unified items table is implemented
    return NextResponse.json({ items: [] });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
