import { NextRequest, NextResponse } from "next/server";
import { extractSerialNumbers } from "@/lib/ocr";

// Expects multipart/form-data with "image" (File)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Your OCR helper should return string[]
    const serialNumbers = await extractSerialNumbers(buffer);

    return NextResponse.json({
      success: true,
      data: { serialNumbers },
    });
  } catch (err) {
    console.error("Image processing error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process image" },
      { status: 500 }
    );
  }
}
