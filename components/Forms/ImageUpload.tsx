'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, X, Hash, Image as ImageIcon, Scan, CheckCircle } from 'lucide-react';
import Button from '../UI/Button';
import Loader from '../UI/Loader';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploadProps {
  onNumbersDetected: (numbers: string[]) => void;
}

interface UploadedImage {
  file: File;
  preview: string;
  detectedSerials: string[];
  processing?: boolean;
}

export default function ImageUpload({ onNumbersDetected }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [detectedNumbers, setDetectedNumbers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newUploadedImages = [...uploadedImages];
    const allDetectedNumbers = [...detectedNumbers];

    // Process each file
    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file);

      // Add image with processing state
      const newImage: UploadedImage = {
        file,
        preview,
        detectedSerials: [],
        processing: true
      };
      newUploadedImages.push(newImage);
      setUploadedImages([...newUploadedImages]);

      // Simulate OCR processing with delay
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      // Mock detected serial numbers (in real app, this would be your OCR logic)
      const mockDetected = [
        `SN-${Math.floor(10000 + Math.random() * 90000)}`,
        `SN-${Math.floor(10000 + Math.random() * 90000)}`
      ].slice(0, 1 + Math.floor(Math.random() * 2)); // 1-2 serials per image

      // Update the image with detected serials
      const imageIndex = newUploadedImages.findIndex(img => img.preview === preview);
      if (imageIndex !== -1) {
        newUploadedImages[imageIndex] = {
          ...newUploadedImages[imageIndex],
          detectedSerials: mockDetected,
          processing: false
        };
        
        allDetectedNumbers.push(...mockDetected);
      }

      setUploadedImages([...newUploadedImages]);
      setDetectedNumbers(allDetectedNumbers);
      onNumbersDetected(allDetectedNumbers);
    }

    setIsProcessing(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e.target.files);
    if (e.target.files) e.target.value = ''; // Reset input
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...uploadedImages];
    const removedImage = updatedImages.splice(index, 1)[0];

    // Clean up object URL
    URL.revokeObjectURL(removedImage.preview);

    const remainingNumbers = updatedImages.flatMap((img) => img.detectedSerials);

    setUploadedImages(updatedImages);
    setDetectedNumbers(remainingNumbers);
    onNumbersDetected(remainingNumbers);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const clearAllImages = () => {
    uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    setDetectedNumbers([]);
    onNumbersDetected([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="professional-card max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Scan className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-heading">Image Recognition</h2>
            <p className="text-primary-100 text-sm mt-1">
              Upload images to automatically detect dosimeter serial numbers
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Upload Area */}
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
            isDragOver 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-primary-25'
          }`}
        >
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-primary-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Dosimeter Images
            </h3>
            
            <p className="text-gray-600 text-sm mb-6">
              Drag & drop images here, or click to browse. Supports JPG, PNG, and WebP formats.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileInputChange}
              />
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-3"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Images</span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="secondary"
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-3"
                >
                  <Camera className="w-4 h-4" />
                  <span>Use Camera</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Processing State */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200"
            >
              <Loader size="sm" className="text-blue-600" />
              <div>
                <p className="text-blue-800 font-medium">Processing Images</p>
                <p className="text-blue-600 text-sm">Detecting serial numbers...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploaded Images Grid */}
        <AnimatePresence>
          {uploadedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5 text-primary-600" />
                  <span>Uploaded Images ({uploadedImages.length})</span>
                </h3>
                <button
                  onClick={clearAllImages}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedImages.map((img, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={img.preview}
                        alt={`Uploaded dosimeter ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Processing Overlay */}
                      {img.processing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center">
                            <Loader size="sm" className="text-white mb-2" />
                            <p className="text-white text-sm font-medium">Processing...</p>
                          </div>
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 hover:bg-black/90 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Detected Serials */}
                    <div className="p-3 border-t border-gray-100">
                      {img.detectedSerials.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-1 text-xs font-medium text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            <span>Detected:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {img.detectedSerials.map((serial, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium border border-green-200"
                              >
                                <Hash className="w-3 h-3 inline mr-1" />
                                {serial}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        !img.processing && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Scan className="w-3 h-3" />
                            <span>No serials detected</span>
                          </div>
                        )
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Card */}
        <AnimatePresence>
          {detectedNumbers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">Serial Numbers Detected</h4>
                  <p className="text-green-700 text-sm">
                    Successfully detected <strong>{detectedNumbers.length}</strong> serial number(s) across {uploadedImages.length} image(s)
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {detectedNumbers.slice(0, 8).map((serial, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium border border-green-200"
                      >
                        {serial}
                      </span>
                    ))}
                    {detectedNumbers.length > 8 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium border border-green-200">
                        +{detectedNumbers.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        <AnimatePresence>
          {uploadedImages.length === 0 && !isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Scan className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Images Uploaded</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Upload images of dosimeters to automatically detect and extract serial numbers for quick receipt processing.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}