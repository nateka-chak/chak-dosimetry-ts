"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Upload,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Filter,
  Clock,
  RefreshCw,
  ShieldCheck,
  CheckSquare,
  Pencil,
  History,
  XCircle,
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  Plus,
  Users,
  Calendar,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import AddDosimeterModal from "@/components/AddDosimeterModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";
import { Input } from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import { Badge } from "@/components/UI/Badge";
import Loader from "@/components/UI/Loader";

type InventoryRecord = {
  id: number;
  serial_number: string;
  model?: string;
  type?: string;
  status?: string;
  hospital_name?: string;
  contact_phone?: string;
  calibration_date?: string | null;
  expiry_date?: string | null;
  comment?: string;
};

type InventoryStats = {
  total: number;
  assigned: number;
  available_estimate: number;
  expiring_30_days: number;
};

function StatusBadge({ status }: { status?: string }) {
  const statusConfig = {
    available: { label: "Available", variant: "success" as const, icon: ShieldCheck },
    dispatched: { label: "Dispatched", variant: "primary" as const, icon: CheckSquare },
    in_transit: { label: "In Transit", variant: "warning" as const, icon: Clock },
    received: { label: "Received", variant: "success" as const, icon: CheckCircle2 },
    expired: { label: "Expired", variant: "danger" as const, icon: AlertTriangle },
    lost: { label: "Lost", variant: "secondary" as const, icon: XCircle },
    retired: { label: "Retired", variant: "secondary" as const, icon: AlertOctagon },
    returned: { label: "Returned", variant: "primary" as const, icon: ArrowLeft },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: "Unknown",
    variant: "default" as const,
    icon: Package,
  };

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}

function daysUntil(dateStr?: string | null) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function InventoryPage() {
  const [stats, setStats] = useState<InventoryStats>({
    total: 0,
    assigned: 0,
    available_estimate: 0,
    expiring_30_days: 0,
  });
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hospitalFilter, setHospitalFilter] = useState<string>("all");

  // UI State
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<InventoryRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<InventoryRecord | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/inventory`);
      const data = await res.json();
      if (data?.stats && data?.records) {
        setStats(data.stats);
        setRecords(data.records);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Hospitals list for filter
  const hospitals = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.hospital_name && r.hospital_name.trim())
        set.add(r.hospital_name.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.model || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.hospital_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.comment || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      
      const matchesHospital =
        hospitalFilter === "all" ||
        (r.hospital_name || "").toLowerCase() === hospitalFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesHospital;
    });
  }, [records, searchQuery, statusFilter, hospitalFilter]);

  // Statistics for filtered records
  const filteredStats = useMemo(() => {
    const total = filteredRecords.length;
    const available = filteredRecords.filter(r => r.status === "available").length;
    const assigned = total - available;
    const expiringSoon = filteredRecords.filter(r => {
      const days = daysUntil(r.expiry_date);
      return typeof days === "number" && days >= 0 && days <= 30;
    }).length;

    return { total, available, assigned, expiringSoon };
  }, [filteredRecords]);

  // Action handlers
  const handleAction = async (action: string, id: number, data?: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload: { id, ...data } }),
      });

      if (res.ok) {
        fetchInventory();
      } else {
        console.error(`Failed to ${action} dosimeter`);
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
    }
  };

  const handleAssign = async (id: number) => {
    const hospital = prompt("Enter hospital name to assign:");
    if (!hospital) return;
    await handleAction("assign", id, { hospital_name: hospital });
  };

  const handleRecall = async (id: number) => {
    await handleAction("recall", id);
  };

  const handleExpire = async (id: number) => {
    await handleAction("expire", id);
  };

  const handleLost = async (id: number) => {
    await handleAction("lost", id);
  };

  const handleReturned = async (id: number) => {
    await handleAction("returned", id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this dosimeter?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchInventory();
      }
    } catch (error) {
      console.error("Error deleting dosimeter:", error);
    }
  };

  const handleShowHistory = async (record: InventoryRecord) => {
    setHistoryTarget(record);
    setShowHistory(true);
    setHistoryLoading(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/history?id=${record.id}`);
      const data = await res.json();
      setHistoryRecords(data);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Enhanced button hover styles - Add this after your state declarations
