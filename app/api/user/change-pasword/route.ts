// app/api/user/change-password/route.ts
import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export async function POST(req: NextRequest) {
  // Get token from cookies
  const cookieStore = await cookies();
  const tokenValue = cookieStore.get("token")?.value;
  
  if (!tokenValue) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(tokenValue, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await req.json();
  const { currentPassword, newPassword } = body;
  const userId = decoded.id ? Number(decoded.id) : undefined;
  
  if (!userId) return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  
  const db = getDB();
  const [users] = await db.query<RowDataPacket[]>(
    "SELECT id, passwordHash FROM users WHERE id = ?",
    [userId]
  );
  
  if (users.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const user = users[0];
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Bad password" }, { status: 403 });

  const newHash = await hashPassword(newPassword);
  await db.query<ResultSetHeader>(
    "UPDATE users SET passwordHash = ?, resetRequired = FALSE WHERE id = ?",
    [newHash, user.id]
  );

  return NextResponse.json({ ok: true });
}
