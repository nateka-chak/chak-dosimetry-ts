"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Truck, Hospital, Bell, PackageCheck, FileCheck2 } from "lucide-react";
import Button from "../components/UI/Button";

export default function Home() {
  const features = [
    {
      icon: <Truck className="text-white" size={28} />,
      title: "Real-time Tracking",
      description:
        "Monitor the status of your dosimeters from dispatch to delivery with live updates.",
    },
    {
      icon: <Hospital className="text-white" size={28} />,
      title: "Hospital Portal",
      description:
        "Easy receipt confirmation for hospitals with automated notifications to CHAK.",
    },
    {
      icon: <Bell className="text-white" size={28} />,
      title: "Instant Notifications",
      description:
        "Get notified immediately when dosimeters are received by hospitals.",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Dispatch",
      description:
        "CHAK dispatches dosimeters with serial numbers and records them in the system.",
    },
    {
      step: "2",
      title: "In Transit",
      description:
        "Track the shipment status in real-time as it moves toward the destination.",
    },
    {
      step: "3",
      title: "Receive",
      description:
        "Hospital confirms receipt by entering serial numbers or uploading images.",
    },
    {
      step: "4",
      title: "Notification",
      description:
        "CHAK receives instant notification with all details of the received dosimeters.",
    },
  ];

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="chak-gradient text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Track dosimeters with Precision
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl mb-10 max-w-3xl mx-auto"
          >
            A comprehensive solution for managing and tracking dosimeter
            equipment from dispatch to delivery.
          </motion.p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="secondary" size="large">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/dispatch">
              <Button variant="outline" size="large">
                Dispatch Items
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="section-title">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="feature-card"
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="section-title">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="step-card"
              >
                <div className="step-circle">{step.step}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Requests & Approvals Section */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 text-center">
          <h2 className="section-title">Internal Inventory Management</h2>
          <p className="text-gray-600 mb-10">
            Manage requests and approvals for dosimeters from CHAK’s internal
            inventory store.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link href="/requests">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="feature-card cursor-pointer"
              >
                <div className="feature-icon bg-blue-600">
                  <PackageCheck className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-semibold mt-4">
                  Request Dosimeters
                </h3>
                <p className="text-gray-600">
                  Submit a request from the CHAK inventory for hospital use.
                </p>
              </motion.div>
            </Link>
            <Link href="/approvals">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="feature-card cursor-pointer"
              >
                <div className="feature-icon bg-green-600">
                  <FileCheck2 className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-semibold mt-4">
                  Approve Requests
                </h3>
                <p className="text-gray-600">
                  Review and approve staff dosimeter requests.
                </p>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
