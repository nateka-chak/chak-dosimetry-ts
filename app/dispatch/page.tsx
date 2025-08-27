'use client';

import { useState } from 'react';
import DispatchForm from '@/components/Forms/DispatchForm';
import { DispatchFormData } from '@/types';

export default function Dispatch() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle the form submission
  const handleSubmit = async (data: DispatchFormData) => {
    setIsSubmitting(true);

    try {
      // TODO: Replace with your API call or logic
      console.log('Dispatch data:', data);

      // Simulate async request
      await new Promise((resolve) => setTimeout(resolve, 1200));

      alert('Dosimeters dispatched successfully!');
      return true;
    } catch (error) {
      console.error(error);
      alert('Failed to dispatch dosimeters.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-8">
      <h1 className="text-2xl font-bold text-chak-blue mb-6 text-center">
        Dispatch Dosimeters
      </h1>

      {/* Imported form with proper submit handler */}
      <DispatchForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
