"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";
import Button from "@/components/UI/Button";

interface RequestItem {
  id: number;
  hospital: string;
  requested_by: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔄 Fetch helper (can be reused)
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/requests");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchRequests(); // ✅ refresh from backend instead of patching locally
      }
    } catch (err) {
      console.error("❌ Update failed:", err);
    }
  };

  return (
    <main className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="shadow-lg rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Approve Dosimeter Requests
            </CardTitle>
            <p className="text-gray-600">
              Review pending requests and take action.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {loading ? (
                <p className="text-center py-6 text-gray-500">Loading...</p>
              ) : (
                <table className="min-w-full text-left border rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3">Hospital</th>
                      <th className="px-4 py-3">Requested By</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <motion.tr
                        key={req.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: req.id * 0.05 }}
                        className="border-b"
                      >
                        <td className="px-4 py-3">{req.hospital}</td>
                        <td className="px-4 py-3">{req.requested_by}</td>
                        <td className="px-4 py-3">{req.quantity}</td>
                        <td className="px-4 py-3 font-medium">
                          {req.status === "pending" && (
                            <span className="text-yellow-600">Pending</span>
                          )}
                          {req.status === "approved" && (
                            <span className="text-green-600">Approved</span>
                          )}
                          {req.status === "rejected" && (
                            <span className="text-red-600">Rejected</span>
                          )}
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          {req.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                className="flex gap-1 text-green-600"
                                onClick={() => handleAction(req.id, "approved")}
                              >
                                <CheckCircle2 size={18} /> Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="flex gap-1 text-red-600"
                                onClick={() => handleAction(req.id, "rejected")}
                              >
                                <XCircle size={18} /> Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
