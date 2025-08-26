'use client';

import { useState } from 'react';
import Head from 'next/head';
import ImageUpload from '../../components/Forms/ImageUpload';

type TabOption = 'manual' | 'image';

interface FormData {
  hospital: string;
  receiverName: string;
  receiverTitle: string;
  serialNumbers: string[];
}

export default function Receive() {
  const [activeTab, setActiveTab] = useState<TabOption>('manual');
  const [formData, setFormData] = useState<FormData>({
    hospital: '',
    receiverName: '',
    receiverTitle: '',
    serialNumbers: [''],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSerialNumberChange = (index: number, value: string) => {
    const newSerialNumbers = [...formData.serialNumbers];
    newSerialNumbers[index] = value;
    setFormData((prev) => ({
      ...prev,
      serialNumbers: newSerialNumbers,
    }));
  };

  const addSerialNumberField = () => {
    setFormData((prev) => ({
      ...prev,
      serialNumbers: [...prev.serialNumbers, ''],
    }));
  };

  const removeSerialNumberField = (index: number) => {
    if (formData.serialNumbers.length > 1) {
      const newSerialNumbers = formData.serialNumbers.filter(
        (_, i) => i !== index
      );
      setFormData((prev) => ({
        ...prev,
        serialNumbers: newSerialNumbers,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      alert('Receipt confirmed successfully! CHAK has been notified.');
      setFormData({
        hospital: '',
        receiverName: '',
        receiverTitle: '',
        serialNumbers: [''],
      });
      setIsSubmitting(false);
    }, 1500);
  };

  // 🔹 Callback from ImageUpload
  const handleNumbersDetected = (numbers: string[]) => {
    setFormData((prev) => ({
      ...prev,
      serialNumbers: numbers.length > 0 ? numbers : prev.serialNumbers,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Receive - CHAK Dosimetry Tracker</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-chak-blue mb-6">
            Confirm Receipt of Dosimetries
          </h2>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`py-4 px-6 text-center font-medium text-sm flex-1 ${
                    activeTab === 'manual'
                      ? 'text-chak-blue border-b-2 border-chak-blue'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  onClick={() => setActiveTab('image')}
                  className={`py-4 px-6 text-center font-medium text-sm flex-1 ${
                    activeTab === 'image'
                      ? 'text-chak-blue border-b-2 border-chak-blue'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Image Recognition
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'manual' ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label
                        htmlFor="hospital"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Hospital Name
                      </label>
                      <input
                        type="text"
                        id="hospital"
                        name="hospital"
                        value={formData.hospital}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chak-blue"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="receiverName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Receiver&apos;s Name
                      </label>
                      <input
                        type="text"
                        id="receiverName"
                        name="receiverName"
                        value={formData.receiverName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chak-blue"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="receiverTitle"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Receiver&apos;s Title
                      </label>
                      <input
                        type="text"
                        id="receiverTitle"
                        name="receiverTitle"
                        value={formData.receiverTitle}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chak-blue"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosimetry Serial Numbers
                    </label>

                    {formData.serialNumbers.map((serial, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          type="text"
                          value={serial}
                          onChange={(e) =>
                            handleSerialNumberChange(index, e.target.value)
                          }
                          className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chak-blue"
                          placeholder={`Serial #${index + 1}`}
                          required
                        />
                        {formData.serialNumbers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSerialNumberField(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addSerialNumberField}
                      className="mt-2 text-chak-blue hover:text-chak-blue-dark text-sm flex items-center"
                    >
                      ＋ Add another serial number
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-chak-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-chak-blue-dark focus:outline-none focus:ring-2 focus:ring-chak-blue-light disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm Receipt'}
                    </button>
                  </div>
                </form>
              ) : (
                <ImageUpload onNumbersDetected={handleNumbersDetected} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
