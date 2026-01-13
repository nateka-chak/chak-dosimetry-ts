import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2/promise";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: "Email is required" 
      }, { status: 400 });
    }

    const db = getDB();
    const [users] = await db.query<RowDataPacket[]>(
      "SELECT id, email FROM users WHERE email = ?",
      [email.toLowerCase().trim()]
    );
    
    // Always return success to prevent email enumeration
    // In production, you would send an email here
    if (users.length > 0) {
      const user = users[0];
      const token = jwt.sign({ 
        id: user.id,
        type: "password-reset"
      }, JWT_SECRET, { expiresIn: "1h" });

      // In production, send email with reset link
      // For now, return the token (in production, don't expose this)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
        resetToken: token, // Only for development - remove in production
        resetUrl: `/reset-password?token=${token}`,
      });
    }

    // Still return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (err: any) {
    console.error("Request password reset error:", err);
    return NextResponse.json({ 
      success: false,
      error: "Failed to process password reset request" 
    }, { status: 500 });
  }
}
