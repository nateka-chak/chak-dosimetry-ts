"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

export default function Shipments() {
  const [shipments, setShipments] = useState<any[]>([]);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/shipments`, {
  method: "GET",
  credentials: "include",
});
        const data = await res.json();

        if (data?.success && Array.isArray(data.data)) {
          setShipments(data.data);
        } else {
          console.error("Unexpected API response:", data);
          setShipments([]);
        }
      } catch (err) {
        console.error("Error fetching shipments:", err);
        setShipments([]);
      }
    };
    fetchShipments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <h1 className="text-2xl font-bold text-chak-blue mb-6">
        Active Shipments
      </h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Hospital</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Courier (Qty)</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Comment</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3">{s.id}</td>
                <td className="px-4 py-3">{s.destination}</td>
                <td className="px-4 py-3">{s.contact_person}</td>

                {/* Courier Column with Link */}
                <td className="px-4 py-3">
                  <a
                    href="https://www.g4s.com/en-ke/track-my-shipment"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-chak-blue hover:underline font-medium"
                  >
                    {s.courier_name}{" "}
                    {s.quantity ? (
                      <span className="ml-1 text-xs text-gray-500">
                        ({s.quantity})
                      </span>
                    ) : null}
                  </a>
                </td>

                <td className="px-4 py-3">{s.courier_staff}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      s.status === "delivered"
                        ? "bg-green-100 text-green-700"
                        : s.status === "in_transit"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">{s.comment || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
