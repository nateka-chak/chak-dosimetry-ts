import { Truck, Package, CheckCircle, Clock } from 'lucide-react';
import { Shipment } from '@/types';

interface DashboardProps {
  shipments?: Shipment[];
}

export default function Dashboard({ shipments = [] }: DashboardProps) {
  const stats = {
    total: shipments.length,
    dispatched: shipments.filter(s => s.status === 'dispatched').length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length
  };

  return (
    <div className="p-6 space-y-10">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of shipments and quick actions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 card-hover">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Shipments</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-md p-6 card-hover">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <Truck className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">In Transit</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-md p-6 card-hover">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Delivered</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-md p-6 card-hover">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Dispatched</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.dispatched}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a 
            href="/dispatch" 
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md hover:scale-105 transform transition-all"
          >
            <Truck className="h-10 w-10 mb-3" />
            <span>Dispatch New Shipment</span>
          </a>
          <a 
            href="/receive" 
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-medium shadow-md hover:scale-105 transform transition-all"
          >
            <CheckCircle className="h-10 w-10 mb-3" />
            <span>Confirm Receipt</span>
          </a>
          <a 
            href="/shipments" 
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium shadow-md hover:scale-105 transform transition-all"
          >
            <Package className="h-10 w-10 mb-3" />
            <span>View All Shipments</span>
          </a>
        </div>
      </div>
    </div>
  );
}
