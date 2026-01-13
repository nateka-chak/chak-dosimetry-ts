import { NextResponse } from "next/server";
import { getDB } from "@/lib/database";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

// GET: Fetch system settings
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
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Only admins can access settings
    const db = getDB();
    const [users] = await db.query<RowDataPacket[]>(
      "SELECT role FROM users WHERE id = ?",
      [decoded.id]
    );

    if (users.length === 0 || users[0].role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get settings from database (create table if needed)
    const [settings] = await db.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'category_%'`
    );

    // Default categories
    const defaultCategories = [
      { key: "dosimeter", label: "Dosimeters", enabled: true },
      { key: "spectacles", label: "Lead Spectacles", enabled: true },
      { key: "machine", label: "Hospital Machines", enabled: true },
      { key: "accessory", label: "Accessories & Holders", enabled: true },
    ];

    // Map settings from DB
    const categories = defaultCategories.map((cat) => {
      const setting = settings.find((s) => s.setting_key === `category_${cat.key}_enabled`);
      return {
        ...cat,
        enabled: setting ? setting.setting_value === "1" : cat.enabled,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH: Update system settings
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

    // Only admins can update settings
    const db = getDB();
    const [users] = await db.query<RowDataPacket[]>(
      "SELECT role FROM users WHERE id = ?",
      [decoded.id]
    );

    if (users.length === 0 || users[0].role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { categories } = body;

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: "Invalid categories data" },
        { status: 400 }
      );
    }

    // Ensure system_settings table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Update category settings
    for (const category of categories) {
      const key = `category_${category.key}_enabled`;
      const value = category.enabled ? "1" : "0";

      await db.query<ResultSetHeader>(
        `INSERT INTO system_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, value, value]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

