import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

// GET: Fetch current user profile
export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;

    if (!tokenValue) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenValue, JWT_SECRET);
      console.log("JWT decoded successfully. User ID:", decoded.id, "Email:", decoded.email);
    } catch (err) {
      console.error("JWT verification failed:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = getDB();
    
    // Log the query we're about to execute
    console.log(`Querying users table for user ID: ${decoded.id}`);
    
    // Try to query the users table - if it fails, try 'user' table as fallback
    let users: RowDataPacket[] = [];
    let queryError: any = null;
    
    try {
      [users] = await db.query<RowDataPacket[]>(
        "SELECT id, email, role, hospitalId, resetRequired, created_at FROM users WHERE id = ?",
        [decoded.id]
      );
    } catch (err: any) {
      queryError = err;
      // If table doesn't exist or query fails, try singular 'user' table
      if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('doesn\'t exist')) {
        try {
          [users] = await db.query<RowDataPacket[]>(
            "SELECT id, email, role, hospitalId, resetRequired, created_at FROM user WHERE id = ?",
            [decoded.id]
          );
        } catch (err2: any) {
          console.error("Error querying both 'users' and 'user' tables:", err2);
          return NextResponse.json(
            { 
              success: false, 
              error: "Database error: Unable to query user table",
              details: process.env.NODE_ENV === "development" ? err2.message : undefined
            },
            { status: 500 }
          );
        }
      } else {
        throw err;
      }
    }

    if (users.length === 0) {
      console.error(`User not found in database. User ID from token: ${decoded.id}, Email: ${decoded.email}`);
      return NextResponse.json(
        { 
          success: false,
          error: "User not found",
          details: process.env.NODE_ENV === "development" ? `User ID: ${decoded.id} not found in database` : undefined
        },
        { status: 404 }
      );
    }

    const user = users[0];
    
    // Get hospital name if hospitalId exists
    let hospitalName = null;
    if (user.hospitalId) {
      const [hospitals] = await db.query<RowDataPacket[]>(
        "SELECT name FROM hospitals WHERE id = ?",
        [user.hospitalId]
      );
      if (hospitals.length > 0) {
        hospitalName = hospitals[0].name;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: hospitalName,
        resetRequired: user.resetRequired,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch profile",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH: Update user profile
export async function PATCH(req: Request) {
  try {
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
    const { email, currentPassword, newPassword } = body;

    const db = getDB();

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required" },
          { status: 400 }
        );
      }

      const [users] = await db.query<RowDataPacket[]>(
        "SELECT passwordHash FROM users WHERE id = ?",
        [decoded.id]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, users[0].passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 403 }
        );
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await db.query<ResultSetHeader>(
        "UPDATE users SET passwordHash = ?, resetRequired = FALSE WHERE id = ?",
        [hashedPassword, decoded.id]
      );
    }

    // If changing email, check if it's already taken
    if (email && email !== decoded.email) {
      const [existingUsers] = await db.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, decoded.id]
      );

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { success: false, error: "Email already in use" },
          { status: 400 }
        );
      }

      await db.query<ResultSetHeader>(
        "UPDATE users SET email = ? WHERE id = ?",
        [email, decoded.id]
      );
    }

    // Fetch updated user data
    const [updatedUsers] = await db.query<RowDataPacket[]>(
      "SELECT id, email, role, hospitalId, resetRequired, created_at FROM users WHERE id = ?",
      [decoded.id]
    );

    const updatedUser = updatedUsers[0];
    
    // Get hospital name if hospitalId exists
    let hospitalName = null;
    if (updatedUser.hospitalId) {
      const [hospitals] = await db.query<RowDataPacket[]>(
        "SELECT name FROM hospitals WHERE id = ?",
        [updatedUser.hospitalId]
      );
      if (hospitals.length > 0) {
        hospitalName = hospitals[0].name;
      }
    }

    return NextResponse.json({
      success: true,
      message: newPassword ? "Password updated successfully" : "Profile updated successfully",
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        hospitalId: updatedUser.hospitalId,
        hospitalName: hospitalName,
        resetRequired: updatedUser.resetRequired,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

