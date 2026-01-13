"use client";

import { useState } from "react";
import DispatchForm from "@/components/Forms/DispatchForm";
import { API_BASE_URL } from "@/lib/config";
import type { DispatchFormData } from "@/types";

export default function Dispatch() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DispatchFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        hospital: data.hospital,
        address: data.address,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        courierName: data.courierName,
        courierStaff: data.courierStaff,
        dosimeterIds: data.dosimeters.map((d) => d.id), // ✅ extract IDs
        dosimeter_device: data.supplies.device,
        dosimeter_case: data.supplies.case,
        pin_holder: data.supplies.pin,
        strap_clip: data.supplies.strap,
        comment: data.comment,
      };

      const res = await fetch(`${API_BASE_URL}/api/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("❌ Dispatch failed:", err);
        return false;
      }

      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-8">
      <h1 className="text-2xl font-bold text-chak-blue mb-6 text-center">
        Dispatch Dosimeters
      </h1>

      <DispatchForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
