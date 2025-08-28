'use client';

import { useState } from 'react';
import { Plus, X, Truck } from 'lucide-react';
import Button from '../UI/Button';
import Loader from '../UI/Loader';
import { DispatchFormData } from '@/types';
import { useNotification } from '@/components/Layout/NotificationProvider';

interface DispatchFormProps {
  onSubmit: (data: DispatchFormData) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function DispatchForm({ onSubmit, isSubmitting }: DispatchFormProps) {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<DispatchFormData>({
    hospital: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    courierName: '',
    courierStaff: '',
    dosimeters: ['']
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDosimeterChange = (index: number, value: string) => {
    const newDosimeters = [...formData.dosimeters];
    newDosimeters[index] = value;
    setFormData(prev => ({ ...prev, dosimeters: newDosimeters }));
  };

  const addDosimeterField = () => setFormData(prev => ({ ...prev, dosimeters: [...prev.dosimeters, ''] }));
  const removeDosimeterField = (index: number) => {
    if (formData.dosimeters.length > 1) {
      setFormData(prev => ({ ...prev, dosimeters: prev.dosimeters.filter((_, i) => i !== index) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredDosimeters = formData.dosimeters.filter(num => num.trim() !== '');
    if (filteredDosimeters.length === 0) {
      showNotification('Please add at least one serial number.', 'error');
      return;
    }

    const success = await onSubmit({ ...formData, dosimeters: filteredDosimeters });
    if (success) {
      showNotification('✅ Dosimeters dispatched successfully!', 'success');
      setFormData({
        hospital: '',
        address: '',
        contactPerson: '',
        contactPhone: '',
        courierName: '',
        courierStaff: '',
        dosimeters: ['']
      });
    } else {
      showNotification('❌ Failed to dispatch dosimeters. Please try again.', 'error');
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Truck className="h-5 w-5 mr-2 text-white/90" />
          Dispatch dosimeters
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hospital Name *</label>
            <input type="text" name="hospital" value={formData.hospital} onChange={handleInputChange} required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person *</label>
            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hospital Address *</label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} rows={3} required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone *</label>
            <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Transport Company *</label>
            <input type="text" name="courierName" value={formData.courierName} onChange={handleInputChange} required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Transport Staff *</label>
            <input type="text" name="courierStaff" value={formData.courierStaff} onChange={handleInputChange} required
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Dosimeters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">Dosimeter Serial Numbers *</label>
            <button type="button" onClick={addDosimeterField} className="flex items-center text-blue-600 text-sm px-2 py-1 border border-blue-200 rounded-lg hover:bg-blue-50">
              <Plus className="h-4 w-4 mr-1" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.dosimeters.map((serial, index) => (
              <div key={index} className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <input type="text" value={serial} onChange={e => handleDosimeterChange(index, e.target.value)}
                  className="flex-grow bg-transparent px-2 py-1 focus:outline-none focus:ring-0" placeholder={`Serial #${index + 1}`} required />
                {formData.dosimeters.length > 1 && (
                  <button type="button" onClick={() => removeDosimeterField(index)} className="ml-2 text-red-500 hover:text-red-700">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="flex items-center px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition">
            {isSubmitting ? (
              <>
                <Loader size="small" className="mr-2" /> Processing...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" /> Dispatch Now
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
