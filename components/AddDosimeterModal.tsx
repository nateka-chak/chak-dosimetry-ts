"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Package, Calendar, User, Phone, Building2, CheckCircle2, AlertCircle, Glasses, Shield, Pill, Computer, Box } from "lucide-react";
import { Input } from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import { Card, CardContent } from "@/components/UI/Card";
import { API_BASE_URL } from "@/lib/config";

type ItemForm = {
  serial_number: string;
  model?: string;
  type?: string;
  status: string;
  hospital_name?: string;
  contact_person?: string;
  contact_phone?: string;
  leasing_period?: string;
  calibration_date?: string;
  expiry_date?: string;
  comment?: string;
  dosimeter_device?: boolean;
  dosimeter_case?: boolean;
  pin_holder?: boolean;
  strap_clip?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editRecord?: any;
  category?: string;
};

// Category configuration with icons and labels
const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  dosimeter: { label: "Dosimeter", icon: Package, color: "blue" },
  spectacles: { label: "Lead Spectacles", icon: Glasses, color: "purple" },
  face_mask: { label: "Face Mask", icon: Shield, color: "green" },
  medicine: { label: "Medicine", icon: Pill, color: "red" },
  machine: { label: "Hospital Machine", icon: Computer, color: "slate" },
  accessory: { label: "Accessory", icon: Box, color: "amber" },
};

