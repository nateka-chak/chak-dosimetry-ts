import { NextRequest, NextResponse } from "next/server";
import { extractSerialNumbers } from "@/lib/ocr";

// Expects multipart/form-data with field "image" (File)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    console.log("📥 Incoming image formData keys:", Array.from(formData.keys()));

    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // OCR helper should return string[]
    const serialNumbers = await extractSerialNumbers(buffer);

    if (!serialNumbers || serialNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No serial numbers detected in image" },
        { status: 422 }
      );
    }

    console.log("🔎 Extracted serial numbers:", serialNumbers);

    return NextResponse.json({
      success: true,
      message: "Serial numbers extracted successfully",
      data: { serialNumbers },
    });
  } catch (err) {
    console.error("❌ Image processing error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process image" },
      { status: 500 }
    );
  }
}
