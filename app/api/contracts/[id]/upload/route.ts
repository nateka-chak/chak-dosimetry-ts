// app/api/contracts/[id]/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    
    // Verify contract exists
    const contract = await query<any>(
      "SELECT id FROM contracts WHERE id = ?",
      [contractId]
    );
    
    if (contract.length === 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and PDF files are allowed." }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "contracts");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `contract_${contractId}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Store file path in database
    const relativePath = `/uploads/contracts/${fileName}`;
    await query(
      "UPDATE contracts SET scanned_document = ? WHERE id = ?",
      [relativePath, contractId]
    );

    // Fetch updated contract
    const updatedContract = await query<any>(
      "SELECT * FROM contracts WHERE id = ?",
      [contractId]
    );

    return NextResponse.json(updatedContract[0]);
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}