export default function AddDosimeterModal({
  open,
  onClose,
  onSaved,
  editRecord,
  category = "dosimeter",
}: Props) {
  const [form, setForm] = useState<ItemForm>({
    serial_number: "",
    model: "",
    type: category, // Set type to the current category
    status: "available",
    hospital_name: "",
    contact_person: "",
    contact_phone: "",
    leasing_period: "",
    calibration_date: "",
    expiry_date: "",
    comment: "",
    dosimeter_device: false,
    dosimeter_case: false,
    pin_holder: false,
    strap_clip: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"manual" | "bulk">("manual");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get category info
  const currentCategoryInfo = categoryConfig[category] || categoryConfig.dosimeter;
  const CategoryIcon = currentCategoryInfo.icon;

  // Initialize form when editRecord changes
  useEffect(() => {
    if (editRecord) {
      setForm({
        ...editRecord,
        type: editRecord.type || category, // Ensure type is set
      });
      setMode("manual");
    } else {
      setForm({
        serial_number: "",
        model: "",
        type: category, // Set type to the current category for new items
        status: "available",
        hospital_name: "",
        contact_person: "",
        contact_phone: "",
        leasing_period: "",
        calibration_date: "",
        expiry_date: "",
        comment: "",
        dosimeter_device: false,
        dosimeter_case: false,
        pin_holder: false,
        strap_clip: false,
      });
    }
  }, [editRecord, open, category]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev: ItemForm) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validation
    if (!form.serial_number.trim()) {
      setError("Serial number is required");
      setSaving(false);
      return;
    }

    try {
      const action = editRecord ? "update" : "add";
      // Ensure type is set to the category - this is critical for proper categorization
      const payload = editRecord 
        ? { ...form, id: editRecord.id, category, type: category } 
        : { ...form, category, type: category };

      const res = await fetch(`${API_BASE_URL}/api/inventory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to save ${currentCategoryInfo.label.toLowerCase()}`);
      }

      setSaving(false);
      onSaved?.();
      onClose();
    } catch (err: any) {
      setSaving(false);
      setError(err.message || "An unexpected error occurred");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file); // Debug log
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    setSelectedFileName(file.name);
    setSaving(true);
    setError(null);
    setUploadProgress(0);

    // Validate file type - FIXED LOGIC
    const validTypes = ['xlsx', 'xls', 'csv', 'docx'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log('File extension:', fileExtension); // Debug log
    
    if (!fileExtension || !validTypes.includes(fileExtension)) {
      setError("Please upload Excel (.xlsx, .xls), CSV, or Word (.docx) files only");
      setSaving(false);
      setSelectedFileName(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      setSaving(false);
      setSelectedFileName(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      console.log('Uploading file...'); // Debug log
      const res = await fetch(`${API_BASE_URL}/api/inventory/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (!res.ok) {
        const data = await res.json();
        console.log('Upload failed:', data); // Debug log
        throw new Error(data.error || "Bulk upload failed");
      }

      console.log('Upload successful'); // Debug log
      setTimeout(() => {
        setSaving(false);
        setSelectedFileName(null);
        onSaved?.();
        onClose();
      }, 500);

    } catch (err: any) {
      console.log('Upload error:', err); // Debug log
      setSaving(false);
      setUploadProgress(0);
      setSelectedFileName(null);
      setError(err.message || "Upload failed. Please try again.");
      
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && !saving) {
      const file = files[0];
      
      // Create a synthetic event to trigger handleFileUpload
      const syntheticEvent = {
        target: { files: [file] } as any,
        currentTarget: { files: [file] } as any,
        nativeEvent: new Event('change'),
        bubbles: true,
        cancelable: true,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: true,
        preventDefault: () => {},
        stopPropagation: () => {},
        timeStamp: Date.now(),
        type: 'change'
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileUpload(syntheticEvent);
    }
  };

  const handleClose = () => {
    setError(null);
    setUploadProgress(0);
    setSelectedFileName(null);
    
    // Reset file input when closing
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onClose();
  };

  const statusOptions = [
    { value: "available", label: "Available", color: "green" },
    { value: "dispatched", label: "Dispatched", color: "blue" },
    { value: "in_transit", label: "In Transit", color: "yellow" },
    { value: "received", label: "Received", color: "purple" },
    { value: "expired", label: "Expired", color: "red" },
    { value: "lost", label: "Lost", color: "red" },
    { value: "retired", label: "Retired", color: "gray" },
  ];

  const accessoryItems = [
    { name: "dosimeter_device", label: "Dosimeter Device", icon: Package },
    { name: "dosimeter_case", label: "Protective Case", icon: Package },
    { name: "pin_holder", label: "Pin Holder", icon: Package },
    { name: "strap_clip", label: "Strap Clip", icon: Package },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <Card className="shadow-2xl border border-gray-300 rounded-xl overflow-hidden bg-white">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <CategoryIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {editRecord
                          ? `Update ${currentCategoryInfo.label}`
                          : mode === "manual"
                          ? `Add New ${currentCategoryInfo.label}`
                          : `Bulk Upload ${currentCategoryInfo.label}s`}
                      </h2>
                      <p className="text-slate-200 text-sm">
                        {editRecord 
                          ? `Update existing ${currentCategoryInfo.label.toLowerCase()} information`
                          : mode === "manual"
                          ? `Add a single ${currentCategoryInfo.label.toLowerCase()} to inventory`
                          : `Upload multiple ${currentCategoryInfo.label.toLowerCase()}s via file`
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mode Toggle */}
                {!editRecord && (
                  <div className="flex space-x-1 bg-white/10 p-1 rounded-lg mt-4 backdrop-blur-sm">
                    {[
                      { key: "manual" as const, label: "Manual Entry", icon: CategoryIcon },
                      { key: "bulk" as const, label: "Bulk Upload", icon: Upload },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setMode(tab.key)}
                        className={`flex items-center space-x-2 flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
                          mode === tab.key
                            ? "bg-white text-slate-900 shadow-sm font-semibold"
                            : "text-white/90 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <CardContent className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto bg-gray-50">
                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-red-800">Error</h4>
                          <p className="text-red-700 text-sm mt-1">{error}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === "manual" ? (
                  /* Manual Entry Form */
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (manual form content remains the same) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                          <Package className="h-5 w-5 text-blue-600" />
                          <span>Basic Information</span>
                        </h3>
                        
                        <Input
                          label="Serial Number *"
                          name="serial_number"
                          value={form.serial_number}
                          onChange={handleChange}
                          required
                          disabled={!!editRecord}
                          placeholder="Enter unique serial number"
                        />

                        <Input
                          label="Model"
                          name="model"
                          value={form.model || ""}
                          onChange={handleChange}
                          placeholder="Dosimeter model"
                        />

                        <Input
                          label="Type"
                          name="type"
                          value={form.type || ""}
                          onChange={handleChange}
                          placeholder="Dosimeter type"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Status
                          </label>
                          <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                          >
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Location & Contact */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <span>Location & Contact</span>
                        </h3>

                        <Input
                          label="Hospital/Organization"
                          name="hospital_name"
                          value={form.hospital_name || ""}
                          onChange={handleChange}
                          placeholder="Hospital name"
                          leftIcon={<Building2 className="h-4 w-4" />}
                        />

                        <Input
                          label="Contact Person"
                          name="contact_person"
                          value={form.contact_person || ""}
                          onChange={handleChange}
                          placeholder="Contact person name"
                          leftIcon={<User className="h-4 w-4" />}
                        />

                        <Input
                          label="Contact Phone"
                          name="contact_phone"
                          value={form.contact_phone || ""}
                          onChange={handleChange}
                          placeholder="Phone number"
                          leftIcon={<Phone className="h-4 w-4" />}
                        />
                      </div>
                    </div>

                    {/* Dates & Accessories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <span>Dates</span>
                        </h3>

                        <Input
                          label="Calibration Date"
                          type="date"
                          name="calibration_date"
                          value={form.calibration_date || ""}
                          onChange={handleChange}
                        />

                        <Input
                          label="Expiry Date"
                          type="date"
                          name="expiry_date"
                          value={form.expiry_date || ""}
                          onChange={handleChange}
                        />

                        <Input
                          label="Leasing Period"
                          name="leasing_period"
                          value={form.leasing_period || ""}
                          onChange={handleChange}
                          placeholder="e.g., 6 months"
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          <span>Accessories Included</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-3">
                          {accessoryItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <label
                                key={item.name}
                                className="flex items-center space-x-3 bg-white border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-sm"
                              >
                                <input
                                  type="checkbox"
                                  name={item.name}
                                  checked={!!form[item.name as keyof typeof form]}
                                  onChange={handleChange}
                                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-400"
                                />
                                <Icon className="h-4 w-4 text-gray-700" />
                                <span className="text-sm font-medium text-gray-800">
                                  {item.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Additional Comments
                      </label>
                      <textarea
                        name="comment"
                        value={form.comment || ""}
                        onChange={handleChange}
                        placeholder="Any additional notes or comments..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={saving}
                        className="border-gray-400 text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        isLoading={saving}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {saving ? "Saving..." : editRecord ? `Update ${currentCategoryInfo.label}` : `Add ${currentCategoryInfo.label}`}
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Bulk Upload - Fixed Section */
                  <div className="space-y-6">
                    <Card className="bg-blue-50 border border-blue-300">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <FileText className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-blue-900">Bulk Upload Instructions</h4>
                            <ul className="text-blue-800 text-sm mt-2 space-y-1">
                              <li>• Upload Excel (.xlsx, .xls), CSV, or Word (.docx) files</li>
                              <li>• Maximum file size: 10MB</li>
                              <li>• Required columns: <code className="bg-blue-200 px-1 rounded font-mono">serial_number</code>, <code className="bg-blue-200 px-1 rounded font-mono">status</code></li>
                              <li>• Optional columns: model, type, hospital_name, etc.</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div 
                      className="border-2 border-dashed border-gray-400 rounded-xl p-8 text-center bg-white hover:border-blue-500 transition-all duration-200"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Upload Your File
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Drag and drop your file here, or click to browse
                      </p>
                      
                      {/* Fixed File Input Section */}
                      <div className="flex flex-col items-center space-y-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv,.docx"
                          onChange={handleFileUpload}
                          disabled={saving}
                          className="hidden"
                        />
                        
                        <Button
                          variant="outline"
                          onClick={handleChooseFile}
                          disabled={saving}
                          className="border-gray-400 text-gray-700 hover:bg-gray-50"
                          leftIcon={<Upload className="h-4 w-4" />}
                        >
                          {saving ? "Uploading..." : "Choose File"}
                        </Button>

                        {selectedFileName && (
                          <p className="text-sm text-green-600 font-medium">
                            Selected: {selectedFileName}
                          </p>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="text-xs text-gray-500">
                          Supported formats: .xlsx, .xls, .csv, .docx (Max 10MB)
                        </p>
                      </div>

                      {saving && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-300 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-700 mt-2">
                            Uploading... {uploadProgress}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}