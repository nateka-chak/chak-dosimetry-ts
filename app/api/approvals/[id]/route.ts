import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: Context) {
  try {
    const { action } = await req.json();

    // ✅ Await params
    const { id } = await context.params;

    const db = getDB();
    await db.query(
      "UPDATE requests SET status = ? WHERE id = ?",
      [action, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