const buttonStyles = {
  primary: 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all duration-200',
  danger: 'text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200'
};

  const exportCSV = () => {
    const headers = [
      "serial_number",
      "model",
      "type",
      "status",
      "hospital_name",
      "contact_phone",
      "calibration_date",
      "expiry_date",
      "comment",
    ];
    
    const rows = filteredRecords.map((r) =>
      headers.map((h) => (r as any)[h] ?? "")
    );
    
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dosimetry_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" label="Loading inventory..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">Inventory Management</h1>
            <p className="text-gray-600 mt-2">Track and manage all dosimeters in the system</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
  <Button
    variant="outline"
    onClick={fetchInventory}
    leftIcon={<RefreshCw className="h-4 w-4" />}
    className={buttonStyles.outline}
  >
    Refresh
  </Button>
  <Button
    variant="outline"
    onClick={exportCSV}
    leftIcon={<Download className="h-4 w-4" />}
    className={buttonStyles.outline}
  >
    Export CSV
  </Button>
  <Button
    onClick={() => {
      setEditRecord(null);
      setShowModal(true);
    }}
    leftIcon={<Plus className="h-4 w-4" />}
    className={buttonStyles.primary}
  >
    Add Dosimeter
  </Button>
</div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              label: "Total Devices", 
              value: stats.total, 
              icon: Package, 
              color: "blue",
              description: "All dosimeters"
            },
            { 
              label: "Available", 
              value: stats.available_estimate, 
              icon: ShieldCheck, 
              color: "green",
              description: "Ready for assignment"
            },
            { 
              label: "Assigned", 
              value: stats.assigned, 
              icon: Users, 
              color: "purple",
              description: "Currently in use"
            },
            { 
              label: "Expiring Soon", 
              value: stats.expiring_30_days, 
              icon: Calendar, 
              color: "yellow",
              description: "Within 30 days"
            },
          ].map((stat) => (
            <Card key={stat.label} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search serial, model, type, hospital..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
  <Button
    variant={viewMode === "table" ? "primary" : "outline"}
    size="sm"
    onClick={() => setViewMode("table")}
    className={viewMode === "table" ? buttonStyles.primary : buttonStyles.outline}
  >
    Table View
  </Button>
  <Button
    variant={viewMode === "grid" ? "primary" : "outline"}
    size="sm"
    onClick={() => setViewMode("grid")}
    className={viewMode === "grid" ? buttonStyles.primary : buttonStyles.outline}
  >
    Grid View
  </Button>
</div>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                  <option value="received">Received</option>
                  <option value="expired">Expired</option>
                  <option value="lost">Lost</option>
                  <option value="retired">Retired</option>
                  <option value="returned">Returned</option>
                </select>

                <select
                  value={hospitalFilter}
                  onChange={(e) => setHospitalFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                >
                  <option value="all">All Hospitals</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital} value={hospital}>
                      {hospital}
                    </option>
                  ))}
                </select>

                <Button
  variant="outline"
  size="sm"
  onClick={() => {
    setSearchQuery("");
    setStatusFilter("all");
    setHospitalFilter("all");
  }}
  leftIcon={<Filter className="h-4 w-4" />}
  className={buttonStyles.outline}
>
  Reset Filters
