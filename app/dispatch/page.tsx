'use client';

import { useState } from 'react';
import Button from '../../components/UI/Button';

interface DispatchForm {
  hospital: string;
  quantity: number;
  courier: string;
}

export default function Dispatch() {
  const [form, setForm] = useState<DispatchForm>({
    hospital: '',
    quantity: 1,
    courier: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      alert('Dosimetries dispatched successfully!');
      setForm({ hospital: '', quantity: 1, courier: '' });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <h1 className="text-2xl font-bold text-chak-blue mb-6">Dispatch Dosimetries</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-6 max-w-lg"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Hospital</label>
          <input
            type="text"
            name="hospital"
            value={form.hospital}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-chak-blue"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            min={1}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-chak-blue"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Courier</label>
          <input
            type="text"
            name="courier"
            value={form.courier}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-chak-blue"
            required
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Dispatching...' : 'Dispatch'}
        </Button>
      </form>
    </div>
  );
}
