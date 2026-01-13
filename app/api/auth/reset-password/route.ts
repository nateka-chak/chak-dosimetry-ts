import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { ResultSetHeader } from "mysql2/promise";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Missing token or newPassword" }, { status: 400 });
    }

    let payload: string | jwt.JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (typeof payload === 'string' || !('id' in payload)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const db = getDB();
    const userId = typeof payload.id === 'number' ? payload.id : Number(payload.id);
      await db.query<ResultSetHeader>(
        "UPDATE users SET passwordHash = ?, resetRequired = FALSE WHERE id = ?",
        [hashed, userId]
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