</Button>
              </div>
            </div>

            {/* Filter Stats */}
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
              <span>Showing {filteredStats.total} of {records.length} dosimeters</span>
              {filteredStats.total !== records.length && (
                <>
                  <span>•</span>
                  <span>{filteredStats.available} available</span>
                  <span>•</span>
                  <span>{filteredStats.assigned} assigned</span>
                  <span>•</span>
                  <span>{filteredStats.expiringSoon} expiring soon</span>
                </>
              )}
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
                        Serial Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Model & Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Hospital
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Calibration
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Expiry
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const daysToExpiry = daysUntil(record.expiry_date);
                      const isExpiringSoon = typeof daysToExpiry === "number" && daysToExpiry >= 0 && daysToExpiry <= 30;

                      return (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{record.serial_number}</p>
                              {record.contact_phone && (
                                <p className="text-sm text-gray-500">{record.contact_phone}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{record.model || "-"}</p>
                              <p className="text-sm text-gray-500">{record.type || "-"}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={record.status} />
                          </td>
                          <td className="px-6 py-4">
                            {record.hospital_name ? (
                              <div className="flex items-center space-x-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-900">{record.hospital_name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">
                              {record.calibration_date
                                ? new Date(record.calibration_date).toLocaleDateString()
                                : "—"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`${isExpiringSoon ? "text-amber-600 font-medium" : "text-gray-900"}`}>
                              <p className="text-sm">
                                {record.expiry_date
                                  ? new Date(record.expiry_date).toLocaleDateString()
                                  : "—"}
                              </p>
                              {isExpiringSoon && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Expires in {daysToExpiry} days
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
  <div className="flex items-center space-x-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        setEditRecord(record);
        setShowModal(true);
      }}
      leftIcon={<Pencil className="h-4 w-4" />}
      className={buttonStyles.ghost}
    >
      Edit
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleShowHistory(record)}
      leftIcon={<History className="h-4 w-4" />}
      className={buttonStyles.ghost}
    >
      History
    </Button>
  </div>
</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Empty State */}
                {filteredRecords.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No dosimeters found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {searchQuery || statusFilter !== "all" || hospitalFilter !== "all"
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "No dosimeters have been added yet. Get started by adding your first dosimeter."
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRecords.map((record) => {
              const daysToExpiry = daysUntil(record.expiry_date);
              const isExpiringSoon = typeof daysToExpiry === "number" && daysToExpiry >= 0 && daysToExpiry <= 30;

              return (
                <Card key={record.id} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle size="sm" className="text-gray-900">
                        {record.serial_number}
                      </CardTitle>
                      <StatusBadge status={record.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{record.model || "No model"}</p>
                        <p className="text-sm text-gray-600">{record.type || "No type"}</p>
                      </div>
                      
                      {record.hospital_name && (
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600">{record.hospital_name}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Calibration</p>
                          <p className="text-gray-900">
                            {record.calibration_date
                              ? new Date(record.calibration_date).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expiry</p>
                          <p className={`${isExpiringSoon ? "text-amber-600 font-medium" : "text-gray-900"}`}>
                            {record.expiry_date
                              ? new Date(record.expiry_date).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {record.comment && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 line-clamp-2">{record.comment}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => {
      setEditRecord(record);
      setShowModal(true);
    }}
    className={buttonStyles.outline}
  >
    <Pencil className="h-4 w-4" />
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleShowHistory(record)}
    className={buttonStyles.outline}
  >
    <History className="h-4 w-4" />
  </Button>
</div>
                      {isExpiringSoon && (
                        <div className="flex items-center space-x-1 text-amber-600 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Expires in {daysToExpiry}d</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Empty State for Grid */}
            {filteredRecords.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No dosimeters found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || statusFilter !== "all" || hospitalFilter !== "all"
                    ? "Try adjusting your search or filters."
                    : "No dosimeters available."
                  }
                </p>
                <Button
  onClick={() => {
    setEditRecord(null);
    setShowModal(true);
  }}
  leftIcon={<Plus className="h-4 w-4" />}
  className={buttonStyles.primary}
>
  Add First Dosimeter
</Button>
              </div>
            )}
          </div>
        )}

        {/* History Modal */}
        <AnimatePresence>
          {showHistory && historyTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <History className="h-6 w-6" />
                      <div>
                        <h3 className="text-lg font-bold">History for {historyTarget.serial_number}</h3>
                        <p className="text-primary-100 text-sm">Activity timeline for this dosimeter</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-2 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader size="md" label="Loading history..." />
                    </div>
                  ) : historyRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No history records found for this dosimeter.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historyRecords.map((history) => (
                        <div key={history.id} className="border-l-2 border-primary-500 pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{history.action}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(history.created_at).toLocaleString()}
                            </span>
                          </div>
                          {history.hospital_name && (
                            <p className="text-sm text-gray-600 mt-1">
                              Hospital: {history.hospital_name}
                            </p>
                          )}
                          {history.notes && (
                            <p className="text-sm text-gray-500 mt-1">{history.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            by {history.actor || "system"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Modal */}
        <AddDosimeterModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditRecord(null);
          }}
          onSaved={fetchInventory}
          editRecord={editRecord || undefined}
        />
      </div>
    </div>
  );
}