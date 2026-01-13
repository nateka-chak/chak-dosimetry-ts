// app/api/contracts/route.ts
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

// ✅ POST /api/contracts
export async function POST(req: Request) {
  await ensureDbInitialized();
  try {
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

    if (!facility_name) {
      return NextResponse.json({ error: "facility_name is required" }, { status: 400 });
    }

    const existing = await query<any>(
      "SELECT id FROM contracts WHERE facility_name = ?",
      [facility_name]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Facility '${facility_name}' already exists.` },
        { status: 409 }
      );
    }

    const result = await query<any>(
      `INSERT INTO contracts 
        (facility_name, dosimeters, spectacles, face_masks, medicines, machines, accessories, item_type,
         start_date, end_date, status, notes,
         contact_person, contact_phone, contact_email, facility_type,
         priority, contract_value, renewal_reminder) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        renewal_reminder ?? false
      ]
    );

    // Fetch the created contract to return complete data
    const newContract = await query<any>(
      "SELECT * FROM contracts WHERE id = ?",
      [result.insertId]
    );

    // Create notification for new contract
    try {
      await query(
        "INSERT INTO notifications (type, message, is_read, created_at) VALUES (?, ?, 0, NOW())",
        ['contract', `New contract created for ${facility_name}`]
      );
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

    return NextResponse.json(newContract[0], { status: 201 });
  } catch (error: any) {
    console.error("❌ POST /contracts error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// ✅ GET /api/contracts
export async function GET() {
  await ensureDbInitialized();
  try {
    const contracts = await query<any>(`
      SELECT id, facility_name, dosimeters, spectacles, face_masks, medicines, machines, accessories, item_type,
             start_date, end_date, status, notes, 
             contact_person, contact_phone, contact_email, facility_type,
             priority, contract_value, renewal_reminder, scanned_document,
             created_at, updated_at
      FROM contracts
      ORDER BY facility_name ASC
    `);
    console.log("✅ contracts query result:", contracts.length, "contracts found");

    const expired_contracts = await query<any>(`
      SELECT id, facility_name, dosimeters, expired_at, notes
      FROM expired_contracts
      ORDER BY expired_at DESC
    `);
    console.log("✅ expired_contracts query result:", expired_contracts.length);

    const contractAccessories = await query<any>(`
      SELECT id, description, quantity
      FROM contract_accessories
      ORDER BY description ASC
    `);
    console.log("✅ contract_accessories query result:", contractAccessories.length);

    // Calculate total items across all categories
    const total_items = contracts.reduce((s: number, c: any) => {
      return s + 
        (Number(c.dosimeters) || 0) +
        (Number(c.spectacles) || 0) +
        (Number(c.face_masks) || 0) +
        (Number(c.medicines) || 0) +
        (Number(c.machines) || 0) +
        (Number(c.accessories) || 0);
    }, 0);

    const active_items = contracts
      .filter((c: any) => c.status === 'active')
      .reduce((s: number, c: any) => {
        return s + 
          (Number(c.dosimeters) || 0) +
          (Number(c.spectacles) || 0) +
          (Number(c.face_masks) || 0) +
          (Number(c.medicines) || 0) +
          (Number(c.machines) || 0) +
          (Number(c.accessories) || 0);
      }, 0);

    const expired_uncollected = expired_contracts.reduce(
      (s: number, e: { dosimeters: number }) => s + (Number(e.dosimeters) || 0),
      0
    );

    const summary = {
      total_dosimeters: total_items, // Keep name for backward compatibility
      active_dosimeters: active_items, // Keep name for backward compatibility
      remaining_dosimeters: Math.max(0, total_items - active_items),
      expired_uncollected,
      replaced_dosimeters: 0,
      active_contracts: contracts.filter((c: any) => c.status === 'active').length,
      expiring_soon: contracts.filter((c: any) => {
        if (!c.end_date) return false;
        const endDate = new Date(c.end_date);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
      }).length,
      total_contract_value: contracts.reduce((sum: number, c: any) => sum + (Number(c.contract_value) || 0), 0),
    };

    return NextResponse.json({
      contracts,
      expired_contracts,
      accessories: contractAccessories,
      summary,
    });
  } catch (err: any) {
    console.error("❌ /api/contracts error:", err);
    if (err instanceof Error) {
      console.error("❌ Error stack:", err.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch contracts", details: err.message },
      { status: 500 }
    );
  }
}