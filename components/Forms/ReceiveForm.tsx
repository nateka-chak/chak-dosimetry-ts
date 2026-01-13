// components/Forms/ReceiveForm.tsx
"use client";

import { useState } from "react";
import { Option, ReceiveFormData } from "@/types";
import { useNotification } from "@/components/Layout/NotificationProvider";
import { API_BASE_URL } from "@/lib/config";
import Button from "../UI/Button";
import Loader from "../UI/Loader";
import ImageUpload from "./ImageUpload";
import DosimeterPicker from "../DosimeterPicker";
import HospitalAutocomplete from "@/components/Inputs/HospitalAutocomplete";
import { motion } from "framer-motion";
import { 
  Package, 
  User, 
  Building2, 
  ClipboardList, 
  Camera, 
  CheckCircle, 
  RotateCcw,
  MessageSquare,
  Shield
} from "lucide-react";

interface ReceiveFormProps {
  onSubmit: (data: ReceiveFormData) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function ReceiveForm({ onSubmit, isSubmitting }: ReceiveFormProps) {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<"manual" | "image">("manual");

  const [formData, setFormData] = useState<ReceiveFormData>({
    shipmentId: null,
    hospitalName: "",
    receiverName: "",
    receiverTitle: "",
    receiveType: "fromHospital",
    dosimeters: [] as Option[],
    dosimeterDevice: false,
    dosimeterCase: false,
    pinForHolder: false,
    strapClipForHolder: false,
    comment: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  function handleDosimeterChange(selected: Option[]) {
    setFormData((prev) => ({ ...prev, dosimeters: selected }));
  }

  async function handleImageNumbersDetected(detectedNumbers: string[]) {
    if (!detectedNumbers?.length) return;
    const unique = Array.from(new Set(detectedNumbers.map((s) => s.trim()).filter(Boolean)));

    const matched: Option[] = [];
    const notFound: string[] = [];

    await Promise.all(
      unique.map(async (serial) => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/inventory/search?q=${encodeURIComponent(serial)}&limit=5`
          );
          if (!res.ok) return notFound.push(serial);

          const data = await res.json();
          const rows: Option[] = data.rows || [];
          const exact = rows.find((r) => r.serial_number === serial);
          const chosen = exact ?? rows[0];
          if (chosen) matched.push(chosen);
          else notFound.push(serial);
        } catch {
          notFound.push(serial);
        }
      })
    );

    setFormData((prev) => {
      const existing = new Map(prev.dosimeters.map((d) => [d.id, d]));
      matched.forEach((m) => existing.set(m.id, m));
      return { ...prev, dosimeters: Array.from(existing.values()) };
    });

    if (matched.length) {
      showNotification(`✅ Mapped ${matched.length} serial(s) to dosimeters.`, "success");
    }
    if (notFound.length) {
      showNotification(
        `⚠️ ${notFound.length} serial(s) not found: ${notFound.slice(0, 5).join(", ")}${
          notFound.length > 5 ? "…" : ""
        }`,
        "warning"
      );
    }

    setActiveTab("manual");
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.dosimeters.length) {
      showNotification("⚠️ Please select at least one dosimeter.", "error");
      return;
    }

    if (!formData.hospitalName.trim()) {
      showNotification("⚠️ Please select a hospital.", "error");
      return;
    }

    if (!formData.receiverName.trim() || !formData.receiverTitle.trim()) {
      showNotification("⚠️ Please fill in all receiver information.", "error");
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      showNotification(
        formData.receiveType === "fromHospital"
          ? "✅ Dosimeters marked as Returned to CHAK!"
          : "✅ Receipt confirmed successfully!",
        "success"
      );
      setFormData({
        shipmentId: null,
        hospitalName: "",
        receiverName: "",
        receiverTitle: "",
        receiveType: "fromHospital",
        dosimeters: [],
        dosimeterDevice: false,
        dosimeterCase: false,
        pinForHolder: false,
        strapClipForHolder: false,
        comment: "",
      });
      setActiveTab("manual");
    } else {
      showNotification("❌ Failed to confirm receipt. Please try again.", "error");
    }
  };

  const conditionItems = [
    { key: "dosimeterDevice", label: "Dosimeter Device", icon: Package },
    { key: "dosimeterCase", label: "Protective Case", icon: Package },
    { key: "pinForHolder", label: "Charging Pin", icon: Package },
    { key: "strapClipForHolder", label: "Wrist Strap", icon: Package },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="professional-card max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Package className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-heading">Confirm Receipt</h2>
            <p className="text-primary-100 mt-1">
              {formData.receiveType === "fromHospital" 
                ? "Receive returned dosimeters from hospitals" 
                : "Confirm delivery to hospital locations"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-8 pt-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          {[
            { key: "manual" as const, label: "Manual Entry", icon: ClipboardList },
            { key: "image" as const, label: "Image Recognition", icon: Camera },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-8">
        {activeTab === "manual" ? (
          <form onSubmit={handleFormSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Receipt Information */}
              <div className="space-y-6">
                {/* Shipment ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <Package className="h-5 w-5 text-primary-600" />
                    <span>Shipment Reference</span>
                  </label>
                  <input
                    type="number"
                    name="shipmentId"
                    value={formData.shipmentId ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        shipmentId: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="Enter shipment ID if known"
                  />
                  <p className="text-sm text-gray-500 mt-1">Optional reference for tracking</p>
                </div>

                {/* Receive Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <RotateCcw className="h-5 w-5 text-primary-600" />
                    <span>Receive Type *</span>
                  </label>
                  <select
                    name="receiveType"
                    value={formData.receiveType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  >
                    <option value="fromChak">From CHAK → Hospital</option>
                    <option value="fromHospital">From Hospital → CHAK (Return)</option>
                  </select>
                </div>

                {/* Hospital Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-primary-600" />
                    <span>Hospital Information</span>
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital Name *
                    </label>
                    <HospitalAutocomplete
                      value={formData.hospitalName}
                      onChange={(val) => setFormData((p) => ({ ...p, hospitalName: val }))}
                      placeholder="Select or type hospital name"
                      name="hospitalName"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Receiver & Condition */}
              <div className="space-y-6">
                {/* Receiver Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <User className="h-5 w-5 text-primary-600" />
                    <span>Receiver Information</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receiver's Name *
                      </label>
                      <input
                        type="text"
                        name="receiverName"
                        value={formData.receiverName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter receiver's full name"
                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receiver's Title *
                      </label>
                      <input
                        type="text"
                        name="receiverTitle"
                        value={formData.receiverTitle}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter receiver's position/title"
                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Condition Check */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary-600" />
                    <span>Equipment Condition</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Check items received in good condition:</p>
                  <div className="grid grid-cols-1 gap-3">
                    {conditionItems.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center space-x-3 bg-white border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                      >
                        <input
                          type="checkbox"
                          name={item.key}
                          checked={(formData as any)[item.key]}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <item.icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Comment - Full Width */}
            <div className="bg-gray-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <span>Additional Comments</span>
              </label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                rows={3}
                placeholder="Add remarks about the received items, condition notes, or special observations..."
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Dosimeter Picker - Full Width */}
            <div className="bg-gray-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary-600" />
                <span>Select Dosimeters to Confirm *</span>
                <span className="text-sm font-normal text-gray-500">
                  ({formData.dosimeters.length} selected)
                </span>
              </label>
              <div className="bg-white rounded-lg border border-gray-300 p-4">
                <DosimeterPicker
                  selected={formData.dosimeters}
                  onChange={handleDosimeterChange}
                  statusFilter={
                    formData.receiveType === "fromChak"
                      ? ["returned", "delivered"]   // hospital receiving from CHAK it should also have delivered
                      : ["received"]    // CHAK receiving returns from hospital
                  }
                  pageSize={50}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <p>
                  <strong>{formData.dosimeters.length}</strong> dosimeters selected • 
                  Type: <span className="font-semibold text-primary-600">
                    {formData.receiveType === "fromChak" ? "From CHAK" : "Hospital Return"}
                  </span>
                </p>
              </div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isSubmitting || formData.dosimeters.length === 0}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-black font-semibold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader size="sm" />
                      <span>Processing Receipt...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Confirm Receipt of {formData.dosimeters.length} Dosimeters</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
        ) : (
          /* Image Recognition Tab */
          <div className="space-y-6">
            <ImageUpload onNumbersDetected={handleImageNumbersDetected} />
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
            >
              <div className="flex items-start space-x-3">
                <Camera className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800">How Image Recognition Works</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    After uploading images, detected serial numbers will be automatically matched to your inventory. 
                    You can review and edit the matched dosimeters in the Manual Entry tab before confirming receipt.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}