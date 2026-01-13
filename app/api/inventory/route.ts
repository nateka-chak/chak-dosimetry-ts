import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";

// helper to log history
async function logHistory(
  db: any,
  dosimeterId: number,
  action: string,
  hospital: string | null = null,
  actor: string = "system",
  notes: string | null = null
) {
  await db.query(
    "INSERT INTO dosimeter_history (dosimeter_id, action, hospital_name, actor, notes) VALUES (?, ?, ?, ?, ?)",
    [dosimeterId, action, hospital, actor, notes]
  );
}

// ✅ GET: fetch inventory stats + all records
export async function GET() {
  try {
    const db = getDB();

    const [records] = await db.query("SELECT * FROM dosimeters ORDER BY id DESC");

    const [total] = await db.query("SELECT COUNT(*) as c FROM dosimeters");
    const [available] = await db.query(
      "SELECT COUNT(*) as c FROM dosimeters WHERE status='available'"
    );
    const [assigned] = await db.query(
      "SELECT COUNT(*) as c FROM dosimeters WHERE hospital_name IS NOT NULL AND hospital_name <> ''"
    );
    const [expiring] = await db.query(
      "SELECT COUNT(*) as c FROM dosimeters WHERE expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)"
    );

    return NextResponse.json({
      stats: {
        total: (total as any)[0].c,
        available: (available as any)[0].c,
        assigned: (assigned as any)[0].c,
        expiring_30_days: (expiring as any)[0].c,
      },
      records,
    });
  } catch (error: any) {
    console.error("❌ Error fetching inventory:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ PATCH: add / update / retire / assign / recall / expire / lost / returned
export async function PATCH(req: Request) {
  try {
    const { action, payload } = await req.json();
    const db = getDB();

    if (action === "add") {
      const [result] = await db.query(
        `INSERT INTO dosimeters 
          (serial_number, model, type, status, hospital_name, contact_person, contact_phone, leasing_period, calibration_date, expiry_date, comment) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.serial_number,
          payload.model,
          payload.type,
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

      await logHistory(db, (result as any).insertId, "added", payload.hospital_name, "admin");
    }

    if (action === "update") {
      await db.query(
        `UPDATE dosimeters 
         SET model=?, type=?, status=?, hospital_name=?, contact_person=?, contact_phone=?, leasing_period=?, calibration_date=?, expiry_date=?, comment=? 
         WHERE id=?`,
        [
          payload.model,
          payload.type,
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

      await logHistory(db, payload.id, "updated", payload.hospital_name, "admin");
    }

    if (action === "retire") {
      await db.query("UPDATE dosimeters SET status='retired' WHERE id=?", [
        payload.id,
      ]);
      await logHistory(db, payload.id, "retired", null, "admin");
    }

    if (action === "assign") {
      await db.query(
        `UPDATE dosimeters 
         SET status='dispatched', hospital_name=?, contact_person=?, contact_phone=? 
         WHERE id=?`,
        [
          payload.hospital_name,
          payload.contact_person,
          payload.contact_phone,
          payload.id,
        ]
      );

      await logHistory(db, payload.id, "assigned", payload.hospital_name, "admin");
    }

    if (action === "recall") {
      await db.query(
        `UPDATE dosimeters 
         SET status='available', hospital_name=NULL, contact_person=NULL, contact_phone=NULL 
         WHERE id=?`,
        [payload.id]
      );

      await logHistory(db, payload.id, "recalled", null, "admin");
    }

    if (action === "expire") {
      await db.query(
        "UPDATE dosimeters SET status='expired' WHERE id=?",
        [payload.id]
      );

      await logHistory(db, payload.id, "expired", null, "system");
    }

    if (action === "lost") {
      await db.query(
        "UPDATE dosimeters SET status='lost' WHERE id=?",
        [payload.id]
      );

      await logHistory(db, payload.id, "lost", null, "system");
    }

    // ✅ NEW: handle Returned status
    if (action === "returned") {
      await db.query(
        `UPDATE dosimeters 
         SET status='returned', 
             hospital_name=NULL, 
             contact_person=NULL, 
             contact_phone=NULL 
         WHERE id=?`,
        [payload.id]
      );

      await logHistory(db, payload.id, "returned", null, "admin", "Returned to CHAK");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error updating inventory:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ DELETE: remove dosimeter
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const db = getDB();

    await db.query("DELETE FROM dosimeters WHERE id=?", [id]);

    // optional: log as retired/lost before delete
    await logHistory(db, id, "retired", null, "admin", "Deleted from system");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error deleting dosimeter:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
