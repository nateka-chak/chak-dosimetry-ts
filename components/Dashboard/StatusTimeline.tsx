import { CheckCircle, Clock, Truck, Package, RotateCcw, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatusTimelineProps {
  status: 'dispatched' | 'in_transit' | 'delivered' | 'returned';
  dispatchDate?: Date;
  estimatedDelivery?: Date;
  receivedDate?: Date;
  returnedDate?: Date;
  currentLocation?: string;
}

export default function StatusTimeline({
  status,
  dispatchDate,
  estimatedDelivery,
  receivedDate,
  returnedDate,
  currentLocation,
}: StatusTimelineProps) {
  const statusSteps = [
    { 
      key: 'dispatched', 
      label: 'Dispatched', 
      icon: Package,
      description: 'Items dispatched from warehouse',
      color: 'purple'
    },
    { 
      key: 'in_transit', 
      label: 'In Transit', 
      icon: Truck,
      description: 'On the way to destination',
      color: 'amber'
    },
    { 
      key: 'delivered', 
      label: 'Delivered', 
      icon: CheckCircle,
      description: 'Successfully delivered',
      color: 'emerald'
    },
  ];

  const currentStatusIndex = statusSteps.findIndex((step) => step.key === status);
  const currentStep = statusSteps[currentStatusIndex] || statusSteps[0];

  const getStatusColor = (stepIndex: number) => {
    if (stepIndex < currentStatusIndex) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (stepIndex === currentStatusIndex) {
      const colorMap = {
        dispatched: 'text-purple-600 bg-purple-50 border-purple-200',
        in_transit: 'text-amber-600 bg-amber-50 border-amber-200',
        delivered: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        returned: 'text-blue-600 bg-blue-50 border-blue-200',
      };
      return colorMap[status];
    }
    return 'text-gray-400 bg-gray-50 border-gray-200';
  };

  const getIconColor = (stepIndex: number) => {
    if (stepIndex < currentStatusIndex) return 'text-emerald-600';
    if (stepIndex === currentStatusIndex) {
      const colorMap = {
        dispatched: 'text-purple-600',
        in_transit: 'text-amber-600',
        delivered: 'text-emerald-600',
        returned: 'text-blue-600',
      };
      return colorMap[status];
    }
    return 'text-gray-400';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-4"
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Shipment Status</h3>
          <p className="text-xs text-gray-500 mt-1">Tracking progress</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'in_transit' ? 'bg-amber-100 text-amber-800' :
          status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
          status === 'returned' ? 'bg-blue-100 text-blue-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {currentStep.label}
        </div>
      </div>

      {/* Compact Timeline */}
      <div className="relative">
        {/* Horizontal Timeline Line */}
        <div className="absolute left-4 right-4 top-5 h-0.5 bg-gray-200">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${
              status === 'in_transit' ? 'bg-amber-500' :
              status === 'delivered' ? 'bg-emerald-500' :
              status === 'returned' ? 'bg-blue-500' :
              'bg-purple-500'
            }`}
            style={{ 
              transformOrigin: 'left',
              width: `${((currentStatusIndex + 1) / statusSteps.length) * 100}%` 
            }}
          />
        </div>

        <div className="flex justify-between relative">
          {statusSteps.map((step, index) => {
            const IconComponent = step.icon;
            const isCompleted = index < currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const isUpcoming = index > currentStatusIndex;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center relative z-10"
              >
                {/* Timeline Dot */}
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-2 transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                  isCurrent ? getStatusColor(index) :
                  'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <IconComponent className={`w-3 h-3 ${getIconColor(index)}`} />
                  )}
                </div>

                {/* Step Label */}
                <div className="text-center">
                  <p className={`text-xs font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  
                  {/* Date Information - Only show for relevant steps */}
                  {isCurrent && (
                    <div className="mt-1 space-y-1">
                      {step.key === 'dispatched' && dispatchDate && (
                        <p className="text-xs text-gray-500">
                          {formatDate(dispatchDate)}
                        </p>
                      )}

                      {step.key === 'in_transit' && estimatedDelivery && (
                        <p className="text-xs text-gray-500">
                          Est: {formatDate(estimatedDelivery)}
                        </p>
                      )}

                      {step.key === 'delivered' && receivedDate && (
                        <p className="text-xs text-emerald-600 font-medium">
                          {formatDate(receivedDate)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Current Status Details */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start space-x-3">
          <div className={`p-1 rounded ${
            status === 'in_transit' ? 'bg-amber-100' :
            status === 'delivered' ? 'bg-emerald-100' :
            status === 'returned' ? 'bg-blue-100' :
            'bg-purple-100'
          }`}>
            <currentStep.icon className={`w-3 h-3 ${
              status === 'in_transit' ? 'text-amber-600' :
              status === 'delivered' ? 'text-emerald-600' :
              status === 'returned' ? 'text-blue-600' :
              'text-purple-600'
            }`} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">
              {status === 'in_transit' && currentLocation 
                ? `Currently in ${currentLocation}`
                : currentStep.description
              }
            </p>
            {status === 'in_transit' && estimatedDelivery && (
              <p className="text-xs text-gray-600 mt-1">
                Estimated delivery: {formatDate(estimatedDelivery)}
              </p>
            )}
            {status === 'returned' && returnedDate && (
              <p className="text-xs text-blue-600 mt-1">
                Returned: {formatDate(returnedDate)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Compact Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round((currentStatusIndex + 1) / statusSteps.length * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStatusIndex + 1) / statusSteps.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-1.5 rounded-full ${
              status === 'in_transit' ? 'bg-amber-500' :
              status === 'delivered' ? 'bg-emerald-500' :
              status === 'returned' ? 'bg-blue-500' :
              'bg-purple-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}