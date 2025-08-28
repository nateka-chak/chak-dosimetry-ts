"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PackagePlus, Send } from "lucide-react";
import { Input } from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";

export default function RequestsPage() {
  const [hospital, setHospital] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospital, requestedBy, quantity }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setHospital("");
        setRequestedBy("");
        setQuantity(1);
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        console.error("❌ Failed to submit request:", data.error);
      }
    } catch (err) {
      console.error("❌ Submit failed:", err);
    }
  };

  return (
    <main className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="max-w-2xl mx-auto shadow-lg rounded-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <PackagePlus className="text-blue-600" size={42} />
            </div>
            <CardTitle className="text-2xl font-bold">
              Request Dosimeters
            </CardTitle>
            <p className="text-gray-600">
              Fill the form below to request dosimeters from CHAK inventory.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 font-medium">Hospital Name</label>
                <Input
                  placeholder="Enter hospital name"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Requested By</label>
                <Input
                  placeholder="Staff name"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </div>

              <Button type="submit" className="w-full flex gap-2">
                <Send size={18} />
                Submit Request
              </Button>

              {submitted && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-600 text-center mt-3 font-medium"
                >
                  ✅ Request submitted successfully!
                </motion.p>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
