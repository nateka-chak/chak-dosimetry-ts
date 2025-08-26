import Tesseract from 'tesseract.js';

export const extractSerialNumbers = async (imageBuffer: Buffer): Promise<string[]> => {
  try {
    const { data } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      { logger: m => console.log(m) }
    );
    
    const text = data.text;
    const lines = text.split('\n');
    
    const serialNumberRegex = /[A-Z0-9]{4,}[-]?[A-Z0-9]{4,}/g;
    const potentialSerials: string[] = [];
    
    lines.forEach(line => {
      const matches = line.match(serialNumberRegex);
      if (matches) {
        potentialSerials.push(...matches);
      }
    });
    
    return potentialSerials.length > 0 ? potentialSerials : ['No serial numbers detected'];
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to process image');
  }
};

export const validateSerialNumber = (serial: string): boolean => {
  const serialRegex = /^[A-Z0-9]{4,}[-]?[A-Z0-9]{4,}$/;
  return serialRegex.test(serial);
};
