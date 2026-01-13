"use client";

import { useState } from "react";
import Head from "next/head";
import ReceiveForm from "@/components/Forms/ReceiveForm";
import { ReceiveFormData } from "@/types";
import { API_BASE_URL } from "@/lib/config";

export default function ReceivePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReceiveSubmit = async (data: ReceiveFormData): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      // ✅ Transform dosimeters -> serialNumbers for backend
      const payload = {
        shipmentId: data.shipmentId ?? null,
        hospitalName: data.hospitalName,
        receiverName: data.receiverName,
        receiverTitle: data.receiverTitle,
        serialNumbers: data.dosimeters.map((d) => d.serial_number), // ✅ what API expects
        comment: data.comment,
      };

      const res = await fetch(`${API_BASE_URL}/api/shipments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("API error:", err);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Receive submit error:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Receive - CHAK Dosimetry Tracker</title>
        <meta name="description" content="Confirm receipt of dosimeters for CHAK" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl font-bold text-chak-blue mb-6 text-center">
            Confirm Receipt of Dosimeters
          </h1>
          <ReceiveForm onSubmit={handleReceiveSubmit} isSubmitting={isSubmitting} />
        </div>
      </main>
    </>
  );
}
