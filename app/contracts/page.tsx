// app/contracts/page.tsx
'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  BarChart2,
  DownloadCloud,
  Search,
  Plus,
  Building2,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  MoreHorizontal,
  Settings,
  X,
  Palette,
  LayoutGrid,
  Table,
  Zap,
  Shield,
  Bell,
  Mail,
  Phone,
  MapPin,
  Save,
  Trash2,
  Upload,
  Paperclip,
  File,
  Image,
} from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import Loader from '@/components/UI/Loader';

type Contract = {
  id?: number;
  facility_name: string;
  dosimeters: number;
  start_date?: string | null;
  end_date?: string | null;
  status?: 'active' | 'expired' | 'terminated' | 'pending' | string;
  notes?: string | null;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at?: string;
  updated_at?: string;
  facility_type?: string;
  priority?: 'low' | 'medium' | 'high';
  contract_value?: number;
  renewal_reminder?: boolean;
  scanned_document?: string | null;
};

type Summary = {
  total_dosimeters?: number;
  active_dosimeters?: number;
  remaining_dosimeters?: number;
  expired_uncollected?: number;
  replaced_dosimeters?: number;
  active_contracts?: number;
  expiring_soon?: number;
  total_contract_value?: number;
};

type UserPreferences = {
  viewMode: 'cards' | 'table' | 'compact';
  colorScheme: 'blue' | 'green' | 'purple' | 'orange';
  showExpiringAlerts: boolean;
  autoRefresh: boolean;
  defaultSort: 'name' | 'date' | 'status' | 'value';
  columns: string[];
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState<number | null>(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // UI State
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    viewMode: 'cards',
    colorScheme: 'blue',
    showExpiringAlerts: true,
    autoRefresh: false,
    defaultSort: 'name',
    columns: ['facility', 'contact', 'dosimeters', 'status', 'period', 'priority', 'value']
  });

  const fileInputRefs = useRef<{[key: number]: HTMLInputElement | null}>({});

  // Add these with your other state declarations
  const [showUploadModal, setShowUploadModal] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState<number | null>(null);

  // Enhanced color schemes with better hover effects
  const getSchemeClasses = () => {
    const schemes = {
      blue: { 
        button: 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200',
        gradient: 'from-blue-600 to-blue-700',
        bg: 'bg-blue-500',
        primary: 'blue',
        outline: 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md'
      },
      green: { 
        button: 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200',
        gradient: 'from-emerald-600 to-emerald-700',
        bg: 'bg-emerald-500',
        primary: 'emerald',
        outline: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-md'
      },
      purple: { 
        button: 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200',
        gradient: 'from-purple-600 to-purple-700',
        bg: 'bg-purple-500',
        primary: 'purple',
        outline: 'border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 hover:shadow-md'
      },
      orange: { 
        button: 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200',
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-500',
        primary: 'orange',
        outline: 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 hover:shadow-md'
      }
    };
    return schemes[userPreferences.colorScheme];
  };

  const currentScheme = getSchemeClasses();

  // Enhanced button hover styles
  const buttonStyles = {
    primary: currentScheme.button,
    outline: `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200`,
    ghost: `text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all duration-200`,
    danger: `text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200`
  };

  // Fetch contracts data
  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contracts`);
      if (!res.ok) throw new Error(`Failed to fetch contracts (${res.status})`);
      const data = await res.json();

      setContracts(Array.isArray(data.contracts) ? data.contracts : []);
      setSummary(data.summary || null);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err?.message ?? 'Failed to load contracts data');
    } finally {
      setLoading(false);
    }
  };

  // Save contract to database
  const saveContract = async (contract: Contract, isNew: boolean = false) => {
    setActionLoading(true);
    setError(null);
    
    try {
      const url = isNew 
        ? `${API_BASE_URL}/api/contracts`
        : `${API_BASE_URL}/api/contracts/${contract.id}`;
      
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contract),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${isNew ? 'create' : 'update'} contract`);
      }

      const savedContract = await res.json();
      
      // Update local state
      if (isNew) {
        setContracts(prev => [savedContract, ...prev]);
      } else {
        setContracts(prev => prev.map(c => 
          c.id === contract.id ? savedContract : c
        ));
      }

      // Close modals
      setEditingContract(null);
      setShowCreateModal(false);
      if (selectedContract?.id === contract.id) {
        setSelectedContract(savedContract);
      }

      // Refresh data to get updated summary
      fetchContracts();

    } catch (err: any) {
      console.error('Error saving contract:', err);
      setError(err?.message ?? `Failed to ${isNew ? 'create' : 'update'} contract`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete contract
  const deleteContract = async (contractId: number) => {
    if (!confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/contracts/${contractId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete contract');
      }

      // Update local state
      setContracts(prev => prev.filter(c => c.id !== contractId));
      
      // Close modals if open
      if (selectedContract?.id === contractId) {
        setSelectedContract(null);
      }
      if (editingContract?.id === contractId) {
        setEditingContract(null);
      }

      // Refresh data to get updated summary
      fetchContracts();

    } catch (err: any) {
      console.error('Error deleting contract:', err);
      setError(err?.message ?? 'Failed to delete contract');
    } finally {
      setActionLoading(false);
    }
  };

  // Upload scanned contract document - FIXED VERSION
  const uploadScannedContract = async (contractId: number, file: File) => {
    setUploadLoading(contractId);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file for contract:', contractId, 'File:', file.name);

      const res = await fetch(`${API_BASE_URL}/api/contracts/${contractId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to upload document (${res.status})`);
      }

      const updatedContract = await res.json();
      
      // Update local state
      setContracts(prev => prev.map(c => 
        c.id === contractId ? updatedContract : c
      ));

      if (selectedContract?.id === contractId) {
        setSelectedContract(updatedContract);
      }

      console.log('Upload successful:', updatedContract);

    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err?.message ?? 'Failed to upload document');
    } finally {
      setUploadLoading(null);
    }
  };

  // View scanned contract document - REPLACED DOWNLOAD FUNCTION
  const viewScannedContract = async (contract: Contract) => {
    if (!contract.scanned_document) {
      setError('No scanned document available for this contract');
      return;
    }

    try {
      // If it's a full URL, open directly
      if (contract.scanned_document.startsWith('http')) {
        window.open(contract.scanned_document, '_blank');
        return;
      }

      // For file paths, construct the full URL
      const documentUrl = `${API_BASE_URL}${contract.scanned_document}`;
      window.open(documentUrl, '_blank');

    } catch (err: any) {
      console.error('Error viewing document:', err);
      setError(err?.message ?? 'Failed to view document');
    }
  };

  // Handle file upload - FIXED VERSION
  const handleFileUpload = (contractId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, 'for contract:', contractId);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload JPEG, PNG, or PDF files only');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    uploadScannedContract(contractId, file);
    
    // Reset file input
    const fileInput = fileInputRefs.current[contractId];
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Set file input ref
  const setFileInputRef = (contractId: number, el: HTMLInputElement | null) => {
    fileInputRefs.current[contractId] = el;
  };

  useEffect(() => {
    fetchContracts();
    
    // Load user preferences from localStorage
    const savedPrefs = localStorage.getItem('contracts-preferences');
    if (savedPrefs) {
      try {
        setUserPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('contracts-preferences', JSON.stringify(userPreferences));
  }, [userPreferences]);

  // Filtered and sorted contracts
  const filteredContracts = useMemo(() => {
    let filtered = contracts.filter((contract) => {
      const matchesSearch = 
        !searchQuery ||
        contract.facility_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.facility_type?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' || 
        contract.status === statusFilter;

      const matchesPriority = 
        priorityFilter === 'all' || 
        contract.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (userPreferences.defaultSort) {
        case 'date':
          return new Date(b.start_date || '').getTime() - new Date(a.start_date || '').getTime();
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'value':
          return (b.contract_value || 0) - (a.contract_value || 0);
        case 'name':
        default:
          return (a.facility_name || '').localeCompare(b.facility_name || '');
      }
    });

    return filtered;
  }, [contracts, searchQuery, statusFilter, priorityFilter, userPreferences.defaultSort]);

  // Statistics for display
  const displayStats = useMemo(() => {
    if (summary) return summary;

    // Fallback calculation if no summary provided
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const totalDosimeters = contracts.reduce((sum, c) => sum + (c.dosimeters || 0), 0);
    const activeDosimeters = contracts
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + (c.dosimeters || 0), 0);
    const totalContractValue = contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0);

    return {
      total_dosimeters: totalDosimeters,
      active_dosimeters: activeDosimeters,
      active_contracts: activeContracts,
      total_contract_value: totalContractValue,
      expiring_soon: contracts.filter(c => {
        if (!c.end_date) return false;
        const endDate = new Date(c.end_date);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
      }).length,
    };
  }, [summary, contracts]);

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'success' as const, icon: CheckCircle2 },
      expired: { label: 'Expired', variant: 'danger' as const, icon: AlertTriangle },
      terminated: { label: 'Terminated', variant: 'secondary' as const, icon: AlertTriangle },
      pending: { label: 'Pending', variant: 'warning' as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: 'Unknown',
      variant: 'default' as const,
      icon: Clock,
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    const priorityConfig = {
      high: { 
        label: 'High', 
        className: 'text-red-600 bg-red-100 border-red-200 hover:bg-red-200 transition-colors duration-200' 
      },
      medium: { 
        label: 'Medium', 
        className: 'text-yellow-600 bg-yellow-100 border-yellow-200 hover:bg-yellow-200 transition-colors duration-200' 
      },
      low: { 
        label: 'Low', 
        className: 'text-green-600 bg-green-100 border-green-200 hover:bg-green-200 transition-colors duration-200' 
      },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      label: 'Not Set',
      className: 'text-gray-600 bg-gray-100 border-gray-200 hover:bg-gray-200 transition-colors duration-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // File Upload Modal Component
  const FileUploadModal = ({ contractId, onClose }: { contractId: number, onClose: () => void }) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFileSelection(files[0]);
      }
    };

    const handleFileSelection = (file: File) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload JPEG, PNG, or PDF files only');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelection(file);
      }
    };

    const handleUpload = async () => {
      if (!selectedFile) return;
      
      await uploadScannedContract(contractId, selectedFile);
      onClose();
      setSelectedFile(null);
    };

    const contract = contracts.find(c => c.id === contractId);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`bg-gradient-to-r ${currentScheme.gradient} px-6 py-4 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Upload className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-bold">Upload Contract Document</h3>
                  <p className="text-blue-100 text-sm">
                    {contract?.facility_name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : selectedFile 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  selectedFile ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {selectedFile ? (
                    <FileText className="h-8 w-8 text-green-600" />
                  ) : (
                    <Upload className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    {selectedFile ? 'File Selected' : 'Upload Document'}
                  </h4>
                  <p className="text-slate-600 text-sm">
                    {selectedFile 
                      ? selectedFile.name
                      : 'Drag & drop your file here or click to browse'
                    }
                  </p>
                  {!selectedFile && (
                    <p className="text-slate-500 text-xs mt-2">
                      Supports: JPEG, PNG, PDF (Max 10MB)
                    </p>
                  )}
                </div>
                
                {selectedFile && (
                  <div className="text-sm text-slate-600">
                    <p>Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <p>Type: {selectedFile.type.split('/')[1].toUpperCase()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Info & Actions */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Supported formats:</span>
                <span className="font-medium">JPG, PNG, PDF</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Maximum file size:</span>
                <span className="font-medium">10 MB</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={onClose}
                className={buttonStyles.outline}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadLoading === contractId}
                className={buttonStyles.primary}
                leftIcon={uploadLoading === contractId ? <Loader size="sm" /> : <Upload className="h-4 w-4" />}
              >
                {uploadLoading === contractId ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const isExpiringSoon = (endDate?: string | null) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const exportContracts = () => {
    const headers = [
      'Facility Name',
      'Facility Type',
      'Dosimeters',
      'Status',
      'Priority',
      'Contract Value',
      'Start Date',
      'End Date',
      'Contact Person',
      'Contact Phone',
      'Contact Email',
      'Notes'
    ];
    
    const rows = contracts.map(contract => [
      contract.facility_name,
      contract.facility_type || '',
      String(contract.dosimeters),
      contract.status || '',
      contract.priority || '',
      contract.contract_value ? formatCurrency(contract.contract_value) : '',
      formatDate(contract.start_date),
      formatDate(contract.end_date),
      contract.contact_person || '',
      contract.contact_phone || '',
      contract.contact_email || '',
      contract.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chak_contracts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    if (editingContract) {
      setEditingContract(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  // Initialize new contract form
  const initializeNewContract = () => {
    setEditingContract({
      facility_name: '',
      dosimeters: 0,
      status: 'pending',
      facility_type: '',
      priority: 'medium',
      contract_value: 0,
      renewal_reminder: false,
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader size="lg" label="Loading contracts..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-heading">Contract Management</h1>
            <p className="text-slate-600 mt-2">Manage and track all dosimeter contracts with healthcare facilities</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={fetchContracts}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className={buttonStyles.outline}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportContracts}
              leftIcon={<DownloadCloud className="h-4 w-4" />}
              className={buttonStyles.outline}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              leftIcon={<Settings className="h-4 w-4" />}
              className={buttonStyles.outline}
            >
              Customize
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              className={buttonStyles.primary}
              onClick={initializeNewContract}
            >
              New Contract
            </Button>
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-800">Error</h4>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors duration-200"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Contracts',
              value: contracts.length,
              icon: FileText,
              color: 'blue',
              description: 'All agreements',
              trend: '+12%'
            },
            {
              label: 'Active Dosimeters',
              value: displayStats.active_dosimeters || 0,
              icon: CheckCircle2,
              color: 'emerald',
              description: 'Currently deployed',
              trend: '+5%'
            },
            {
              label: 'Contract Value',
              value: formatCurrency(displayStats.total_contract_value || 0),
              icon: BarChart2,
              color: 'purple',
              description: 'Total portfolio value',
              trend: '+8%'
            },
            {
              label: 'Expiring Soon',
              value: displayStats.expiring_soon || 0,
              icon: AlertTriangle,
              color: 'amber',
              description: 'Within 30 days',
              trend: 'Attention'
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-sm group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-1 group-hover:text-slate-800 transition-colors">
                        {stat.value}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
                          {stat.description}
                        </p>
                        <span className={`text-xs font-medium ${
                          stat.trend === 'Attention' ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${
                      stat.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                      stat.color === 'emerald' ? 'bg-emerald-100 group-hover:bg-emerald-200' :
                      stat.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' :
                      'bg-amber-100 group-hover:bg-amber-200'
                    }`}>
                      <stat.icon className={`h-6 w-6 ${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'emerald' ? 'text-emerald-600' :
                        stat.color === 'purple' ? 'text-purple-600' :
                        'text-amber-600'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions Bar */}
        <Card className="mb-6 border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium text-slate-700">Quick Actions:</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                leftIcon={<Mail className="h-4 w-4" />}
                className={buttonStyles.outline}
              >
                Send Renewals
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                leftIcon={<Bell className="h-4 w-4" />}
                className={buttonStyles.outline}
              >
                Set Reminders
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                leftIcon={<BarChart2 className="h-4 w-4" />}
                className={buttonStyles.outline}
              >
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Controls */}
        <Card className="mb-6 border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-80">
                  <Input
                    leftIcon={<Search className="h-4 w-4" />}
                    placeholder="Search facilities, contacts, notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={userPreferences.viewMode === 'cards' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setUserPreferences(prev => ({...prev, viewMode: 'cards'}))}
                    leftIcon={<LayoutGrid className="h-4 w-4" />}
                    className={userPreferences.viewMode === 'cards' ? buttonStyles.primary : buttonStyles.outline}
                  >
                    Cards
                  </Button>
                  <Button
                    variant={userPreferences.viewMode === 'table' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setUserPreferences(prev => ({...prev, viewMode: 'table'}))}
                    leftIcon={<Table className="h-4 w-4" />}
                    className={userPreferences.viewMode === 'table' ? buttonStyles.primary : buttonStyles.outline}
                  >
                    Table
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white hover:border-slate-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white hover:border-slate-400"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setDateFilter('all');
                  }}
                  leftIcon={<Filter className="h-4 w-4" />}
                  className={buttonStyles.outline}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Filter Stats */}
            <div className="mt-4 flex items-center space-x-4 text-sm text-slate-600">
              <span>Showing {filteredContracts.length} of {contracts.length} contracts</span>
              {filteredContracts.length !== contracts.length && (
                <>
                  <span>•</span>
                  <span>{filteredContracts.filter(c => c.status === 'active').length} active</span>
                  <span>•</span>
                  <span>{filteredContracts.filter(c => c.priority === 'high').length} high priority</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contracts Content */}
        {userPreferences.viewMode === 'cards' ? (
          /* Enhanced Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredContracts.map((contract) => (
              <motion.div
                key={contract.id || contract.facility_name}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-2xl transition-all duration-300 border-0 shadow-sm group border border-slate-100 hover:border-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle size="sm" className="text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                          {contract.facility_name}
                        </CardTitle>
                        {contract.facility_type && (
                          <p className="text-sm text-slate-500 mt-1 group-hover:text-slate-600 transition-colors">
                            {contract.facility_type}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(contract.status)}
                        {getPriorityBadge(contract.priority)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 group-hover:text-slate-700 transition-colors">Dosimeters</span>
                        <span className="text-lg font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">{contract.dosimeters}</span>
                      </div>

                      {contract.contract_value && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 group-hover:text-slate-700 transition-colors">Contract Value</span>
                          <span className="text-lg font-semibold text-green-600 group-hover:text-green-700 transition-colors">{formatCurrency(contract.contract_value)}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 group-hover:text-slate-600 transition-colors">Start Date</p>
                          <p className="text-slate-900 font-medium group-hover:text-slate-800 transition-colors">{formatDate(contract.start_date)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 group-hover:text-slate-600 transition-colors">End Date</p>
                          <div className={`${isExpiringSoon(contract.end_date) ? 'text-amber-600 font-medium group-hover:text-amber-700' : 'text-slate-900 group-hover:text-slate-800'} transition-colors`}>
                            <p className="font-medium">{formatDate(contract.end_date)}</p>
                            {isExpiringSoon(contract.end_date) && (
                              <p className="text-xs text-amber-600 group-hover:text-amber-700 mt-1 transition-colors">Expiring soon</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {contract.contact_person && (
                        <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors duration-200">
                          <Users className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{contract.contact_person}</p>
                            {contract.contact_phone && (
                              <p className="text-sm text-slate-600">{contract.contact_phone}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scanned Document Section - UPDATED WITH VIEW FUNCTION */}
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-800 transition-colors">Scanned Contract</span>
                        {contract.scanned_document ? (
                          <Badge variant="success" className="text-xs">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Not Uploaded
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        {contract.scanned_document ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewScannedContract(contract)}
                            leftIcon={<Eye className="h-3 w-3" />}
                            className={`text-xs ${buttonStyles.outline}`}
                          >
                            View
                          </Button>
                        ) : null}
                        
                        <input
                          ref={(el) => setFileInputRef(contract.id!, el)}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => contract.id && handleFileUpload(contract.id, e)}
                          className="hidden"
                          id={`file-upload-${contract.id}`}
                        />
                        <label htmlFor={`file-upload-${contract.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={uploadLoading === contract.id}
                            onClick={() => contract.id && setShowUploadModal(contract.id)}
                            leftIcon={uploadLoading === contract.id ? <Loader size="sm" /> : <Upload className="h-3 w-3" />}
                            className={`text-xs ${buttonStyles.ghost}`}
                          >
                            {uploadLoading === contract.id ? 'Uploading...' : 'Upload'}
                          </Button>
                        </label>
                      </div>
                    </div>

                    {contract.notes && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 group-hover:bg-blue-100 transition-colors duration-200">
                        <p className="text-sm text-blue-700 line-clamp-2">{contract.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedContract(contract)}
                          className={buttonStyles.ghost}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingContract(contract)}
                          className={buttonStyles.ghost}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        {contract.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteContract(contract.id!)}
                            className={buttonStyles.danger}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {contract.renewal_reminder && (
                          <Bell className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
                        Updated {contract.updated_at ? formatDate(contract.updated_at) : 'Recently'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Empty State */}
            {filteredContracts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No contracts found</h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "No contracts have been created yet. Get started by creating your first contract."
                  }
                </p>
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  className={buttonStyles.primary}
                  onClick={initializeNewContract}
                >
                  Create First Contract
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Enhanced Table View */
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {userPreferences.columns.includes('facility') && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Facility
                        </th>
                      )}
                      {userPreferences.columns.includes('contact') && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Contact
                        </th>
                      )}
                      {userPreferences.columns.includes('dosimeters') && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Dosimeters
                        </th>
                      )}
                      {userPreferences.columns.includes('status') && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Status
                        </th>
                      )}
                      {userPreferences.columns.includes('priority') && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Priority
                        </th>
                      )}
                      {userPreferences.columns.includes('value') && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Value
                        </th>
                      )}
                      {userPreferences.columns.includes('period') && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Period
                        </th>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredContracts.map((contract) => (
                      <tr key={contract.id || contract.facility_name} className="hover:bg-slate-50 transition-colors duration-150 group">
                        {userPreferences.columns.includes('facility') && (
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
                                {contract.facility_name}
                              </p>
                              {contract.facility_type && (
                                <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
                                  {contract.facility_type}
                                </p>
                              )}
                            </div>
                          </td>
                        )}
                        {userPreferences.columns.includes('contact') && (
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{contract.contact_person || '-'}</p>
                              <p className="text-sm text-slate-500">{contract.contact_phone || '-'}</p>
                            </div>
                          </td>
                        )}
                        {userPreferences.columns.includes('dosimeters') && (
                          <td className="px-6 py-4">
                            <span className="text-lg font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
                              {contract.dosimeters}
                            </span>
                          </td>
                        )}
                        {userPreferences.columns.includes('status') && (
                          <td className="px-6 py-4">
                            {getStatusBadge(contract.status)}
                          </td>
                        )}
                        {userPreferences.columns.includes('priority') && (
                          <td className="px-6 py-4">
                            {getPriorityBadge(contract.priority)}
                          </td>
                        )}
                        {userPreferences.columns.includes('value') && (
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-green-600 group-hover:text-green-700 transition-colors">
                              {formatCurrency(contract.contract_value)}
                            </span>
                          </td>
                        )}
                        {userPreferences.columns.includes('period') && (
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-900">
                              <p>{formatDate(contract.start_date)}</p>
                              <p className="text-slate-500">to {formatDate(contract.end_date)}</p>
                              {isExpiringSoon(contract.end_date) && (
                                <p className="text-xs text-amber-600 mt-1">Expiring soon</p>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {contract.scanned_document ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewScannedContract(contract)}
                                leftIcon={<Eye className="h-3 w-3" />}
                                className={`text-xs ${buttonStyles.ghost}`}
                              >
                                View
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-500">No document</span>
                            )}
                            
                            <input
                              ref={(el) => setFileInputRef(contract.id!, el)}
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => contract.id && handleFileUpload(contract.id, e)}
                              className="hidden"
                              id={`table-file-upload-${contract.id}`}
                            />
                            <label htmlFor={`table-file-upload-${contract.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={uploadLoading === contract.id}
                                leftIcon={uploadLoading === contract.id ? <Loader size="sm" /> : <Upload className="h-3 w-3" />}
                                className={`text-xs ${buttonStyles.ghost}`}
                              >
                                {uploadLoading === contract.id ? 'Uploading' : 'Upload'}
                              </Button>
                            </label>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedContract(contract)}
                              leftIcon={<Eye className="h-4 w-4" />}
                              className={buttonStyles.ghost}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingContract(contract)}
                              leftIcon={<Edit3 className="h-4 w-4" />}
                              className={buttonStyles.ghost}
                            >
                              Edit
                            </Button>
                            {contract.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteContract(contract.id!)}
                                className={buttonStyles.danger}
                                leftIcon={<Trash2 className="h-4 w-4" />}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty State */}
                {filteredContracts.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No contracts found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      {searchQuery || statusFilter !== 'all'
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "No contracts have been created yet."
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Contract Modal */}
        <AnimatePresence>
          {(editingContract || showCreateModal) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setEditingContract(null);
                setShowCreateModal(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`bg-gradient-to-r ${currentScheme.gradient} px-6 py-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Edit3 className="h-6 w-6" />
                      <div>
                        <h3 className="text-lg font-bold">
                          {editingContract?.id ? 'Edit Contract' : 'Create New Contract'}
                        </h3>
                        <p className="text-blue-100 text-sm">
                          {editingContract?.id ? 'Update contract details' : 'Add a new contract to the system'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingContract(null);
                        setShowCreateModal(false);
                      }}
                      className="p-2 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900">Basic Information</h4>
                      
                      <Input
                        label="Facility Name *"
                        value={editingContract?.facility_name || ''}
                        onChange={(e) => handleInputChange('facility_name', e.target.value)}
                        placeholder="Enter facility name"
                      />

                      <Input
                        label="Facility Type"
                        value={editingContract?.facility_type || ''}
                        onChange={(e) => handleInputChange('facility_type', e.target.value)}
                        placeholder="e.g., Hospital, Clinic, Laboratory"
                      />

                      <Input
                        label="Dosimeters *"
                        type="number"
                        value={editingContract?.dosimeters || 0}
                        onChange={(e) => handleInputChange('dosimeters', parseInt(e.target.value) || 0)}
                        placeholder="Number of dosimeters"
                      />

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                        <select
                          value={editingContract?.status || 'pending'}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white hover:border-slate-400"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="terminated">Terminated</option>
                        </select>
                      </div>
                    </div>

                    {/* Contract Details */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900">Contract Details</h4>

                      <Input
                        label="Contract Value"
                        type="number"
                        value={editingContract?.contract_value || 0}
                        onChange={(e) => handleInputChange('contract_value', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                        <select
                          value={editingContract?.priority || 'medium'}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white hover:border-slate-400"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <Input
                        label="Start Date"
                        type="date"
                        value={editingContract?.start_date || ''}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                      />

                      <Input
                        label="End Date"
                        type="date"
                        value={editingContract?.end_date || ''}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                      />
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900">Contact Information</h4>

                      <Input
                        label="Contact Person"
                        value={editingContract?.contact_person || ''}
                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                        placeholder="Full name"
                      />

                      <Input
                        label="Contact Phone"
                        value={editingContract?.contact_phone || ''}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                        placeholder="Phone number"
                      />

                      <Input
                        label="Contact Email"
                        type="email"
                        value={editingContract?.contact_email || ''}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                        placeholder="Email address"
                      />
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900">Additional Information</h4>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                        <textarea
                          value={editingContract?.notes || ''}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Additional notes or comments..."
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none hover:border-slate-400"
                        />
                      </div>

                      <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingContract?.renewal_reminder || false}
                          onChange={(e) => handleInputChange('renewal_reminder', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Send renewal reminders</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between">
                  <div>
                    {editingContract?.id && (
                      <Button
                        variant="outline"
                        onClick={() => deleteContract(editingContract.id!)}
                        className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 hover:shadow-md transition-all duration-200"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                      >
                        Delete Contract
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingContract(null);
                        setShowCreateModal(false);
                      }}
                      className={buttonStyles.outline}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => editingContract && saveContract(editingContract, !editingContract.id)}
                      disabled={actionLoading || !editingContract?.facility_name}
                      className={buttonStyles.primary}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      {actionLoading ? 'Saving...' : (editingContract?.id ? 'Update Contract' : 'Create Contract')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customization Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`bg-gradient-to-r ${currentScheme.gradient} px-6 py-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Settings className="h-6 w-6" />
                      <div>
                        <h3 className="text-lg font-bold">Customize View</h3>
                        <p className="text-blue-100 text-sm">Personalize your contracts dashboard</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Color Scheme */}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Color Scheme</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { key: 'blue', name: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500', ring: 'ring-blue-200' },
                          { key: 'green', name: 'Green', bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-200' },
                          { key: 'purple', name: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500', ring: 'ring-purple-200' },
                          { key: 'orange', name: 'Orange', bg: 'bg-orange-500', border: 'border-orange-500', ring: 'ring-orange-200' },
                        ].map((scheme) => (
                          <button
                            key={scheme.key}
                            onClick={() => setUserPreferences(prev => ({...prev, colorScheme: scheme.key as any}))}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                              userPreferences.colorScheme === scheme.key 
                                ? `${scheme.border} ring-2 ${scheme.ring}` 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-full h-8 ${scheme.bg} rounded-lg mb-2`}></div>
                            <p className="text-sm font-medium text-slate-900 capitalize">{scheme.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* View Preferences */}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">View Preferences</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Default View</label>
                          <select
                            value={userPreferences.viewMode}
                            onChange={(e) => setUserPreferences(prev => ({...prev, viewMode: e.target.value as any}))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white hover:border-slate-400"
                          >
                            <option value="cards">Card View</option>
                            <option value="table">Table View</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Default Sort</label>
                          <select
                            value={userPreferences.defaultSort}
                            onChange={(e) => setUserPreferences(prev => ({...prev, defaultSort: e.target.value as any}))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white hover:border-slate-400"
                          >
                            <option value="name">Facility Name</option>
                            <option value="date">Start Date</option>
                            <option value="status">Contract Status</option>
                            <option value="value">Contract Value</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Table Columns */}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Table Columns</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { key: 'facility', label: 'Facility' },
                          { key: 'contact', label: 'Contact' },
                          { key: 'dosimeters', label: 'Dosimeters' },
                          { key: 'status', label: 'Status' },
                          { key: 'priority', label: 'Priority' },
                          { key: 'value', label: 'Value' },
                          { key: 'period', label: 'Period' },
                        ].map((column) => (
                          <label key={column.key} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={userPreferences.columns.includes(column.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUserPreferences(prev => ({
                                    ...prev,
                                    columns: [...prev.columns, column.key]
                                  }));
                                } else {
                                  setUserPreferences(prev => ({
                                    ...prev,
                                    columns: prev.columns.filter(col => col !== column.key)
                                  }));
                                }
                              }}
                              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{column.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Additional Settings */}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Additional Settings</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userPreferences.showExpiringAlerts}
                            onChange={(e) => setUserPreferences(prev => ({...prev, showExpiringAlerts: e.target.checked}))}
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">Show expiring contract alerts</span>
                        </label>
                        <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userPreferences.autoRefresh}
                            onChange={(e) => setUserPreferences(prev => ({...prev, autoRefresh: e.target.checked}))}
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">Auto-refresh data every 5 minutes</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                    className={buttonStyles.outline}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setShowSettings(false)}
                    className={buttonStyles.primary}
                  >
                    Save Preferences
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contract Detail Modal */}
        <AnimatePresence>
          {selectedContract && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedContract(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`bg-gradient-to-r ${currentScheme.gradient} px-6 py-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-6 w-6" />
                      <div>
                        <h3 className="text-lg font-bold">Contract Details</h3>
                        <p className="text-blue-100 text-sm">Complete contract information</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedContract(null)}
                      className="p-2 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Facility Name</p>
                          <p className="font-medium text-slate-900">{selectedContract.facility_name}</p>
                        </div>
                        {selectedContract.facility_type && (
                          <div>
                            <p className="text-sm text-slate-600">Facility Type</p>
                            <p className="font-medium text-slate-900">{selectedContract.facility_type}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-slate-600">Dosimeters Allocated</p>
                          <p className="font-medium text-slate-900">{selectedContract.dosimeters}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Contract Status</p>
                          <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                        </div>
                        {selectedContract.priority && (
                          <div>
                            <p className="text-sm text-slate-600">Priority Level</p>
                            <div className="mt-1">{getPriorityBadge(selectedContract.priority)}</div>
                          </div>
                        )}
                        {selectedContract.contract_value && (
                          <div>
                            <p className="text-sm text-slate-600">Contract Value</p>
                            <p className="font-medium text-green-600">{formatCurrency(selectedContract.contract_value)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    {(selectedContract.contact_person || selectedContract.contact_phone || selectedContract.contact_email) && (
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedContract.contact_person && (
                            <div>
                              <p className="text-sm text-slate-600">Contact Person</p>
                              <p className="font-medium text-slate-900">{selectedContract.contact_person}</p>
                            </div>
                          )}
                          {selectedContract.contact_phone && (
                            <div>
                              <p className="text-sm text-slate-600">Phone Number</p>
                              <p className="font-medium text-slate-900">{selectedContract.contact_phone}</p>
                            </div>
                          )}
                          {selectedContract.contact_email && (
                            <div>
                              <p className="text-sm text-slate-600">Email Address</p>
                              <p className="font-medium text-slate-900">{selectedContract.contact_email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contract Period */}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Contract Period</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Start Date</p>
                          <p className="font-medium text-slate-900">{formatDate(selectedContract.start_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">End Date</p>
                          <div className={`font-medium ${isExpiringSoon(selectedContract.end_date) ? 'text-amber-600' : 'text-slate-900'}`}>
                            {formatDate(selectedContract.end_date)}
                            {isExpiringSoon(selectedContract.end_date) && (
                              <p className="text-sm text-amber-600 mt-1">⚠️ Contract expiring soon</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scanned Document - UPDATED WITH VIEW FUNCTION */}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Scanned Contract Document</h4>
                      <div className="bg-slate-50 rounded-lg p-4">
                        {selectedContract.scanned_document ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <File className="h-8 w-8 text-blue-500" />
                              <div>
                                <p className="font-medium text-slate-900">Contract Document</p>
                                <p className="text-sm text-slate-600">Scanned contract file available</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => viewScannedContract(selectedContract)}
                              leftIcon={<Eye className="h-4 w-4" />}
                              className={buttonStyles.outline}
                            >
                              View Document
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <File className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                            <p className="text-slate-600 mb-3">No scanned contract document uploaded</p>
                          
                            <Button
                              variant="outline"
                              leftIcon={<Upload className="h-4 w-4" />}
                              className={buttonStyles.outline}
                              onClick={() => selectedContract.id && setShowUploadModal(selectedContract.id)}
                            >
                              Upload Scanned Contract
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedContract.notes && (
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Additional Notes</h4>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-slate-700">{selectedContract.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedContract(null)}
                    className={buttonStyles.outline}
                  >
                    Close
                  </Button>
                  <Button 
                    className={buttonStyles.primary}
                    onClick={() => {
                      setEditingContract(selectedContract);
                      setSelectedContract(null);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Contract
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <FileUploadModal 
              contractId={showUploadModal} 
              onClose={() => setShowUploadModal(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}