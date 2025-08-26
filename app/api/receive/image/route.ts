import { NextRequest, NextResponse } from 'next/server';
import { extractSerialNumbers } from '@/lib/ocr';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const serialNumbers = await extractSerialNumbers(buffer);

    return NextResponse.json({
      success: true,
      data: { serialNumbers }
    });

  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
