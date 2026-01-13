"use client";

import { useState } from "react";
import { Truck, MessageSquare, Package, MapPin, Phone, User, Building2, ClipboardList } from "lucide-react";
import Button from "../UI/Button";
import Loader from "../UI/Loader";
import { DispatchFormData } from "@/types";
import { useNotification } from "@/components/Layout/NotificationProvider";
import DosimeterPicker, { Option } from "../DosimeterPicker";
import HospitalAutocomplete from "@/components/Inputs/HospitalAutocomplete";
import { motion } from "framer-motion";

interface DispatchFormProps {
  onSubmit: (data: DispatchFormData) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function DispatchForm({
  onSubmit,
  isSubmitting,
}: DispatchFormProps) {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<DispatchFormData>({
    dispatchType: "toHospital",
    hospital: "",
    address: "",
    contactPerson: "",
    contactPhone: "",
    courierName: "",
    courierStaff: "",
    dosimeters: [] as Option[],
    supplies: { device: false, case: false, pin: false, strap: false },
    comment: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      supplies: { ...prev.supplies, [name]: checked },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.dosimeters.length === 0) {
      showNotification("Please add at least one item.", "error");
      return;
    }

    if (!formData.hospital.trim()) {
      showNotification("Please select a hospital.", "error");
      return;
    }

    if (!formData.contactPerson.trim() || !formData.contactPhone.trim()) {
      showNotification("Please fill in all contact information.", "error");
      return;
    }

    // Determine new dosimeter status based on dispatch type
    const newStatus = formData.dispatchType === "toHospital" ? "dispatched" : "inTransit";

    // Pass status info along with form data
    const success = await onSubmit({ ...formData, newStatus });
    
    if (success) {
      showNotification("✅ Items dispatched successfully!", "success");
      // Reset form
      setFormData({
        dispatchType: "toHospital",
        hospital: "",
        address: "",
        contactPerson: "",
        contactPhone: "",
        courierName: "",
        courierStaff: "",
        dosimeters: [],
        supplies: { device: false, case: false, pin: false, strap: false },
        comment: "",
      });
    } else {
      showNotification(
        "❌ Failed to dispatch items. Please try again.",
        "error"
      );
    }
  };

  const supplyItems = [
    { key: "device", label: "Device", icon: Package },
    { key: "case", label: "Protective Case", icon: Package },
    { key: "pin", label: "Charging Pin", icon: Package },
    { key: "strap", label: "Wrist Strap", icon: Package },
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
            <Truck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-heading">Dispatch Dosimeters</h2>
            <p className="text-primary-100 mt-1">
              {formData.dispatchType === "toHospital" 
                ? "Send dosimeters to hospital locations" 
                : "Return dosimeters to CHAK headquarters"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Dispatch Information */}
          <div className="space-y-6">
            {/* Dispatch Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <ClipboardList className="h-5 w-5 text-primary-600" />
                <span>Dispatch Type *</span>
              </label>
              <select
                name="dispatchType"
                value={formData.dispatchType || "toHospital"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dispatchType: e.target.value as DispatchFormData["dispatchType"],
                  }))
                }
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              >
                <option value="toHospital">Send to Hospital</option>
                <option value="toChak">Return to CHAK</option>
              </select>
            </div>

            {/* Hospital Information */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary-600" />
                <span>Hospital Information</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Name *
                </label>
                <HospitalAutocomplete
                  value={formData.hospital}
                  onChange={(val) => setFormData((p) => ({ ...p, hospital: val }))}
                  placeholder="Select or type hospital name"
                  name="hospital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  placeholder="Enter complete hospital address..."
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <User className="h-5 w-5 text-primary-600" />
                <span>Contact Information</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter contact person's name"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter contact phone number"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Logistics & Equipment */}
          <div className="space-y-6">
            {/* Courier Information */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Truck className="h-5 w-5 text-primary-600" />
                <span>Transport Information</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transport Company *
                </label>
                <input
                  type="text"
                  name="courierName"
                  value={formData.courierName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter transport company name"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transport Staff *
                </label>
                <input
                  type="text"
                  name="courierStaff"
                  value={formData.courierStaff}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter staff member name"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Supplies Included */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary-600" />
                <span>Supplies Included</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {supplyItems.map((supply) => {
                  const Icon = supply.icon;
                  return (
                    <label
                      key={supply.key}
                      className="flex items-center space-x-3 bg-white border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        name={supply.key}
                        checked={(formData.supplies as any)[supply.key]}
                        onChange={handleSupplyChange}
                        className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {supply.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* General Comment */}
            <div className="bg-gray-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <span>Additional Comments</span>
              </label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="Write any additional observations, special instructions, or notes..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Item Picker - Full Width */}
        <div className="mt-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary-600" />
              <span>Select Items *</span>
              <span className="text-sm font-normal text-gray-500">
                ({formData.dosimeters.length} selected)
              </span>
            </label>
            <div className="bg-white rounded-lg border border-gray-300 p-4">
              <DosimeterPicker
                selected={formData.dosimeters}
                onChange={(arr) =>
                  setFormData((prev) => ({ ...prev, dosimeters: arr }))
                }
                statusFilter={
                  formData.dispatchType === "toHospital"
                    ? ["available", "returned"]
                    : "received"
                }
                pageSize={20}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-600">
            <p>
              <strong>{formData.dosimeters.length}</strong> item{formData.dosimeters.length !== 1 ? 's' : ''} selected • 
              Status: <span className="font-semibold text-primary-600">
                {formData.dispatchType === "toHospital" ? "To Hospital" : "To CHAK"}
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
                  <span>Processing Dispatch...</span>
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5" />
                  <span>Dispatch {formData.dosimeters.length} Item{formData.dosimeters.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}