'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, X, Hash } from 'lucide-react';
import Button from '../UI/Button';
import Loader from '../UI/Loader';

interface ImageUploadProps {
  onNumbersDetected: (numbers: string[]) => void;
}

interface UploadedImage {
  file: File;
  preview: string;
  detectedSerials: string[];
}

export default function ImageUpload({ onNumbersDetected }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [detectedNumbers, setDetectedNumbers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);

    const newUploadedImages = [...uploadedImages];
    const allDetectedNumbers = [...detectedNumbers];

    for (const file of files) {
      const preview = URL.createObjectURL(file);

      // 🔹 Simulate OCR / serial number detection
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockDetected = [`SN-${Math.floor(Math.random() * 100000)}`];

      newUploadedImages.push({
        file,
        preview,
        detectedSerials: mockDetected,
      });

      allDetectedNumbers.push(...mockDetected);
    }

    setUploadedImages(newUploadedImages);
    setDetectedNumbers(allDetectedNumbers);
    onNumbersDetected(allDetectedNumbers);

    setIsProcessing(false);
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...uploadedImages];
    updatedImages.splice(index, 1);

    const remainingNumbers = updatedImages.flatMap((img) => img.detectedSerials);

    setUploadedImages(updatedImages);
    setDetectedNumbers(remainingNumbers);
    onNumbersDetected(remainingNumbers);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800">Upload Dosimetry Images</h2>
      <p className="text-sm text-gray-500">
        Upload or capture images of dosimeters, and the system will auto-detect their serial numbers.
      </p>

      {/* Upload / Capture buttons */}
      <div className="flex items-center space-x-3">
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Images
        </Button>
        <Button variant="secondary" disabled={isProcessing} className="flex items-center">
          <Camera className="w-4 h-4 mr-2" />
          Capture Photo
        </Button>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="flex items-center space-x-2 text-blue-600 font-medium">
          <Loader size="small" /> <span>Processing images...</span>
        </div>
      )}

      {/* Uploaded images grid */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedImages.map((img, index) => (
            <div
              key={index}
              className="relative rounded-xl overflow-hidden shadow-md group border border-gray-200"
            >
              <img
                src={img.preview}
                alt={`Uploaded ${index}`}
                className="w-full h-36 object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
              {img.detectedSerials.length > 0 && (
                <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-700">
                  <strong className="flex items-center text-gray-800">
                    <Hash className="w-3 h-3 mr-1" /> Detected:
                  </strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {img.detectedSerials.map((serial, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[11px] font-medium"
                      >
                        {serial}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary of detected serial numbers */}
      {detectedNumbers.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
          ✅ <strong>{detectedNumbers.length}</strong> serial number(s) detected successfully.
        </div>
      )}
    </div>
  );
}
