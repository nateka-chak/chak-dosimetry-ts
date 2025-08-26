import { CheckCircle, Clock, Truck, Package } from 'lucide-react';

interface StatusTimelineProps {
  status: 'dispatched' | 'in_transit' | 'delivered';
  dispatchDate?: Date;
  estimatedDelivery?: Date;
  receivedDate?: Date;
}

export default function StatusTimeline({ status, dispatchDate, estimatedDelivery, receivedDate }: StatusTimelineProps) {
  const statusSteps = [
    { key: 'dispatched', label: 'Dispatched', icon: Package },
    { key: 'in_transit', label: 'In Transit', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const currentStatusIndex = statusSteps.findIndex(step => step.key === status);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipment Status</h3>
      
      <div className="relative pl-8">
        {/* Timeline vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-yellow-200 to-green-200 rounded-full"></div>
        
        {statusSteps.map((step, index) => {
          const isCompleted = index < currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          const IconComponent = step.icon;

          return (
            <div key={step.key} className="relative flex items-start mb-10 last:mb-0">
              {/* Step circle */}
              <div
                className={`flex items-center justify-center rounded-full p-2 z-10 shadow-md transition-all
                  ${isCompleted ? 'bg-green-500' : 
                    isCurrent ? 'bg-blue-600 animate-pulse' : 
                    'bg-gray-300'}
                `}
              >
                <IconComponent className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="ml-4 flex-1">
                <p className={`font-medium text-base ${
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>

                {step.key === 'dispatched' && dispatchDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    Dispatched on {new Date(dispatchDate).toLocaleDateString()}
                  </p>
                )}
                
                {step.key === 'in_transit' && estimatedDelivery && (
                  <p className="text-sm text-gray-600 mt-1">
                    Estimated delivery: {new Date(estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
                
                {step.key === 'delivered' && receivedDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    Delivered on {new Date(receivedDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Completion checkmark */}
              {isCompleted && (
                <div className="ml-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Extra note when in transit */}
      {status === 'in_transit' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm text-blue-700">
              Your shipment is <span className="font-semibold">in transit</span>.  
              Expected delivery: {estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString() : 'Soon'}.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
