"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PackagePlus, Send, Building2, User, Phone, MapPin, FileText, CheckCircle2, Shield, Clock } from "lucide-react";
import { Input } from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/UI/Card";
import { API_BASE_URL } from "@/lib/config";

export default function RequestsPage() {
  const [formData, setFormData] = useState({
    hospital: "",
    requestedBy: "",
    phone: "",
    town: "",
    quantity: 1,
  });
  const [document, setDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.hospital.trim() || !formData.requestedBy.trim() || 
        !formData.phone.trim() || !formData.town.trim()) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (formData.quantity < 1) {
      setError("Quantity must be at least 1");
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("hospital", formData.hospital.trim());
      submitData.append("requestedBy", formData.requestedBy.trim());
      submitData.append("phone", formData.phone.trim());
      submitData.append("location", formData.town.trim());
      submitData.append("quantity", formData.quantity.toString());

      if (document) {
        if (document.type !== "application/pdf") {
          setError("Please upload a PDF file only");
          setLoading(false);
          return;
        }
        if (document.size > 5 * 1024 * 1024) { // 5MB limit
          setError("File size must be less than 5MB");
          setLoading(false);
          return;
        }
        submitData.append("document", document);
      }

      const res = await fetch(`${API_BASE_URL}/api/requests`, {
        method: "POST",
        body: submitData,
      });

      const data = await res.json();
      
      if (data.success) {
        setSubmitted(true);
        // Reset form
        setFormData({
          hospital: "",
          requestedBy: "",
          phone: "",
          town: "",
          quantity: 1,
        });
        setDocument(null);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError(data.error || "Failed to submit request. Please try again.");
      }
    } catch (err: any) {
      setError("Network error. Please check your connection and try again.");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <img src="/chak-dosimetry-ts/cbsl.svg" alt="" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 font-heading mb-4">
            Request Dosimeters
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Submit your request for dosimeters from CHAK Business Services Limited. Our team will review and process your request promptly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2"
          >
            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-700 text-black pb-8">
                <CardTitle className="text-2xl font-bold text-black flex items-center justify-center space-x-3">
                  <span>Request Form</span>
                </CardTitle>
                <CardDescription className="text-primary-100 text-center text-lg">
                  Please provide the following details for your request
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Hospital Information */}
                  <motion.div variants={itemVariants}>
                    <Input
                      label="Hospital/Organization Name"
                      placeholder="Enter your hospital or organization name"
                      value={formData.hospital}
                      onChange={(e) => handleInputChange("hospital", e.target.value)}
                      required
                      variant="filled"
                      size="lg"
                    />
                  </motion.div>

                  {/* Contact Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants}>
                      <Input
                        label="Requested By"
                        placeholder="Your full name"
                        value={formData.requestedBy}
                        onChange={(e) => handleInputChange("requestedBy", e.target.value)}
                        required
                        variant="filled"
                        size="lg"
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Input
                        label="Phone Number"
                        placeholder="+254 712 345678"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        required
                        variant="filled"
                        size="lg"
                      />
                    </motion.div>
                  </div>

                  {/* Location & Quantity Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants}>
                      <Input
                        label="Delivery Location"
                        placeholder="Town or specific location"
                        value={formData.town}
                        onChange={(e) => handleInputChange("town", e.target.value)}
                        required
                        variant="filled"
                        size="lg"
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Input
                        label="Quantity Needed"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 1)}
                        required
                        variant="filled"
                        size="lg"
                      />
                    </motion.div>
                  </div>

                  {/* Document Upload */}
                  <motion.div variants={itemVariants}>
                    <Input
                      label="Supporting Document (Optional)"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setDocument(e.target.files ? e.target.files[0] : null)}
                      helperText="Upload any supporting documents in PDF format (max 5MB)"
                      variant="filled"
                      size="lg"
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div variants={itemVariants} className="pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full flex items-center justify-center space-x-3 py-4 text-lg font-semibold"
                      disabled={loading}
                      isLoading={loading}
                    >
                      {!loading && <Send className="h-5 w-5" />}
                      <span>{loading ? "Submitting Request..." : "Submit Request"}</span>
                    </Button>
                  </motion.div>

                  {/* Messages */}
                  <AnimatePresence>
                    {submitted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-green-50 border border-green-200 rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-green-800">Request Submitted Successfully!</h4>
                            <p className="text-green-700 text-sm mt-1">
                              Thank you for your request. Our team will review it and contact you shortly.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-red-600 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-red-800">Submission Error</h4>
                            <p className="text-red-700 text-sm mt-1">{error}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Information Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Process Info Card */}
            <Card className="shadow-lg border-0 rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Clock className="h-5 w-5 text-primary-600" />
                  <span>Request Process</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: "1", title: "Submit Request", description: "Fill and submit this form" },
                  { step: "2", title: "Review", description: "CHAK team reviews your request" },
                  { step: "3", title: "Confirmation", description: "You'll receive a confirmation call/email" },
                  { step: "4", title: "Processing", description: "Dosimeters prepared for dispatch" },
                  { step: "5", title: "Delivery", description: "Items dispatched to your location" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="shadow-lg border-0 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Shield className="h-5 w-5 text-primary-600" />
                  <span>Need Help?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    For assistance with your request or any questions:
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-primary-600" />
                      <span className="text-gray-900">+254 70 594 94 94</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-primary-600" />
                      <span className="text-gray-900">admin@cbslkenya.co.ke</span>
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-600">
                    Typical response time: 1-2 business days
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card className="shadow-lg border-0 rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Why Choose CHAK?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "✓ Reliable dosimeter supply",
                  "✓ Quick processing times",
                  "✓ Professional support team",
                  "✓ Secure handling",
                  "✓ Trusted healthcare partner",
                ].map((feature, index) => (
                  <p key={index} className="text-sm text-gray-700 flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </p>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}