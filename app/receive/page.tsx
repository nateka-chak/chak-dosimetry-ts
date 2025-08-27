'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import ReceiveForm from '@/components/Forms/ReceiveForm';
import { ReceiveFormData } from '@/types';

export default function ReceivePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReceiveSubmit = async (data: ReceiveFormData): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('API error:', err);
        throw new Error('Failed to submit receipt');
      }

      // optional small delay for UI
      await new Promise(res => setTimeout(res, 500));

      // alert('Receipt confirmed successfully! CHAK has been notified.');
      setIsSubmitting(false);
      return true;
    } catch (error) {
      console.error('Receive submit error:', error);
      alert('There was an error submitting the receipt. Please try again.');
      setIsSubmitting(false);
      return false;
    }
  };

  return (
    <>
      <Head>
        <title>Receive - CHAK Dosimetry Tracker</title>
        <meta name="description" content="Confirm receipt of dosimetries for CHAK" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl font-bold text-chak-blue mb-6 text-center">
            Confirm Receipt of Dosimeters
          </h1>

          <ReceiveForm onSubmit={handleReceiveSubmit} isSubmitting={isSubmitting} />
        </div>
      </main>
    </>
  );
}
