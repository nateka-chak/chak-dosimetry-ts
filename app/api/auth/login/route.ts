import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2/promise";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = getDB();
    
    // Find user by email
    const [users] = await db.query<RowDataPacket[]>(
      "SELECT id, email, passwordHash, role, hospitalId FROM users WHERE email = ?",
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        hospitalId: user.hospitalId 
      },
      JWT_SECRET,
      { expiresIn: "7d" } // 7 days
    );

    const res = NextResponse.json({ 
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId
      }
    });
    
    // Set cookie - use "/" path which works for all paths including basePath
    // The cookie will be accessible from all paths on the same domain
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/", // "/" works for all paths, including those with basePath
      maxAge: 60 * 60 * 24 * 7, // 7 days
      // Don't set domain - let it default to current domain
    });

    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      error: error.message || "Login failed" 
    }, { status: 500 });
  }
}
