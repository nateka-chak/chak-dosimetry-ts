import { NextResponse } from "next/server";
import { query } from "@/lib/database";

// ✅ PATCH /api/contracts/by-facility/:facility
export async function PATCH(
  req: Request,
  { params }: { params: { facility: string } }
) {
  try {
    const { facility } = params;
    const body = await req.json();
    const { updateQty, dosimeters } = body;

    const existing = await query<any>(
      `SELECT id, facility_name, dosimeters FROM contracts WHERE facility_name = ? LIMIT 1`,
      [facility]
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: `Facility '${facility}' not found.` },
        { status: 404 }
      );
    }

    const current = Number(existing[0].dosimeters || 0);
    const newQty =
      typeof dosimeters === "number"
        ? dosimeters
        : updateQty
        ? current + Number(updateQty)
        : current;

    if (newQty < 0) {
      return NextResponse.json(
        { error: "Dosimeters cannot go below zero." },
        { status: 400 }
      );
    }

    await query(
      `UPDATE contracts SET dosimeters = ?, updated_at = NOW() WHERE facility_name = ?`,
      [newQty, facility]
    );

    const contracts = await query<any>(`SELECT dosimeters FROM contracts`);
    const expired_contracts = await query<any>(
      `SELECT dosimeters FROM expired_contracts`
    );

    const total_dosimeters =
      contracts.reduce(
        (s: number, c: any) => s + (Number(c.dosimeters) || 0),
        0
      ) +
      expired_contracts.reduce(
        (s: number, e: any) => s + (Number(e.dosimeters) || 0),
        0
      );

    const active_dosimeters = contracts.reduce(
      (s: number, c: any) => s + (Number(c.dosimeters) || 0),
      0
    );

    const expired_uncollected = expired_contracts.reduce(
      (s: number, e: any) => s + (Number(e.dosimeters) || 0),
      0
    );

    const summary = {
      total_dosimeters,
      active_dosimeters,
      remaining_dosimeters: Math.max(
        0,
        total_dosimeters - active_dosimeters
      ),
      expired_uncollected,
      replaced_dosimeters: 0,
    };

    return NextResponse.json({
      message: "Contract updated successfully",
      facility,
      updated_qty: newQty,
      summary,
    });
  } catch (error: any) {
    console.error("❌ PATCH /contracts/by-facility/:facility error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// ✅ GET /api/contracts/by-facility/:facility
export async function GET(
  req: Request,
  { params }: { params: { facility: string } }
) {
  try {
    const { facility } = params;
    const rows = await query<any>(
      "SELECT * FROM contracts WHERE facility_name = ?",
      [facility]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: `Facility '${facility}' not found in contracts.` },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error: any) {
    console.error("❌ GET /contracts/by-facility/:facility error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}


