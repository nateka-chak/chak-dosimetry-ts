'use client';

import { useState } from 'react';

interface Shipment {
  id: string;
  hospital: string;
  courier: string;
  status: 'In Transit' | 'Delivered' | 'Pending';
}

export default function Shipments() {
  const [shipments] = useState<Shipment[]>([
    { id: 'SHP001', hospital: 'Nairobi Hospital', courier: 'DHL', status: 'In Transit' },
    { id: 'SHP002', hospital: 'Kenyatta Hospital', courier: 'FedEx', status: 'Delivered' },
    { id: 'SHP003', hospital: 'Moi Hospital', courier: 'G4S', status: 'Pending' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <h1 className="text-2xl font-bold text-chak-blue mb-6">Active Shipments</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">Shipment ID</th>
              <th className="px-4 py-3">Hospital</th>
              <th className="px-4 py-3">Courier</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3">{s.id}</td>
                <td className="px-4 py-3">{s.hospital}</td>
                <td className="px-4 py-3">{s.courier}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      s.status === 'Delivered'
                        ? 'bg-green-100 text-green-700'
                        : s.status === 'In Transit'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
