"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { Search, Filter, Truck, Package, Download, MoreHorizontal, Eye, MapPin, Phone, User, RefreshCw, FileText, Printer, Mail, Map, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";
import { Input } from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import { Badge } from "@/components/UI/Badge";
import Loader from "@/components/UI/Loader";

interface Shipment {
  id: number;
  destination: string;
  contact_person: string;
  contact_phone?: string;
  courier_name: string;
  courier_staff: string;
  status: 'dispatched' | 'in_transit' | 'delivered' | 'returned';
  quantity?: number;
  comment?: string;
  dispatched_at: string;
  estimated_delivery?: string;
}

export default function Shipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [query, setQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);

  // Enhanced button styles with better hover effects
  const buttonStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 border border-blue-600',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200',
    ghost: 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 hover:shadow-sm',
    danger: 'text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 hover:shadow-sm',
    success: 'text-green-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all duration-200 hover:shadow-sm'
  };

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/shipments`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (data?.success && Array.isArray(data.data)) {
          setShipments(data.data);
        } else {
          console.error("Unexpected API response:", data);
          setShipments([]);
        }
      } catch (err) {
        console.error("Error fetching shipments:", err);
        setShipments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShipments();
  }, []);

  // Filter shipments
  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch = 
      shipment.id?.toString().includes(query) ||
      shipment.destination?.toLowerCase().includes(query.toLowerCase()) ||
      shipment.contact_person?.toLowerCase().includes(query.toLowerCase()) ||
      shipment.courier_name?.toLowerCase().includes(query.toLowerCase()) ||
      shipment.status?.toLowerCase().includes(query.toLowerCase());

    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: Shipment['status']) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'in_transit': return 'warning';
      case 'dispatched': return 'primary';
      case 'returned': return 'secondary';
      default: return 'default';
    }
  };

  const statusCounts = {
    all: shipments.length,
    dispatched: shipments.filter(s => s.status === 'dispatched').length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    returned: shipments.filter(s => s.status === 'returned').length,
  };

  // Export functionality
  const exportToExcel = () => {
    const headers = ['ID', 'Destination', 'Contact Person', 'Contact Phone', 'Courier', 'Status', 'Quantity', 'Dispatched Date', 'Estimated Delivery'];
    const data = filteredShipments.map(shipment => [
      shipment.id,
      shipment.destination,
      shipment.contact_person,
      shipment.contact_phone || 'N/A',
      shipment.courier_name,
      shipment.status,
      shipment.quantity || 'N/A',
      new Date(shipment.dispatched_at).toLocaleDateString(),
      shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shipments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    alert('PDF export functionality would be implemented here with a PDF generation library');
    // In a real implementation, you would use a library like jspdf or pdfmake
    console.log('Exporting to PDF:', filteredShipments);
  };

  // Quick Actions functionality
  const refreshShipments = () => {
    window.location.reload();
  };

  // const markAsDelivered = (shipmentId: number) => {
  //   if (confirm('Mark this shipment as delivered?')) {
  //     // API call to update status would go here
  //     console.log('Marking shipment as delivered:', shipmentId);
  //     alert(`Shipment #${shipmentId} marked as delivered`);
  //   }
  // };

  const trackShipment = (courierName: string, trackingNumber: string) => {
    const trackingUrls: { [key: string]: string } = {
      'g4s': 'https://www.g4s.com/en-ke/track-my-shipment',
      'dhl': 'https://www.dhl.com/ken-en/home/tracking.html',
      'fedex': 'https://www.fedex.com/en-ke/tracking.html',
      'ups': 'https://www.ups.com/track?loc=en_KE'
    };

    const url = trackingUrls[courierName.toLowerCase()] || 'https://www.google.com/search?q=track+shipment';
    window.open(url, '_blank');
  };

  const sendNotification = (shipmentId: number) => {
    const phone = prompt('Enter phone number for notification:');
    if (phone) {
      console.log('Sending notification for shipment:', shipmentId, 'to:', phone);
      alert(`Notification sent for shipment #${shipmentId}`);
    }
  };

  // const printShippingLabel = (shipmentId: number) => {
  //   console.log('Printing shipping label for:', shipmentId);
  //   alert(`Shipping label for #${shipmentId} sent to printer`);
  // };

  // const viewOnMap = (destination: string) => {
  //   const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  //   window.open(mapUrl, '_blank');
  // };

  // Bulk actions
  const selectAllShipments = () => {
    if (selectedShipments.length === filteredShipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(filteredShipments.map(s => s.id));
    }
  };

  const bulkMarkAsDelivered = () => {
    if (selectedShipments.length === 0) {
      alert('Please select shipments first');
      return;
    }
    if (confirm(`Mark ${selectedShipments.length} shipments as delivered?`)) {
      console.log('Bulk marking as delivered:', selectedShipments);
      alert(`${selectedShipments.length} shipments marked as delivered`);
      setSelectedShipments([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" label="Loading shipments..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">Shipment Management</h1>
            <p className="text-gray-600 mt-2">Track and manage all dosimeter shipments</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <div className="relative group">
              <Button 
                variant="outline" 
                className={`flex items-center space-x-2 ${buttonStyles.outline}`}
                onClick={exportToExcel}
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              {/* Dropdown for export options */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button 
                  onClick={exportToExcel}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 transition-colors duration-150"
                >
                  <FileText className="h-4 w-4" />
                  <span>Export as Excel</span>
                </button>
                <button 
                  onClick={exportToPDF}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 transition-colors duration-150"
                >
                  <FileText className="h-4 w-4" />
                  <span>Export as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-blue-800">Quick Actions:</span>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshShipments}
                className={`flex items-center space-x-2 ${buttonStyles.outline}`}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>

              {/* <Button 
                variant="outline" 
                size="sm" 
                onClick={bulkMarkAsDelivered}
                className={`flex items-center space-x-2 ${buttonStyles.success}`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark Selected as Delivered</span>
              </Button> */}

              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllShipments}
                className={`flex items-center space-x-2 ${buttonStyles.outline}`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>
                  {selectedShipments.length === filteredShipments.length ? 'Deselect All' : 'Select All'}
                </span>
              </Button>

              <div className="text-sm text-blue-700 ml-2">
                {selectedShipments.length} selected
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            { status: 'all', label: 'Total', count: statusCounts.all, color: 'gray', icon: Package },
            { status: 'dispatched', label: 'Dispatched', count: statusCounts.dispatched, color: 'blue', icon: Truck },
            { status: 'in_transit', label: 'In Transit', count: statusCounts.in_transit, color: 'yellow', icon: Clock },
            { status: 'delivered', label: 'Delivered', count: statusCounts.delivered, color: 'green', icon: CheckCircle },
            { status: 'returned', label: 'Returned', count: statusCounts.returned, color: 'purple', icon: AlertCircle },
          ].map((stat) => (
            <Card 
              key={stat.status}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:transform hover:-translate-y-1 ${
                statusFilter === stat.status ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => setStatusFilter(stat.status)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.count}</p>
                  </div>
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search shipments..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "table" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={viewMode === "table" ? buttonStyles.primary : buttonStyles.outline}
                  >
                    Table
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? buttonStyles.primary : buttonStyles.outline}
                  >
                    Grid
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`flex items-center space-x-2 ${buttonStyles.outline}`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {viewMode === "table" ? (
          /* Table View */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedShipments.length === filteredShipments.length && filteredShipments.length > 0}
                          onChange={selectAllShipments}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Shipment
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Courier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredShipments.map((shipment) => (
                      <tr 
                        key={shipment.id} 
                        className={`hover:bg-blue-50 transition-colors duration-150 ${
                          selectedShipments.includes(shipment.id) ? 'bg-blue-25' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedShipments.includes(shipment.id)}
                            onChange={() => {
                              setSelectedShipments(prev =>
                                prev.includes(shipment.id)
                                  ? prev.filter(id => id !== shipment.id)
                                  : [...prev, shipment.id]
                              );
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">#{shipment.id}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(shipment.dispatched_at).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{shipment.destination}</p>
                              {shipment.quantity && (
                                <p className="text-sm text-gray-500">{shipment.quantity} items</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <p className="text-sm font-medium text-gray-900">{shipment.contact_person}</p>
                            </div>
                            {shipment.contact_phone && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <p className="text-sm text-gray-500">{shipment.contact_phone}</p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <button
                              onClick={() => trackShipment(shipment.courier_name, shipment.id.toString())}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline"
                            >
                              {shipment.courier_name}
                            </button>
                            <p className="text-sm text-gray-500 mt-1">{shipment.courier_staff}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusVariant(shipment.status)}>
                            {shipment.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            {/* <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => markAsDelivered(shipment.id)}
                              className={buttonStyles.success}
                              title="Mark as Delivered"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button> */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => trackShipment(shipment.courier_name, shipment.id.toString())}
                              className={buttonStyles.outline}
                              title="Track Shipment"
                            >
                              <Map className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => sendNotification(shipment.id)}
                              className={buttonStyles.primary}
                              title="Send Notification"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            {/* <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => printShippingLabel(shipment.id)}
                              className={buttonStyles.outline}
                              title="Print Label"
                            >
                              <Printer className="h-4 w-4" />
                            </Button> */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {filteredShipments.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {query || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters to find what you\'re looking for.'
                      : 'No shipments have been created yet. Get started by creating your first shipment.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredShipments.map((shipment) => (
              <Card key={shipment.id} className="hover:shadow-lg transition-all duration-200 hover:transform hover:-translate-y-1 border border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle size="sm" className="text-gray-900">
                      #{shipment.id}
                    </CardTitle>
                    <Badge variant={getStatusVariant(shipment.status)}>
                      {shipment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">{shipment.destination}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{shipment.contact_person}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{shipment.courier_name}</p>
                    </div>
                  </div>
                  
                  {shipment.comment && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">{shipment.comment}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      {new Date(shipment.dispatched_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-2">
                      {/* <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => markAsDelivered(shipment.id)}
                        className={buttonStyles.success}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button> */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => trackShipment(shipment.courier_name, shipment.id.toString())}
                        className={buttonStyles.outline}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State for Grid */}
            {filteredShipments.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
                <p className="text-gray-500 mb-4">
                  {query || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters.'
                    : 'No shipments available.'
                  }
                </p>
                <Button className={buttonStyles.primary}>
                  <Truck className="h-4 w-4 mr-2" />
                  Create First Shipment
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer Stats */}
        {filteredShipments.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredShipments.length} of {shipments.length} shipments
              {selectedShipments.length > 0 && ` • ${selectedShipments.length} selected`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}