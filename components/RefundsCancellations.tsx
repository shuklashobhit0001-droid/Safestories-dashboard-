import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const RefundsCancellations: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'all', label: 'All Cancellations' },
    { id: 'pending', label: 'Refund Pending' },
    { id: 'completed', label: 'Refund Completed' },
    { id: 'failed', label: 'Refund Failed' },
  ];

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Refunds & Cancellations</h1>
        <p className="text-gray-600">View Cancelled Session and Refund Status</p>
      </div>

      {/* Tabs and Search */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 font-medium ${
                activeTab === tab.id
                  ? 'text-teal-700 border-b-2 border-teal-700'
                  : 'text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search client by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full h-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Clients Details</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Cancelled Session</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Date & Time</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Refund Status</th>
              </tr>
            </thead>
            <tbody className="h-full">
              <tr className="h-full">
                <td colSpan={4} className="text-center text-gray-400 align-middle">
                  No refunds or cancellations found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing 1 to 10 of 32 results</span>
          <div className="flex gap-2">
            <button className="p-2 border rounded hover:bg-gray-50">←</button>
            <button className="p-2 border rounded hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>
    </div>
  );
};
