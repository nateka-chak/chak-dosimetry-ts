import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const db = getDB();
    
    // Check if user already exists
    const [existingUsers] = await db.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase().trim()]
    );
    
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine role - default to HOSPITAL unless explicitly set to ADMIN
    const userRole = role === "ADMIN" ? "ADMIN" : "HOSPITAL";

    // Insert new user
    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO users (email, passwordHash, role, resetRequired) VALUES (?, ?, ?, FALSE)",
      [email.toLowerCase().trim(), hashedPassword, userRole]
    );

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { 
        id: result.insertId, 
        email: email.toLowerCase().trim(), 
        role: userRole 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({ 
      success: true,
      message: "Account created successfully", 
      user: { 
        id: result.insertId, 
        email: email.toLowerCase().trim(),
        role: userRole
      } 
    });

    // Set auth cookie
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    console.error("Signup error:", err);
    const errorMessage = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
