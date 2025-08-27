'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardStats from '@/components/Dashboard/Dashboard';
import ShipmentCard from '@/components/Dashboard/ShipmentCard';
import StatusTimeline from '@/components/Dashboard/StatusTimeline';
import { Shipment } from '@/types';

export default function DashboardPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch('/api/shipments');
        if (!res.ok) throw new Error('Failed to fetch shipments');
        const data = await res.json();
        setShipments(data);
      } catch (err) {
        console.error('Error loading shipments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-lg">Loading shipments...</p>
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
