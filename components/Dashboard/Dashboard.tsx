"use client";

import { Truck, Package, CheckCircle, Clock, RefreshCw, MapPin, Eye, X, TrendingUp, AlertCircle } from 'lucide-react';
import { Shipment } from '@/types';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  shipments?: Shipment[];
}

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  count: number;
  shipments: Shipment[];
}

// Status Modal Component
function StatusModal({ isOpen, onClose, status, count, shipments }: StatusModalProps) {
  const statusConfig = {
    total: { title: 'All Shipments', color: 'blue', icon: Package },
    dispatched: { title: 'Dispatched Shipments', color: 'purple', icon: Clock },
    in_transit: { title: 'In Transit Shipments', color: 'yellow', icon: Truck },
    delivered: { title: 'Delivered Shipments', color: 'green', icon: CheckCircle },
    returned: { title: 'Returned Shipments', color: 'blue', icon: RefreshCw }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.total;
  const Icon = config.icon;
  const filteredShipments = status === 'total' ? shipments : shipments.filter(s => s.status === status);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r from-${config.color}-600 to-${config.color}-700 p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{config.title}</h2>
                    <p className="text-blue-100">{count} shipments found</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {filteredShipments.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
                  <p className="text-gray-500">There are no shipments with this status.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredShipments.map((shipment, index) => (
                    <motion.div
                      key={shipment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`bg-${config.color}-100 p-3 rounded-lg`}>
                            <Icon className={`h-5 w-5 text-${config.color}-600`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{shipment.destination}</h4>
                            <p className="text-sm text-gray-500">Serial: {shipment.serialNumber}</p>
                            <p className="text-sm text-gray-500">
                              Dispatched: {new Date(shipment.dispatchDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${config.color}-100 text-${config.color}-800`}>
                            {shipment.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Shipment Tracking Modal
function TrackingModal({ isOpen, onClose, shipment }: { isOpen: boolean; onClose: () => void; shipment: Shipment | null }) {
  const [currentStage, setCurrentStage] = useState(0);
  
  const trackingStages = [
    { status: 'dispatched', label: 'Dispatched', description: 'Package has been dispatched from CHAK', color: 'purple' },
    { status: 'in_transit', label: 'In Transit', description: 'Package is on the way to destination', color: 'yellow' },
    { status: 'delivered', label: 'Delivered', description: 'Package has been delivered successfully', color: 'green' },
  ];

  useEffect(() => {
    if (shipment) {
      const stageIndex = trackingStages.findIndex(stage => stage.status === shipment.status);
      setCurrentStage(Math.max(0, stageIndex));
    }
  }, [shipment]);

  const getStatusIcon = (stageIndex: number, currentStage: number) => {
    if (stageIndex < currentStage) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (stageIndex === currentStage) return <Clock className="h-5 w-5 text-yellow-500" />;
    return <Package className="h-5 w-5 text-gray-300" />;
  };

  return (
    <AnimatePresence>
      {isOpen && shipment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-6 w-6" />
                  <div>
                    <h2 className="text-2xl font-bold">Shipment Tracking</h2>
                    <p className="text-blue-100">{shipment.destination}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Map Visualization */}
            <div className="p-6 border-b">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 text-center relative overflow-hidden">
                {/* Animated moving truck for in_transit status */}
                {shipment.status === 'in_transit' && (
                  <motion.div
                    animate={{ x: [0, 200, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-4 left-4"
                  >
                    <Truck className="h-8 w-8 text-blue-600" />
                  </motion.div>
                )}
                
                {/* Checkmark for delivered status */}
                {shipment.status === 'delivered' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto mb-4"
                  >
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                )}

                {/* Package for dispatched status */}
                {shipment.status === 'dispatched' && (
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mx-auto mb-4"
                  >
                    <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {shipment.status === 'dispatched' && 'Ready for Dispatch'}
                  {shipment.status === 'in_transit' && 'On the Way to Destination'}
                  {shipment.status === 'delivered' && 'Successfully Delivered'}
                </h3>
                <p className="text-gray-600">
                  Serial: <strong>{shipment.serialNumber}</strong>
                </p>
              </div>
            </div>

            {/* Tracking Progress */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Progress</h3>
              <div className="space-y-4">
                {trackingStages.map((stage, index) => (
                  <div key={stage.status} className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentStage ? `bg-${stage.color}-500` : 'bg-gray-300'
                    }`}>
                      {getStatusIcon(index, currentStage)}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        index <= currentStage ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {stage.label}
                      </p>
                      <p className={`text-sm ${
                        index <= currentStage ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {stage.description}
                      </p>
                    </div>
                    {index <= currentStage && (
                      <span className="text-sm text-gray-500">
                        {index === currentStage ? 'Current' : 'Completed'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Dashboard({ shipments = [] }: DashboardProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  const stats = {
    total: shipments.length,
    dispatched: shipments.filter(s => s.status === 'dispatched').length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    returned: shipments.filter(s => s.status === 'returned').length,
  };

  const recentShipments = shipments.slice(0, 5);

  const handleStatusCardClick = (status: string) => {
    setSelectedStatus(status);
  };

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowTrackingModal(true);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Page Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-2">Monitor shipments and track progress in real-time</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <TrendingUp className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { key: 'total', label: 'Total Shipments', icon: Package, color: 'blue', value: stats.total },
          { key: 'dispatched', label: 'Dispatched', icon: Clock, color: 'purple', value: stats.dispatched },
          { key: 'inTransit', label: 'In Transit', icon: Truck, color: 'yellow', value: stats.inTransit },
          { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'green', value: stats.delivered },
          { key: 'returned', label: 'Returned', icon: RefreshCw, color: 'blue', value: stats.returned },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer border border-gray-100 hover:shadow-xl transition-all duration-200"
              onClick={() => handleStatusCardClick(stat.key)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`bg-${stat.color}-100 p-3 rounded-xl`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Eye className="h-4 w-4 mr-1" />
                Click to view details
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Shipments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-gray-100 rounded-2xl shadow-lg p-6 h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
            <div className="space-y-4">
              {[
                { href: "/dispatch", icon: Truck, label: "Dispatch New Shipment", color: "blue" },
                { href: "/receive", icon: CheckCircle, label: "Confirm Receipt", color: "green" },
                { href: "/shipments", icon: Package, label: "View All Shipments", color: "gray" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center p-4 rounded-xl bg-gradient-to-r from-${action.color}-600 to-${action.color}-700 text-black font-medium shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span>{action.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Shipments</h3>
              <Link href="/shipments" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                View all →
              </Link>
            </div>
            
            {recentShipments.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent shipments found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentShipments.map((shipment, index) => (
                  <motion.div
                    key={shipment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        shipment.status === 'delivered' ? 'bg-green-100' :
                        shipment.status === 'in_transit' ? 'bg-yellow-100' :
                        shipment.status === 'dispatched' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        {shipment.status === 'delivered' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {shipment.status === 'in_transit' && <Truck className="h-5 w-5 text-yellow-600" />}
                        {shipment.status === 'dispatched' && <Clock className="h-5 w-5 text-purple-600" />}
                        {shipment.status === 'returned' && <RefreshCw className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{shipment.destination}</h4>
                        <p className="text-sm text-gray-500">Serial: {shipment.serialNumber}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(shipment.dispatchDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        shipment.status === 'in_transit' ? 'bg-yellow-100 text-yellow-800' :
                        shipment.status === 'dispatched' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {shipment.status.replace('_', ' ')}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(shipment)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={selectedStatus !== null}
        onClose={() => setSelectedStatus(null)}
        status={selectedStatus || ''}
        count={stats[selectedStatus as keyof typeof stats] || 0}
        shipments={shipments}
      />

      {/* Tracking Modal */}
      <TrackingModal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        shipment={selectedShipment}
      />
    </div>
  );
}