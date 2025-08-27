'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Button from '../UI/Button';
import Loader from '../UI/Loader';
import ImageUpload from './ImageUpload';
import { ReceiveFormData } from '@/types';
import { useNotification } from '@/components/Layout/NotificationProvider';

interface ReceiveFormProps {
  onSubmit: (data: ReceiveFormData) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function ReceiveForm({ onSubmit, isSubmitting }: ReceiveFormProps) {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'manual' | 'image'>('manual');
  const [formData, setFormData] = useState<ReceiveFormData>({
    hospitalName: '',
    receiverName: '',
    receiverTitle: '',
    serialNumbers: [''],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSerialNumberChange = (index: number, value: string) => {
    const newSerialNumbers = [...formData.serialNumbers];
    newSerialNumbers[index] = value;
    setFormData(prev => ({ ...prev, serialNumbers: newSerialNumbers }));
  };

  const addSerialNumberField = () => {
    setFormData(prev => ({ ...prev, serialNumbers: [...prev.serialNumbers, ''] }));
  };

  const removeSerialNumberField = (index: number) => {
    if (formData.serialNumbers.length > 1) {
      const newSerialNumbers = formData.serialNumbers.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, serialNumbers: newSerialNumbers }));
    }
  };

  const handleImageNumbersDetected = (detectedNumbers: string[]) => {
    setFormData(prev => ({
      ...prev,
      serialNumbers: detectedNumbers.filter(num => num.trim() !== ''),
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const filteredSerialNumbers = formData.serialNumbers.filter(num => num.trim() !== '');
    if (filteredSerialNumbers.length === 0) {
      showNotification('⚠️ Please add at least one serial number.', 'error');
      return;
    }

    try {
      const success = await onSubmit({
        hospitalName: formData.hospitalName,
        receiverName: formData.receiverName,
        receiverTitle: formData.receiverTitle,
        serialNumbers: filteredSerialNumbers,
      });

      if (success) {
        showNotification('✅ Receipt confirmed successfully!', 'success');
        setFormData({
          hospitalName: '',
          receiverName: '',
          receiverTitle: '',
          serialNumbers: [''],
        });
        setActiveTab('manual');
      } else {
        showNotification('❌ Failed to confirm receipt. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Receive submit error:', err);
      showNotification('❌ Failed to confirm receipt. Please try again.', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-chak-blue mb-6">Confirm Receipt</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-4 px-6 flex-1 text-sm font-medium text-center transition-colors ${
              activeTab === 'manual'
                ? 'text-chak-blue border-b-2 border-chak-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`py-4 px-6 flex-1 text-sm font-medium text-center transition-colors ${
              activeTab === 'image'
                ? 'text-chak-blue border-b-2 border-chak-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Image Recognition
          </button>
        </nav>
      </div>

      {activeTab === 'manual' ? (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Hospital + Receiver Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Name *
              </label>
              <input
                type="text"
                id="hospitalName"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chak-blue outline-none"
              />
            </div>

            <div>
              <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700 mb-1">
                Receiver's Name *
              </label>
              <input
                type="text"
                id="receiverName"
                name="receiverName"
                value={formData.receiverName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chak-blue outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="receiverTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Receiver's Title *
              </label>
              <input
                type="text"
                id="receiverTitle"
                name="receiverTitle"
                value={formData.receiverTitle}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chak-blue outline-none"
              />
            </div>
          </div>

          {/* Serial Numbers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosimeter Serial Numbers *
            </label>
            {formData.serialNumbers.map((serial, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={serial}
                  onChange={(e) => handleSerialNumberChange(index, e.target.value)}
                  placeholder={`Serial #${index + 1}`}
                  required
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chak-blue outline-none"
                />
                {formData.serialNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSerialNumberField(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSerialNumberField}
              className="mt-2 text-chak-blue hover:text-chak-blue-dark text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add another serial number
            </button>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="flex items-center text-gray-900">
              {isSubmitting ? (
                <>
                  <Loader size="small" className="mr-2" /> Processing...
                </>
              ) : (
                'Confirm Receipt'
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <ImageUpload onNumbersDetected={handleImageNumbersDetected} />
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
            <div className="flex">
              <svg
                className="h-5 w-5 text-yellow-400 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 
                  3.486 0l5.58 9.92c.75 1.334-.213 
                  2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-
                  1.743-2.98l5.58-9.92zM11 13a1 1 
                  0 11-2 0 1 1 0 012 0zm-1-8a1 1 
                  0 00-1 1v3a1 1 0 002 0V6a1 1 
                  0 00-1-1z"
                />
              </svg>
              <p className="ml-3 text-sm text-yellow-700">
                After uploading images, please fill in the hospital and receiver details above before confirming receipt.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
