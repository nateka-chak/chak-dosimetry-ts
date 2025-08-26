'use client';

import Link from 'next/link';
import { Package, Truck, ClipboardCheck } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <h1 className="text-2xl font-bold text-chak-blue mb-6">
        CHAK Dosimetry Tracker Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dispatch"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
        >
          <Truck className="w-10 h-10 text-chak-blue mb-4" />
          <h2 className="font-semibold text-lg">Dispatch</h2>
          <p className="text-sm text-gray-600">
            Send dosimetries to hospitals.
          </p>
        </Link>

        <Link
          href="/shipments"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
        >
          <Package className="w-10 h-10 text-chak-blue mb-4" />
          <h2 className="font-semibold text-lg">Shipments</h2>
          <p className="text-sm text-gray-600">
            Track and manage active shipments.
          </p>
        </Link>

        <Link
          href="/receive"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
        >
          <ClipboardCheck className="w-10 h-10 text-chak-blue mb-4" />
          <h2 className="font-semibold text-lg">Receive</h2>
          <p className="text-sm text-gray-600">
            Confirm receipt of dosimetries.
          </p>
        </Link>
      </div>
    </div>
  );
}
