import React from 'react';
import { Send, X } from 'lucide-react';

interface SendBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendBookingModal: React.FC<SendBookingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Send size={24} />
            <h2 className="text-2xl font-bold">Send Booking Link</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Client Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Client Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter client name"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* Client WhatsApp No */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Client WhatsApp No.<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter client whatsapp number"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* Client Email Address */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Client Email Address
              </label>
              <input
                type="email"
                placeholder="Enter client email address (optional)"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Select Therapy and Therapist */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Select Therapy
                </label>
                <select className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white">
                  <option value="">Select</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Select Therapist
                </label>
                <select className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white">
                  <option value="">Select</option>
                </select>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            className="w-full bg-teal-700 text-white py-3 rounded-lg mt-6 hover:bg-teal-800 font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
