"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import ReceiveForm from "@/components/Forms/ReceiveForm";
import { ReceiveFormData } from "@/types";
import { API_BASE_URL } from "@/lib/config";

export default function ReceivePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialShipmentId, setInitialShipmentId] = useState<number | null>(null);
  const [initialHospitalName, setInitialHospitalName] = useState<string | null>(null);

  // Safely read query parameters on the client to avoid hook issues
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const shipmentIdParam = params.get("shipmentId");
    const hospitalParam = params.get("hospital");

    setInitialShipmentId(shipmentIdParam ? Number(shipmentIdParam) : null);
    setInitialHospitalName(hospitalParam);
  }, []);

  const handleReceiveSubmit = async (data: ReceiveFormData): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      // Determine status
      const status =
        data.receiveType === "fromHospital" ? "returned" : "received";
    
      // ✅ Transform dosimeters -> serialNumbers for backend
      const payload = {
        shipmentId: data.shipmentId ?? null,
        hospitalName: data.hospitalName,
        receiverName: data.receiverName,
        receiverTitle: data.receiverTitle,
        serialNumbers: data.dosimeters.map((d) => d.serial_number), // ✅ what API expects
        comment: data.comment,
        status,
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
        <title>Receive - CHAK Inventory Tracker</title>
        <meta name="description" content="Confirm receipt of items for CHAK" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl font-bold text-chak-blue mb-6 text-center">
            Confirm Receipt of Items
          </h1>
          <ReceiveForm
            onSubmit={handleReceiveSubmit}
            isSubmitting={isSubmitting}
            initialShipmentId={initialShipmentId}
            initialHospitalName={initialHospitalName}
          />
        </div>
      </main>
    </>
  );
}
