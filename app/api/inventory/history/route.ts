import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";

// ✅ GET: Fetch history for one dosimeter
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing dosimeter id" }, { status: 400 });
    }

    const db = getDB();
    const [rows] = await db.query(
      "SELECT * FROM dosimeter_history WHERE dosimeter_id = ? ORDER BY created_at DESC",
      [id]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("❌ Error fetching dosimeter history:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ POST: Add a new history record
export async function POST(req: Request) {
  try {
    const { dosimeter_id, action, hospital_name, actor, notes } = await req.json();

    if (!dosimeter_id || !action) {
      return NextResponse.json(
        { error: "Missing required fields (dosimeter_id, action)" },
        { status: 400 }
      );
    }

    const db = getDB();
    await db.query(
      `INSERT INTO dosimeter_history (dosimeter_id, action, hospital_name, actor, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [dosimeter_id, action, hospital_name || null, actor || "system", notes || null]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error adding dosimeter history:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
