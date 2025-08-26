import { Truck, Package, CheckCircle, MapPin, Calendar } from 'lucide-react';
import { Shipment } from '@/types';

interface ShipmentCardProps {
  shipment: Shipment;
}

export default function ShipmentCard({ shipment }: ShipmentCardProps) {
  const getStatusIcon = () => {
    switch (shipment.status) {
      case 'dispatched': return <Package className="h-5 w-5 text-blue-500" />;
      case 'in_transit': return <Truck className="h-5 w-5 text-yellow-500" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (shipment.status) {
      case 'dispatched': return <span className="status-dispatched">Dispatched</span>;
      case 'in_transit': return <span className="status-transit">In Transit</span>;
      case 'delivered': return <span className="status-delivered">Delivered</span>;
      default: return <span className="status-pending">Pending</span>;
    }
  };

  const getTimelineColor = () => {
    if (shipment.status === 'delivered') return 'bg-green-500';
    if (shipment.status === 'in_transit') return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{shipment.destination}</h3>
          <p className="text-sm text-gray-500">ID: {shipment.id}</p>
        </div>
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-2">
            {getStatusText()}
          </div>
        </div>
      </div>
      
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <MapPin className="h-4 w-4 mr-1" />
        <span>{shipment.address || 'Address not specified'}</span>
      </div>
      
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <Calendar className="h-4 w-4 mr-1" />
        <span>Dispatched: {new Date(shipment.dispatched_at).toLocaleDateString()}</span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Progress</span>
          <span>{shipment.items || 0} items</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getTimelineColor()}`}
            style={{ 
              width: shipment.status === 'dispatched' ? '33%' : 
                     shipment.status === 'in_transit' ? '66%' : '100%' 
            }}
          ></div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {shipment.contact_person} • {shipment.contact_phone}
        </span>
        <button className="text-chak-blue hover:text-chak-blue-dark text-sm font-medium">
          View Details
        </button>
      </div>
    </div>
 );
}