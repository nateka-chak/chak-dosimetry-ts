"use client";

import { useState } from "react";
import DispatchForm from "@/components/Forms/DispatchForm";
import { API_BASE_URL } from "@/lib/config";
import type { DispatchFormData } from "@/types";

export default function Dispatch() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DispatchFormData & { newStatus?: string }) => {
    setIsSubmitting(true);
    try {
      // ✅ determine new status based on dispatch type
      const newStatus =
        data.dispatchType === "toChak" ? "inTransit" : "dispatched";

      // ✅ prepare dispatch payload
      const payload = {
        dispatchType: data.dispatchType,
        hospital: data.hospital,
        address: data.address,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        courierName: data.courierName,
        courierStaff: data.courierStaff,
        dosimeterIds: data.dosimeters.map((d) => d.id),
        dosimeter_device: data.supplies.device,
        dosimeter_case: data.supplies.case,
        pin_holder: data.supplies.pin,
        strap_clip: data.supplies.strap,
        comment: data.comment,
      };

      // ✅ Step 1: Record dispatch in backend
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

      // ✅ Step 2: Update dosimeter statuses after successful dispatch
      await Promise.all(
        data.dosimeters.map((d) =>
          fetch(`${API_BASE_URL}/api/dosimeters/${d.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );

      return true;
    } catch (error) {
      console.error("❌ Error dispatching dosimeters:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-2xl font-bold text-chak-blue mb-6 text-center">
          Dispatch Dosimeters
        </h1>

        <DispatchForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </main>
  );
}
