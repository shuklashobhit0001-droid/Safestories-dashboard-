import React, { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';

interface Refund {
  client_name: string;
  session_name: string;
  session_timings: string;
  refund_status: string;
  invitee_phone: string;
  invitee_email: string;
  refund_amount: number;
}

export const RefundsCancellations: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refunds, setRefunds] = useState<Refund[]>([]);

  const tabs = [
    { id: 'all', label: 'All Cancellations' },
    { id: 'Pending', label: 'Refund Initiated' },
    { id: 'Failed', label: 'Refund Failed' },
  ];

  useEffect(() => {
    fetchRefunds();
  }, [activeTab]);

  const fetchRefunds = async () => {
    try {
      const response = await fetch(`/api/refunds?status=${activeTab}`);
      const data = await response.json();
      setRefunds(data);
    } catch (error) {
      console.error('Error fetching refunds:', error);
    }
  };

  const filteredRefunds = refunds.filter(refund => 
    refund.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return dateString;
    return dateString;
  };

  const exportToCSV = () => {
    const headers = ['Client Name', 'Contact', 'Cancelled Session', 'Session Date & Time', 'Refund Status'];
    const rows = filteredRefunds.map(refund => [
      refund.client_name,
      refund.invitee_phone || refund.invitee_email,
      refund.session_name,
      formatDateTime(refund.session_timings),
      refund.refund_status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refunds_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
        <div className="flex gap-4">
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
          <button
            onClick={exportToCSV}
            className="bg-teal-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-800 whitespace-nowrap text-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Clients Details</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Cancelled Session</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Date & Time</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Refund Status</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">
                    No refunds or cancellations found
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((refund, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>{refund.client_name}</div>
                      <div className="text-xs text-gray-500">{refund.invitee_phone || refund.invitee_email}</div>
                    </td>
                    <td className="px-6 py-4">{refund.session_name}</td>
                    <td className="px-6 py-4">{formatDateTime(refund.session_timings)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        refund.refund_status === 'Completed' ? 'bg-green-100 text-green-700' :
                        refund.refund_status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {refund.refund_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing {filteredRefunds.length} of {refunds.length} results</span>
          <div className="flex gap-2">
            <button className="p-2 border rounded hover:bg-gray-50">←</button>
            <button className="p-2 border rounded hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>
    </div>
  );
};
