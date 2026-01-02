import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ClientPayments: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Payments, Cancellations & Refunds</h1>
        <p className="text-gray-600">View Session Payments, Cancellations and Refund Status</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'all'
                ? 'text-teal-700 border-b-2 border-teal-700'
                : 'text-gray-500'
            }`}
          >
            All Payments
          </button>
          <button
            onClick={() => setActiveTab('cancellations')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'cancellations'
                ? 'text-teal-700 border-b-2 border-teal-700'
                : 'text-gray-500'
            }`}
          >
            All Cancellations
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'completed'
                ? 'text-teal-700 border-b-2 border-teal-700'
                : 'text-gray-500'
            }`}
          >
            Refund Completed
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'pending'
                ? 'text-teal-700 border-b-2 border-teal-700'
                : 'text-gray-500'
            }`}
          >
            Refund Pending
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Date & Time</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Payment ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Receipts</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                  No payment records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing 0 results</span>
          <div className="flex gap-2">
            <button className="p-2 border rounded hover:bg-gray-50">
              <ChevronLeft size={20} />
            </button>
            <button className="p-2 border rounded hover:bg-gray-50">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
