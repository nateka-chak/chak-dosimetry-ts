"use client";

import { Truck, Package, CheckCircle, MapPin, Calendar, User, RotateCcw, Eye, Phone, Clock, Navigation, Route, ChevronDown, ChevronUp } from 'lucide-react';
import { Shipment } from '@/types';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { API_BASE_URL } from '@/lib/config';

interface ShipmentCardProps {
  shipment: Shipment;
  onViewDetails?: (shipment: Shipment) => void;
}

interface Dosimeter {
  id: number;
  serial_number: string;
  model?: string;
  type?: string;
  status?: string;
}

export default function ShipmentCard({ shipment, onViewDetails }: ShipmentCardProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [showSerials, setShowSerials] = useState(false);
  const [dosimeters, setDosimeters] = useState<Dosimeter[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const router = useRouter();
  const status = shipment.status as string;

  const statusConfig = {
    dispatched: {
      icon: Package,
      color: 'purple',
      bgColor: 'bg-purple-500',
      gradient: 'from-purple-600 to-purple-700',
      label: 'Dispatched',
      progress: 25,
      description: 'Ready for pickup',
      mapPosition: 10
    },
    in_transit: {
      icon: Truck,
      color: 'amber',
      bgColor: 'bg-amber-500',
      gradient: 'from-amber-600 to-amber-700',
      label: 'In Transit',
      progress: 60,
      description: 'On the way to destination',
      mapPosition: 50
    },
    delivered: {
      icon: CheckCircle,
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      gradient: 'from-emerald-600 to-emerald-700',
      label: 'Delivered',
      progress: 100,
      description: 'Successfully delivered',
      mapPosition: 95
    },
    returned: {
      icon: RotateCcw,
      color: 'blue',
      bgColor: 'bg-blue-500',
      gradient: 'from-blue-600 to-blue-700',
      label: 'Returned',
      progress: 100,
      description: 'Returned to sender',
      mapPosition: 10
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.dispatched;
  const StatusIcon = config.icon;

  // Fetch dosimeter serials when user expands the section
  useEffect(() => {
    if (showSerials && dosimeters.length === 0 && !loadingSerials) {
      fetchDosimeterSerials();
    }
  }, [showSerials]);

  const fetchDosimeterSerials = async () => {
    setLoadingSerials(true);
    try {
      // Try different API endpoints - you'll need to implement one of these
      const endpoints = [
        `${API_BASE_URL}/api/shipments/${shipment.id}/dosimeters`,
        `${API_BASE_URL}/api/dosimeters?shipment_id=${shipment.id}`,
        `${API_BASE_URL}/api/dispatch/${shipment.id}/dosimeters`
      ];

      let dosimeterData: Dosimeter[] = [];
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            // Handle different response structures
            if (Array.isArray(data)) {
              dosimeterData = data;
            } else if (data.dosimeters && Array.isArray(data.dosimeters)) {
              dosimeterData = data.dosimeters;
            } else if (data.data && Array.isArray(data.data)) {
              dosimeterData = data.data;
            }
            break;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed, trying next...`);
          continue;
        }
      }

      // Fallback: If no API endpoint works, check if serials are in shipment data
      if (dosimeterData.length === 0 && (shipment as any).dosimeters) {
        dosimeterData = (shipment as any).dosimeters;
      }

      setDosimeters(dosimeterData);
    } catch (error) {
      console.error('Error fetching dosimeter serials:', error);
    } finally {
      setLoadingSerials(false);
    }
  };

  const handleTrackShipment = () => {
    setIsTracking(true);
    setTimeout(() => {
      if (onViewDetails) {
        onViewDetails(shipment);
      }
    }, 800);
  };

  const handleToggleSerials = () => {
    setShowSerials(!showSerials);
  };

  const handleQuickReceive = () => {
    const params = new URLSearchParams();
    params.set("shipmentId", String(shipment.id));
    if (shipment.destination) {
      params.set("hospital", shipment.destination);
    }
    router.push(`/receive?${params.toString()}`);
  };

  // Mock route points for the map visualization
  const routePoints = [
    { position: 0, label: 'Warehouse' },
    { position: config.mapPosition, label: 'Current' },
    { position: 100, label: 'Destination' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
    >
      {/* Enhanced Status Header with Map Preview */}
      <div className={`bg-gradient-to-r ${config.gradient} px-6 py-4 text-white relative overflow-hidden`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-2">
            <Route className="h-20 w-20" />
          </div>
          <div className="absolute bottom-2 left-2">
            <Navigation className="h-16 w-16" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl">{shipment.destination}</h3>
                <p className="text-white/80 text-sm">{config.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">
                {config.label}
              </div>
              <p className="text-white/80 text-xs mt-1">ID: {shipment.id}</p>
            </div>
          </div>

          {/* Mini Map Visualization */}
          <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/90">Live Tracking</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${config.bgColor} animate-pulse`}></div>
                <span className="text-xs text-white/80">Active</span>
              </div>
            </div>
            
            {/* Route Visualization */}
            <div className="relative h-12 bg-white/10 rounded-lg overflow-hidden">
              {/* Route Line */}
              <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-white/30 transform -translate-y-1/2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${config.progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-0.5 ${config.bgColor} relative`}
                >
                  {/* Moving Truck Icon */}
                  {status === 'in_transit' && (
                    <motion.div
                      animate={{ x: ['0%', '90%', '0%'] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-2 right-0"
                    >
                      <Truck className={`h-4 w-4 ${config.color === 'amber' ? 'text-amber-500' : 'text-white'}`} />
                    </motion.div>
                  )}
                </motion.div>
              </div>
              
              {/* Route Points */}
              {routePoints.map((point, index) => (
                <div
                  key={index}
                  className="absolute top-1/2 transform -translate-y-1/2"
                  style={{ left: `${point.position}%` }}
                >
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    point.position <= config.mapPosition 
                      ? `${config.bgColor} border-white` 
                      : 'bg-white/30 border-white/50'
                  }`} />
                  <span className="absolute top-full mt-1 text-xs text-white/80 whitespace-nowrap transform -translate-x-1/2">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Compact Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-800">Delivery Progress</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-medium text-gray-600">{config.progress}%</span>
              <div className={`w-1.5 h-1.5 rounded-full ${config.bgColor} animate-pulse`}></div>
            </div>
          </div>
          
          {/* Animated Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${config.progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-2 rounded-full ${config.bgColor} relative overflow-hidden`}
            >
              {/* Shimmer effect for in_transit status */}
              {status === 'in_transit' && (
                <motion.div
                  animate={{ x: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white/30 skew-x-12"
                />
              )}
            </motion.div>
          </div>

          {/* Compact Status Timeline */}
          <div className="flex justify-between relative mt-4">
            {['dispatched', 'in_transit', 'delivered'].map((stage, index) => {
              const isCompleted = 
                (stage === 'dispatched' && ['dispatched', 'in_transit', 'delivered', 'returned'].includes(status)) ||
                (stage === 'in_transit' && ['in_transit', 'delivered'].includes(status)) ||
                (stage === 'delivered' && stage === status);
              
              const isCurrent = 
                (stage === 'dispatched' && status === 'dispatched') ||
                (stage === 'in_transit' && status === 'in_transit') ||
                (stage === 'delivered' && status === 'delivered');

              return (
                <div key={stage} className="flex flex-col items-center relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      isCompleted 
                        ? `${config.bgColor} border-${config.color}-500 text-white`
                        : 'bg-white border-gray-300 text-gray-400'
                    } ${
                      isCurrent ? 'ring-2 ring-offset-1 ring-opacity-50' : ''
                    } ${isCurrent ? `ring-${config.color}-500` : ''}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </motion.div>
                  <span className={`text-xs mt-1 font-medium ${
                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                  {isCurrent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-1.5 h-1.5 rounded-full ${config.bgColor} mt-0.5`}
                    />
                  )}
                </div>
              );
            })}
            
            {/* Connecting Line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-300 -z-10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${config.progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-0.5 ${config.bgColor}`}
              />
            </div>
          </div>
        </div>

        {/* Compact Item Serials Section */}
        <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <button
            onClick={handleToggleSerials}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-white border border-gray-300 hover:border-gray-400 transition-all duration-200"
          >
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-gray-600" />
              <div className="text-left">
                <h4 className="text-sm font-semibold text-gray-900">Item Serials</h4>
                <p className="text-xs text-gray-600">
                  {dosimeters.length > 0 
                    ? `${dosimeters.length} item${dosimeters.length !== 1 ? 's' : ''} in this shipment` 
                    : 'Click to view item serials'
                  }
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showSerials ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {showSerials ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </motion.div>
          </button>

          {/* Serials List */}
          {showSerials && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              {loadingSerials ? (
                <div className="flex items-center justify-center py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-xs text-gray-600">Loading...</span>
                </div>
              ) : dosimeters.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {dosimeters.map((dosimeter, index) => (
                    <motion.div
                      key={dosimeter.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {dosimeter.serial_number}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {dosimeter.model || dosimeter.type || 'Item'} • {dosimeter.status || 'Unknown'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Package className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No item data available</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Compact Shipment Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
            <MapPin className={`h-4 w-4 text-${config.color}-600 mt-0.5 flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">Address</p>
              <p className="text-xs text-gray-700 mt-0.5 truncate">{shipment.address || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
            <User className={`h-4 w-4 text-${config.color}-600 mt-0.5 flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">Contact</p>
              <p className="text-xs text-gray-700 mt-0.5 truncate">{shipment.contact_person || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
            <Calendar className={`h-4 w-4 text-${config.color}-600 mt-0.5 flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">Dispatch Date</p>
              <p className="text-xs text-gray-700 mt-0.5">
                {new Date(shipment.dispatched_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
            <Phone className={`h-4 w-4 text-${config.color}-600 mt-0.5 flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">Phone</p>
              <p className="text-xs text-gray-700 mt-0.5 truncate">{shipment.contact_phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Compact Courier Info */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 mb-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-semibold text-gray-700">Courier</p>
              <p className="text-gray-600 mt-0.5">{shipment.courier_name || 'Not assigned'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Staff</p>
              <p className="text-gray-600 mt-0.5">{shipment.courier_staff || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Compact Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-1.5 text-xs text-gray-600">
            <Package className="h-3.5 w-3.5" />
            <span className="font-medium">
              {dosimeters.length > 0 
                ? `${dosimeters.length} item${dosimeters.length !== 1 ? 's' : ''}` 
                : `${shipment.items ?? 0} items`
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {(status === 'dispatched' || status === 'in_transit') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleQuickReceive}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 shadow-sm"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Receive</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTrackShipment}
              disabled={isTracking}
              className={`flex items-center space-x-1.5 px-3 py-1.5 ${config.bgColor} text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-all duration-200 shadow-sm ${
                isTracking ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <motion.div
                animate={isTracking ? { rotate: 360 } : {}}
                transition={isTracking ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <Navigation className="h-3.5 w-3.5" />
              </motion.div>
              <span>{isTracking ? '...' : 'Track'}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Enhanced Animated Elements */}
      {status === 'in_transit' && (
        <motion.div
          animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 right-4 opacity-20"
        >
          <Truck className="h-20 w-20 text-amber-500" />
        </motion.div>
      )}

      {status === 'delivered' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1, 0.8, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-4 right-4 opacity-20"
        >
          <CheckCircle className="h-20 w-20 text-emerald-500" />
        </motion.div>
      )}
    </motion.div>
  );
}