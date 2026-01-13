// app/approvals/page.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Package, 
  FileText, 
  Phone, 
  MapPin, 
  User,
  Building2,
  RefreshCw,
  Filter,
  Search,
  AlertTriangle,
  Eye,
  MessageSquare,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Badge } from "@/components/UI/Badge";
import Loader from "@/components/UI/Loader";
import { API_BASE_URL } from "@/lib/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/Layout/NotificationProvider";

interface RequestItem {
  id: number;
  hospital: string;
  requested_by: string;
  phone?: string;
  location?: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  document?: string | null;
  comment?: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<number>(0);

  const [activeRejectId, setActiveRejectId] = useState<number | null>(null);
  const [rejectionComment, setRejectionComment] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const { showNotification } = useNotification();

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleLogin = () => {
    const validUsers = [
      "smutiso@chak.or.ke",
      "jodhiambo@chak.or.ke"
    ];

    if (validUsers.includes(username) && password === "4488") {
      setIsLoggedIn(true);
      setError("");
      localStorage.setItem('approvalsAuth', 'true');
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  // Check for existing authentication
  useEffect(() => {
    const auth = localStorage.getItem('approvalsAuth');
    if (auth === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/requests`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      
      const data = await res.json();
      
      // Handle both array and object response formats
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data.data && Array.isArray(data.data)) {
        setRequests(data.data);
      } else if (Array.isArray(data.requests)) {
        setRequests(data.requests);
      } else {
        console.error("Unexpected API response format:", data);
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory`);
      if (!res.ok) throw new Error("Failed to fetch inventory");
      
      const data = await res.json();
      const available =
        data?.stats?.available_estimate ??
        data?.stats?.available ??
        data?.available ??
        data?.stock ??
        0;
      setInventory(Number(available) || 0);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setInventory(0);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchRequests();
      fetchInventory();
    }
  }, [isLoggedIn, fetchRequests, fetchInventory]);

  const handleAction = async (
    id: number,
    action: "approved" | "rejected",
    quantity: number,
    comment?: string
  ) => {
    // if (action === "approved" && quantity > inventory) {
    //   alert("⚠️ Not enough dosimeters in stock! Available: " + inventory);
    //   return;
    // }
    try {
      const res = await fetch(`${API_BASE_URL}/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });

      if (!res.ok) throw new Error("Failed to process request");

      const data = await res.json();
      
      // Handle different response formats
      if (data.success || data.message) {
        if (action === "approved") {
          await fetch(`${API_BASE_URL}/api/inventory`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ change: -quantity }),
          });
          await fetchInventory();

            // Send approval notification
          const request = requests.find(r => r.id === id);
          if (request) {
            showNotification(
              `Approved request from ${request.hospital} for ${quantity} item${quantity !== 1 ? 's' : ''}`,
              'success'
            );
          }
        } else {
          // Send rejection notification
          const request = requests.find(r => r.id === id);
          if (request) {
            const rejectionReason = comment ? `: ${comment}` : '';
            showNotification(
              `Rejected request from ${request.hospital}${rejectionReason}`,
              'error'
            );
          }
        }
        await fetchRequests();
        setActiveRejectId(null);
        setRejectionComment("");
        
        // Show success message
        alert(action === "approved" ? "✅ Request approved successfully!" : "✅ Request rejected successfully!");
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to process request. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('approvalsAuth');
    setUsername("");
    setPassword("");
  };

  // Enhanced PDF viewing - opens in new page
  const handleViewPDF = (documentUrl: string, request: RequestItem) => {
    if (!documentUrl) {
      alert("No document available");
      return;
    }

    // If it's a full URL, open directly
    if (documentUrl.startsWith('http')) {
      window.open(documentUrl, '_blank');
      return;
    }

    // For relative paths, construct URL with basePath
    // Documents are in public/uploads, served as static files by Next.js
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const basePath = currentPath.includes('/chak-dosimetry-ts') ? '/chak-dosimetry-ts' : '';
      // Ensure documentUrl starts with /
      const docPath = documentUrl.startsWith('/') ? documentUrl : `/${documentUrl}`;
      const fullUrl = `${window.location.origin}${basePath}${docPath}`;
      console.log('Opening PDF:', fullUrl); // Debug log
      window.open(fullUrl, '_blank');
    }
  };

  // Filtered requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      !searchQuery ||
      request.hospital?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requested_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || 
      request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-center pb-8 pt-10">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Approvals Portal
              </CardTitle>
              <CardDescription className="text-slate-200 text-base font-medium">
                CHAK Dosimeter Management System
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Username
                  </label>
                  <Input
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    // leftIcon={<User className="h-4 w-4 text-gray-500" />}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    // leftIcon={<Lock className="h-4 w-4 text-gray-500" />}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <Button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3"
                  size="lg"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Sign In to Approvals
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">Approvals Dashboard</h1>
            <p className="text-gray-600 mt-2">Review and manage item requests from healthcare facilities</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={fetchRequests}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Inventory & Navigation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Inventory Card */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Items</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{inventory}</p>
                  <p className="text-xs text-gray-500 mt-1">Ready for allocation</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quick Navigation</p>
                  <p className="text-sm text-gray-500 mt-1">Manage inventory & contracts</p>
                </div>
              </div>
              <div className="flex flex-col space-y-3 mt-4">
                <Link href="/inventory">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900" 
                    leftIcon={<Package className="h-4 w-4" />}
                  >
                    View Full Inventory
                  </Button>
                </Link>
                <Link href="/contracts">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900" 
                    leftIcon={<FileText className="h-4 w-4" />}
                  >
                    Contract Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Request Statistics */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Request Summary</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search hospitals, requesters, locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  leftIcon={<Filter className="h-4 w-4" />}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Filter Stats */}
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
              <span>Showing {filteredRequests.length} of {requests.length} requests</span>
              {filteredRequests.length !== requests.length && (
                <>
                  <span>•</span>
                  <span>{filteredRequests.filter(r => r.status === 'pending').length} pending</span>
                  <span>•</span>
                  <span>{filteredRequests.filter(r => r.status === 'approved').length} approved</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="lg" label="Loading requests..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Request Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Document
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
                    {filteredRequests.map((request) => (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <p className="font-semibold text-gray-900">{request.hospital}</p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <User className="h-3 w-3" />
                              <span>Requested by {request.requested_by}</span>
                            </div>
                            {request.location && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span>{request.location}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {request.phone ? (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{request.phone}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No phone</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-semibold text-gray-900">{request.quantity}</span>
                        </td>
                        <td className="px-6 py-4">
                          {request.document ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPDF(request.document!, request)}
                              leftIcon={<FileText className="h-4 w-4" />}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              View PDF
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-400">No document</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={
                              request.status === 'approved' ? 'success' :
                              request.status === 'rejected' ? 'danger' : 'warning'
                            }
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAction(request.id, "approved", request.quantity)}
                                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveRejectId(request.id)}
                                  leftIcon={<XCircle className="h-4 w-4" />}
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              leftIcon={<Eye className="h-4 w-4" />}
                              className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            >
                              View
                            </Button>
                          </div>

                          {/* Rejection Comment Input */}
                          <AnimatePresence>
                            {activeRejectId === request.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                              >
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-red-700">
                                    Rejection Reason
                                  </label>
                                  <textarea
                                    value={rejectionComment}
                                    onChange={(e) => setRejectionComment(e.target.value)}
                                    placeholder="Enter reason for rejection..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none text-sm"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        handleAction(request.id, "rejected", request.quantity, rejectionComment);
                                      }}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Confirm Reject
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setActiveRejectId(null);
                                        setRejectionComment("");
                                      }}
                                      className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Rejection Comment Display */}
                          {request.status === "rejected" && request.comment && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <MessageSquare className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                                  <p className="text-sm text-red-700 mt-1">{request.comment}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty State */}
                {filteredRequests.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {searchQuery || statusFilter !== 'all'
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "No dosimeter requests have been submitted yet."
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Detail Modal */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedRequest(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-6 w-6" />
                      <div>
                        <h3 className="text-lg font-bold">Request Details</h3>
                        <p className="text-blue-100 text-sm">Complete request information</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="p-2 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Hospital/Organization</p>
                          <p className="font-medium text-gray-900">{selectedRequest.hospital}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Requested By</p>
                          <p className="font-medium text-gray-900">{selectedRequest.requested_by}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Dosimeters Requested</p>
                          <p className="font-medium text-gray-900">{selectedRequest.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <div className="mt-1">
                            <Badge 
                              variant={
                                selectedRequest.status === 'approved' ? 'success' :
                                selectedRequest.status === 'rejected' ? 'danger' : 'warning'
                              }
                            >
                              {selectedRequest.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedRequest.phone && (
                          <div>
                            <p className="text-sm text-gray-600">Phone Number</p>
                            <p className="font-medium text-gray-900">{selectedRequest.phone}</p>
                          </div>
                        )}
                        {selectedRequest.location && (
                          <div>
                            <p className="text-sm text-gray-600">Location</p>
                            <p className="font-medium text-gray-900">{selectedRequest.location}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document */}
                    {selectedRequest.document && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Supporting Document</h4>
                        <Button
                          onClick={() => handleViewPDF(selectedRequest.document!, selectedRequest)}
                          leftIcon={<FileText className="h-5 w-5" />}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View PDF Document
                        </Button>
                      </div>
                    )}

                    {/* Rejection Comment */}
                    {selectedRequest.status === "rejected" && selectedRequest.comment && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Rejection Details</h4>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <MessageSquare className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-red-800">Reason for Rejection</p>
                              <p className="text-red-700 mt-1">{selectedRequest.comment}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRequest(null)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}