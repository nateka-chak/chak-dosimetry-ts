'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardStats from '@/components/Dashboard/Dashboard';
import ShipmentCard from '@/components/Dashboard/ShipmentCard';
import StatusTimeline from '@/components/Dashboard/StatusTimeline';
import { Shipment } from '@/types';
import { API_BASE_URL } from '@/lib/config';

export default function DashboardPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        // Use the new parameter to include dosimeter data
        const res = await fetch(`${API_BASE_URL}/api/shipments`, {
          method: "GET",
          credentials: "include",
        });
        
        if (!res.ok) throw new Error("Failed to fetch shipments");
        const data = await res.json();

        if (data?.success && Array.isArray(data.data)) {
          setShipments(data.data);
        } else {
          console.error("Unexpected API response:", data);
          setShipments([]);
        }
      } catch (err) {
        console.error("Error loading shipments:", err);
        setShipments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 text-lg">Loading shipments and dosimeter data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-8 space-y-10">
      {/* Dashboard Stats */}
      <DashboardStats shipments={shipments} />

      {/* Shipments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shipments.map((shipment) => (
          <motion.div
            key={shipment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ShipmentCard shipment={shipment} />
          </motion.div>
        ))}
      </div>

      {/* Show message if no shipments */}
      {shipments.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md mx-auto">
            <span role="img" aria-label="package" className="h-16 w-16 text-gray-400 mx-auto mb-4 flex items-center justify-center text-4xl">📦</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shipments Found</h3>
            <p className="text-gray-500">There are no active shipments to display.</p>
          </div>
        </div>
      )}

      {/* Example Timeline for first shipment */}
      {shipments.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <StatusTimeline
            status={shipments[0].status}
            dispatchDate={new Date(shipments[0].dispatched_at)}
          />
        </div>
      )}
    </div>
  );
}