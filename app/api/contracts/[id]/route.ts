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
      "SELECT id FROM contracts WHERE id = ?",
      [contractId]
    );
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Update contract
    await query(
      `UPDATE contracts SET 
        facility_name = ?, dosimeters = ?, start_date = ?, end_date = ?, 
        status = ?, notes = ?, contact_person = ?, contact_phone = ?, 
        contact_email = ?, facility_type = ?, priority = ?, contract_value = ?,
        renewal_reminder = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        facility_name,
        dosimeters ?? 0,
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