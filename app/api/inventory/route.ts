import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

// helper to log history (unified for all item types)
async function logHistory(
  db: ReturnType<typeof getDB>,
  itemId: number,
  category: string,
  action: string,
  hospital: string | null = null,
  actor: string = "system",
  notes: string | null = null
) {
  // Use unified item_history table
  await db.query(
    "INSERT INTO item_history (item_id, category, action, hospital_name, actor, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [itemId, category, action, hospital, actor, notes]
  );
  
  // Also log to dosimeter_history for backward compatibility if category is dosimeter
  if (category === "dosimeter") {
    try {
      await db.query(
        "INSERT INTO dosimeter_history (dosimeter_id, action, hospital_name, actor, notes) VALUES (?, ?, ?, ?, ?)",
        [itemId, action, hospital, actor, notes]
      );
    } catch (err) {
      // Ignore if dosimeter_history table doesn't exist or has issues
      console.warn("Could not log to dosimeter_history:", err);
    }
  }
}

// ✅ GET: fetch inventory stats + all records (supports category filtering)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "dosimeter").toLowerCase();
    
    // "all" shows everything, specific categories filter by type field
    const showAll = category === "all";

    const db = getDB();
    const filters: string[] = [];
    const params: (string | number)[] = [];

    // Filter by type column for specific categories
    // The type column stores the category (dosimeter, spectacles, face_mask, medicine, machine, accessory)
    if (!showAll) {
      filters.push("LOWER(COALESCE(type, 'dosimeter')) = ?");
      params.push(category);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const withStatus = (statusCondition: string) =>
      filters.length
        ? `WHERE ${filters.join(" AND ")} AND ${statusCondition}`
        : `WHERE ${statusCondition}`;

    const [records] = await db.query<RowDataPacket[]>(
      `SELECT * FROM dosimeters ${whereClause} ORDER BY id DESC`,
      params
    );

    const [total] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as c FROM dosimeters ${whereClause}`,
      params
    );
    const [available] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as c FROM dosimeters ${withStatus("status = ?")}`,
      [...params, "available"]
    );
    const [assigned] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as c FROM dosimeters ${withStatus(
        "hospital_name IS NOT NULL AND hospital_name <> ''"
      )}`,
      params
    );
    const [expiring] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as c FROM dosimeters ${withStatus(
        "expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)"
      )}`,
      params
    );

    const recordsWithCategory = records.map((r) => ({
      ...r,
      category: r.type?.toLowerCase() || "dosimeter",
    }));

    return NextResponse.json({
      stats: {
        total: (total[0] as { c: number })?.c || 0,
        available: (available[0] as { c: number })?.c || 0,
        available_estimate: (available[0] as { c: number })?.c || 0,
        assigned: (assigned[0] as { c: number })?.c || 0,
        expiring_30_days: (expiring[0] as { c: number })?.c || 0,
      },
      records: recordsWithCategory,
      category: category || "dosimeter",
    });
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch inventory";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// ✅ PATCH: add / update / retire / assign / recall / expire / lost / returned (supports all categories)
export async function PATCH(req: Request) {
  try {
    const { action, payload } = await req.json();
    const db = getDB();

    const category = (payload.category || "dosimeter").toLowerCase();
    const tableName = "dosimeters";
    const normalizedType = (payload.type || category || "dosimeter").toLowerCase();

    if (action === "add") {
      const [result] = await db.query<ResultSetHeader>(
        `INSERT INTO dosimeters 
            (serial_number, model, type, status, hospital_name, contact_person, contact_phone, leasing_period, calibration_date, expiry_date, comment) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.serial_number,
          payload.model,
          normalizedType,
          payload.status || "available",
          payload.hospital_name,
          payload.contact_person,
          payload.contact_phone,
          payload.leasing_period,
          payload.calibration_date,
          payload.expiry_date,
          payload.comment,
        ]
      );
      await logHistory(db, result.insertId, category, "added", payload.hospital_name, "admin");
    }

    if (action === "update") {
      await db.query(
        `UPDATE dosimeters 
           SET model=?, type=?, status=?, hospital_name=?, contact_person=?, contact_phone=?, leasing_period=?, calibration_date=?, expiry_date=?, comment=? 
           WHERE id=?`,
        [
          payload.model,
          normalizedType,
          payload.status,
          payload.hospital_name,
          payload.contact_person,
          payload.contact_phone,
          payload.leasing_period,
          payload.calibration_date,
          payload.expiry_date,
          payload.comment,
          payload.id,
        ]
      );
      await logHistory(db, payload.id, category, "updated", payload.hospital_name, "admin");
    }

    if (action === "retire") {
      await db.query(`UPDATE ${tableName} SET status='retired' WHERE id=?`, [payload.id]);
      await logHistory(db, payload.id, category, "retired", null, "admin");
    }

    if (action === "assign") {
      await db.query(
        `UPDATE ${tableName} 
         SET status='dispatched', hospital_name=?, contact_person=?, contact_phone=? 
         WHERE id=?`,
        [payload.hospital_name, payload.contact_person, payload.contact_phone, payload.id]
      );
      await logHistory(db, payload.id, category, "assigned", payload.hospital_name, "admin");
    }

    if (action === "recall") {
      await db.query(
        `UPDATE ${tableName} 
         SET status='available', hospital_name=NULL, contact_person=NULL, contact_phone=NULL 
         WHERE id=?`,
        [payload.id]
      );
      await logHistory(db, payload.id, category, "recalled", null, "admin");
    }

    if (action === "expire") {
      await db.query(`UPDATE ${tableName} SET status='expired' WHERE id=?`, [payload.id]);
      await logHistory(db, payload.id, category, "expired", null, "system");
    }

    if (action === "lost") {
      await db.query(`UPDATE ${tableName} SET status='lost' WHERE id=?`, [payload.id]);
      await logHistory(db, payload.id, category, "lost", null, "system");
    }

    if (action === "returned") {
      await db.query(
        `UPDATE ${tableName} 
         SET status='returned', hospital_name=NULL, contact_person=NULL, contact_phone=NULL 
         WHERE id=?`,
        [payload.id]
      );
      await logHistory(db, payload.id, category, "returned", null, "admin", "Returned to CHAK");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error updating inventory:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ DELETE: remove item (supports all categories)
export async function DELETE(req: Request) {
  try {
    const { id, category = "dosimeter" } = await req.json();
    const db = getDB();

    await db.query(`DELETE FROM dosimeters WHERE id=?`, [id]);

    // Log deletion
    await logHistory(db, id, category, "deleted", null, "admin", "Deleted from system");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting item:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete item";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
