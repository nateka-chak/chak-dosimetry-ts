'use client';

import { useState } from 'react';
import { Plus, X, Truck } from 'lucide-react';
import Button from '../UI/Button';
import Loader from '../UI/Loader';
import { DispatchFormData } from '@/types';

interface DispatchFormProps {
  onSubmit: (data: DispatchFormData) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function DispatchForm({ onSubmit, isSubmitting }: DispatchFormProps) {
  const [formData, setFormData] = useState<DispatchFormData>({
    hospital: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    dosimetries: ['']
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDosimetryChange = (index: number, value: string) => {
    const newDosimetries = [...formData.dosimetries];
    newDosimetries[index] = value;
    setFormData(prev => ({ ...prev, dosimetries: newDosimetries }));
  };

  const addDosimetryField = () => {
    setFormData(prev => ({ ...prev, dosimetries: [...prev.dosimetries, ''] }));
  };

  const removeDosimetryField = (index: number) => {
    if (formData.dosimetries.length > 1) {
      const newDosimetries = formData.dosimetries.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, dosimetries: newDosimetries }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filteredDosimetries = formData.dosimetries.filter(num => num.trim() !== '');
    if (filteredDosimetries.length === 0) {
      alert('Please add at least one serial number');
      return;
    }

    const success = await onSubmit({ ...formData, dosimetries: filteredDosimetries });
    if (success) {
      setFormData({
        hospital: '',
        address: '',
        contactPerson: '',
        contactPhone: '',
        dosimetries: ['']
      });
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Truck className="h-5 w-5 mr-2 text-white/90" />
          Dispatch Dosimetries
        </h2>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="hospital" className="block text-sm font-semibold text-gray-700 mb-1">
              Hospital Name *
            </label>
            <input
              type="text"
              id="hospital"
              name="hospital"
              value={formData.hospital}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="contactPerson" className="block text-sm font-semibold text-gray-700 mb-1">
              Contact Person *
            </label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">
              Hospital Address *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700 mb-1">
              Contact Phone *
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Dosimetry section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              Dosimetry Serial Numbers *
            </label>
            <button
              type="button"
              onClick={addDosimetryField}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Another
            </button>
          </div>

          <div className="space-y-3">
            {formData.dosimetries.map((serial, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 shadow-sm"
              >
                <input
                  type="text"
                  value={serial}
                  onChange={(e) => handleDosimetryChange(index, e.target.value)}
                  className="flex-grow bg-transparent px-2 py-1 focus:outline-none focus:ring-0"
                  placeholder={`Serial #${index + 1}`}
                  required
                />
                {formData.dosimetries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDosimetryField(index)}
                    className="ml-2 text-red-500 hover:text-red-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            {isSubmitting ? (
              <>
                <Loader size="small" className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Dispatch Now
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
