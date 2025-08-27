'use client';

import { useState } from 'react';
import Head from 'next/head';
import ReceiveForm from '@/components/Forms/ReceiveForm';
import { ReceiveFormData } from '@/types';

export default function ReceivePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // onSubmit handler receives the form data from the ReceiveForm component
  const handleReceiveSubmit = async (data: ReceiveFormData): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      // Example: POST to your API route (uncomment & adapt when you have an API)
      /*
      const res = await fetch('/api/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('API error:', err);
        throw new Error('Failed to submit receipt');
      }
      */

      // Simulated network delay for dev/demo (remove when real API is used)
      await new Promise((resolve) => setTimeout(resolve, 900));

      // Optionally show a success message (you can replace with a nicer toast)
      alert('Receipt confirmed successfully! CHAK has been notified.');

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

          {/* Use the centralized ReceiveForm component */}
          <ReceiveForm onSubmit={handleReceiveSubmit} isSubmitting={isSubmitting} />
        </div>
      </main>
    </>
  );
}
