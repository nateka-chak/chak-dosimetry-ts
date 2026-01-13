// app/api/contracts/[id]/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/database";
import { initDatabase } from "@/lib/database";

// Ensure DB tables are initialized before handling requests
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// ✅ GET /api/contracts/[id] - Get single contract
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await ensureDbInitialized();
  try {
    const contractId = params.id;

    const contracts = await query<any>(
      `SELECT id, facility_name, dosimeters, start_date, end_date, status, notes, 
              contact_person, contact_phone, contact_email, facility_type,
              priority, contract_value, renewal_reminder, scanned_document,
              created_at, updated_at
       FROM contracts WHERE id = ?`,
      [contractId]
    );

    if (contracts.length === 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json(contracts[0]);
  } catch (error: any) {
    console.error("❌ GET /contracts/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// ✅ PUT /api/contracts/[id] - Update contract
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await ensureDbInitialized();
  try {
    const contractId = params.id;
    const body = await req.json();
    const {
      facility_name,
      dosimeters,
      spectacles,
      face_masks,
      medicines,
      machines,
      accessories,
      item_type,
      start_date,
      end_date,
      status,
      notes,
      contact_person,
      contact_phone,
      contact_email,
      facility_type,
      priority,
      contract_value,
      renewal_reminder,
    } = body;

    // Check if contract exists
    const existing = await query<any>(
      "SELECT id, status FROM contracts WHERE id = ?",
      [contractId]
    );
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const previousStatus = existing[0].status;

    // Update contract
    await query(
      `UPDATE contracts SET 
        facility_name = ?, dosimeters = ?, spectacles = ?, face_masks = ?, medicines = ?, machines = ?, accessories = ?, item_type = ?,
        start_date = ?, end_date = ?, 
        status = ?, notes = ?, contact_person = ?, contact_phone = ?, 
        contact_email = ?, facility_type = ?, priority = ?, contract_value = ?,
        renewal_reminder = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        facility_name,
        dosimeters ?? 0,
        spectacles ?? 0,
        face_masks ?? 0,
        medicines ?? 0,
        machines ?? 0,
        accessories ?? 0,
        item_type ?? 'all',
        start_date ?? null,
        end_date ?? null,
        status ?? "active",
        notes ?? null,
        contact_person ?? null,
        contact_phone ?? null,
        contact_email ?? null,
        facility_type ?? null,
        priority ?? null,
        contract_value ?? null,
        renewal_reminder ?? false,
        contractId
      ]
    );

    // Fetch updated contract
    const updatedContract = await query<any>(
      "SELECT * FROM contracts WHERE id = ?",
      [contractId]
    );

    // Create notification if status changed
    if (previousStatus !== status) {
      try {
        let notificationMessage = '';
        if (status === 'active' && previousStatus !== 'active') {
          notificationMessage = `Contract with ${facility_name} has been renewed/activated.`;
        } else if (status === 'expired') {
          notificationMessage = `Contract with ${facility_name} has expired. Please contact them for renewal.`;
        } else if (status === 'terminated') {
          notificationMessage = `Contract with ${facility_name} has been terminated.`;
        }
        
        if (notificationMessage) {
          await query(
            "INSERT INTO notifications (type, message, is_read, created_at) VALUES (?, ?, 0, NOW())",
            ['contract', notificationMessage]
          );
        }
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }
    }

    return NextResponse.json(updatedContract[0]);
  } catch (error: any) {
    console.error("❌ PUT /contracts/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// ✅ DELETE /api/contracts/[id] - Delete contract
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await ensureDbInitialized();
  try {
    const contractId = params.id;

    // Check if contract exists
    const existing = await query<any>(
      "SELECT id FROM contracts WHERE id = ?",
      [contractId]
    );
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Delete contract
    await query("DELETE FROM contracts WHERE id = ?", [contractId]);

    return NextResponse.json({ message: "Contract deleted successfully" });
  } catch (error: any) {
    console.error("❌ DELETE /contracts/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}