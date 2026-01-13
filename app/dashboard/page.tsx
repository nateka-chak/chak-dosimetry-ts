'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardStats from '@/components/Dashboard/Dashboard';
import ShipmentCard from '@/components/Dashboard/ShipmentCard';
import { Shipment } from '@/types';
import { API_BASE_URL } from '@/lib/config';
import { Search, Filter, Calendar, Download, RefreshCw } from 'lucide-react';
import { Input } from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import Loader from '@/components/UI/Loader';

export default function DashboardPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/shipments`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch shipments");
      const data = await res.json();

      if (data?.success && Array.isArray(data.data)) {
        setShipments(data.data);
      } else {
        console.error("Unexpected API response:", data);
        setShipments([]);
      }
    } catch (err) {
      console.error("Error loading shipments:", err);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        shipment.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(shipment.id).includes(searchQuery);

      // Status filter
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;

      // Date filter
      const matchesDate = (!dateFrom && !dateTo) || (() => {
        const dispatchDate = new Date(shipment.dispatched_at);
        if (dateFrom && dateTo) {
          const from = new Date(dateFrom);
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999); // Include entire end date
          return dispatchDate >= from && dispatchDate <= to;
        }
        if (dateFrom) {
          return dispatchDate >= new Date(dateFrom);
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          return dispatchDate <= to;
        }
        return true;
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [shipments, searchQuery, statusFilter, dateFrom, dateTo]);

  const handleExportReport = async () => {
    // Fetch detailed item data for each shipment
    const shipmentsWithItems = await Promise.all(
      filteredShipments.map(async (shipment) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/shipments/${shipment.id}/dosimeters`);
          if (res.ok) {
            const data = await res.json();
            const items = data.data || data.dosimeters || [];
            return { ...shipment, itemsData: items };
          }
        } catch (error) {
          console.error(`Error fetching items for shipment ${shipment.id}:`, error);
        }
        return { ...shipment, itemsData: [] };
      })
    );

    // Comprehensive CSV with all details
    const csvHeaders = [
      'Shipment ID',
      'Destination',
      'Status',
      'Dispatch Date',
      'Address',
      'Contact Person',
      'Contact Phone',
      'Courier Service',
      'Courier Staff',
      'Items Count',
      'Item Serial Numbers',
      'Item Models',
      'Item Types',
      'Item Statuses',
      'Comments'
    ];

    const csvRows = shipmentsWithItems.map(s => {
      const itemSerials = s.itemsData?.map((i: any) => i.serial_number).join('; ') || '';
      const itemModels = s.itemsData?.map((i: any) => i.model || '').filter(Boolean).join('; ') || '';
      const itemTypes = s.itemsData?.map((i: any) => i.type || '').filter(Boolean).join('; ') || '';
      const itemStatuses = s.itemsData?.map((i: any) => i.status || '').filter(Boolean).join('; ') || '';

      return [
        s.id,
        s.destination || '',
        s.status || '',
        new Date(s.dispatched_at).toLocaleString(),
        s.address || '',
        s.contact_person || '',
        s.contact_phone || '',
        s.courier_name || '',
        s.courier_staff || '',
        s.items || s.itemsData?.length || 0,
        itemSerials,
        itemModels,
        itemTypes,
        itemStatuses,
        (s as any).comment || ''
      ];
    });

    const csv = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = dateFrom && dateTo 
      ? `${dateFrom}_to_${dateTo}`
      : dateFrom 
      ? `from_${dateFrom}`
      : dateTo
      ? `until_${dateTo}`
      : 'all';
    a.download = `shipments_report_${dateStr}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader size="lg" label="Loading shipments..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-8 space-y-6">
      {/* Dashboard Stats */}
      <DashboardStats shipments={shipments} />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by destination, contact, address, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchShipments}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Refresh
              </Button>
              {filteredShipments.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportReport}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing <strong>{filteredShipments.length}</strong> of <strong>{shipments.length}</strong> shipments
        </span>
        {(searchQuery || statusFilter !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Shipments Grid - Restored Original Cards (Compact) */}
      {filteredShipments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShipments.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shipments Found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || dateFrom || dateTo
                ? "Try adjusting your filters to find shipments."
                : "There are no shipments to display."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}