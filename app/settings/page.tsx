"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Package, Bell, Shield } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import Button from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/UI/Card";

type CategoryConfig = {
  key: string;
  label: string;
  enabled: boolean;
};

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { key: "dosimeter", label: "Dosimeters", enabled: true },
  { key: "spectacles", label: "Lead Spectacles", enabled: true },
  { key: "machine", label: "Hospital Machines", enabled: true },
  { key: "accessory", label: "Accessories & Holders", enabled: true },
];

export default function SettingsPage() {
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [saving, setSaving] = useState(false);

  const handleToggleCategory = (key: string) => {
    setCategories(prev =>
      prev.map(c => (c.key === key ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Placeholder: in future we will persist to DB via /api/settings
      await new Promise(res => setTimeout(res, 400));
      alert("Settings saved (demo only, not yet persisted).");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600">
              Configure inventory categories, notifications, and admin preferences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Inventory Categories</span>
              </CardTitle>
              <CardDescription>
                Choose which item categories are managed in the tracker.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map(cat => (
                <div
                  key={cat.key}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{cat.label}</p>
                    <p className="text-xs text-gray-500">
                      Key: <span className="font-mono">{cat.key}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleCategory(cat.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      cat.enabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        cat.enabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                High-level overview of how notifications behave.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <p>
                Notifications are created automatically from key events like
                dispatch, receive, and contract updates.
              </p>
              <p>
                You already have a full notifications center under{" "}
                <code className="px-1 rounded bg-gray-100 text-xs">
                  /notifications
                </code>
                .
              </p>
              <p className="text-xs text-gray-500">
                In a later step we can add toggles for per-category and per-event
                notifications here.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-6"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}


