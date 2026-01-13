"use client";

import { Truck, Package, CheckCircle, MapPin, Calendar, User, RotateCcw, Eye, Phone, Clock, Navigation, Route, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Shipment } from '@/types';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config';
import { useRouter } from 'next/navigation';

interface ShipmentCardCompactProps {
  shipment: Shipment;
  onViewDetails?: (shipment: Shipment) => void;
}

interface Item {
  id: number;
  serial_number: string;
  model?: string;
  type?: string;
  status?: string;
}

export default function ShipmentCardCompact({ shipment, onViewDetails }: ShipmentCardCompactProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const status = shipment.status as string;

  const statusConfig = {
    dispatched: {
      icon: Package,
      color: 'purple',
      bgColor: 'bg-purple-500',
      gradient: 'from-purple-600 to-purple-700',
      label: 'Dispatched',
      progress: 25,
    },
    in_transit: {
      icon: Truck,
      color: 'amber',
      bgColor: 'bg-amber-500',
      gradient: 'from-amber-600 to-amber-700',
      label: 'In Transit',
      progress: 60,
    },
    delivered: {
      icon: CheckCircle,
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      gradient: 'from-emerald-600 to-emerald-700',
      label: 'Delivered',
      progress: 100,
    },
    returned: {
      icon: RotateCcw,
      color: 'blue',
      bgColor: 'bg-blue-500',
      gradient: 'from-blue-600 to-blue-700',
      label: 'Returned',
      progress: 100,
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.dispatched;
  const StatusIcon = config.icon;

  useEffect(() => {
    if (showDetails && items.length === 0 && !loadingItems) {
      fetchItems();
    }
  }, [showDetails]);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/shipments/${shipment.id}/dosimeters`);
      if (res.ok) {
        const data = await res.json();
        const itemsData = data.data || data.dosimeters || [];
        setItems(itemsData);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleQuickReceive = () => {
    const params = new URLSearchParams();
    params.set("shipmentId", String(shipment.id));
    if (shipment.destination) params.set("hospital", shipment.destination);
    router.push(`/receive?${params.toString()}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Compact Header */}
      <div className={`bg-gradient-to-r ${config.gradient} px-4 py-3 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <StatusIcon className="h-4 w-4 flex-shrink-0" />
            <h3 className="font-semibold text-sm truncate">{shipment.destination}</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{config.label}</span>
          </div>
          <span className="text-xs text-white/80">#{shipment.id}</span>
        </div>
      </div>

      {/* Compact Content */}
      <div className="p-4 space-y-3">
        {/* Key Info Row */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-1.5 text-gray-600">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(shipment.dispatched_at)}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-600">
            <Package className="h-3.5 w-3.5" />
            <span>{shipment.items ?? 0} items</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${config.progress}%` }}
            className={`h-1.5 rounded-full ${config.bgColor}`}
          />
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2 pt-2 border-t border-gray-100"
          >
            {shipment.address && (
              <div className="flex items-start space-x-1.5 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{shipment.address}</span>
              </div>
            )}
            {shipment.contact_person && (
              <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                <User className="h-3.5 w-3.5" />
                <span>{shipment.contact_person}</span>
              </div>
            )}
            {loadingItems ? (
              <div className="text-xs text-gray-500">Loading items...</div>
            ) : items.length > 0 && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">{items.length} items:</span> {items.slice(0, 3).map(i => i.serial_number).join(', ')}
                {items.length > 3 && ` +${items.length - 3} more`}
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-600 hover:text-gray-900 flex items-center space-x-1"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Details</span>
              </>
            )}
          </button>
          
          <div className="flex items-center space-x-2">
            {(status === 'dispatched' || status === 'in_transit') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleQuickReceive}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Receive</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

