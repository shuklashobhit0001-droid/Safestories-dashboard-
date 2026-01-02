import React, { useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';

export const ClientAppointments: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Appointments</h1>
          <p className="text-gray-600">View Recently Book Session, and more...</p>
        </div>
        <button className="bg-gray-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-600">
          <CalendarPlus size={20} />
          Book a Session
        </button>
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
            All Appointments
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'upcoming'
                ? 'text-teal-700 border-b-2 border-teal-700'
                : 'text-gray-500'
            }`}
          >
            Upcoming Sessions
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'completed'
                ? 'text-teal-700 border-b-2 border-teal-700'
                : 'text-gray-500'
            }`}
          >
            Completed Session
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Timings</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Therapist Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Mode</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                  No appointments found
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
