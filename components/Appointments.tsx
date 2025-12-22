import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Download } from 'lucide-react';
import { SendBookingModal } from './SendBookingModal';

interface Appointment {
  booking_start_at: string;
  booking_resource_name: string;
  invitee_name: string;
  invitee_phone: string;
  invitee_email: string;
  booking_host_name: string;
  booking_mode: string;
}

export const Appointments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        setAppointments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      });
  }, []);



  const filteredAppointments = appointments.filter(apt => {
    const query = searchQuery.toLowerCase();
    return (
      apt.booking_resource_name.toLowerCase().includes(query) ||
      apt.invitee_name.toLowerCase().includes(query) ||
      apt.booking_host_name.toLowerCase().includes(query)
    );
  });

  const exportToCSV = () => {
    const headers = ['Session Timings', 'Session Name', 'Client Name', 'Phone', 'Email', 'Therapist Name', 'Mode'];
    const rows = filteredAppointments.map(apt => [
      apt.booking_start_at,
      apt.booking_resource_name,
      apt.invitee_name,
      apt.invitee_phone,
      apt.invitee_email,
      apt.booking_host_name,
      apt.booking_mode
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Appointments</h1>
          <p className="text-gray-600">View Recently Book Session, Send Invite and more...</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-800"
        >
          <MessageCircle size={18} />
          Send Booking Link
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search appointments by session, client or therapist name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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

      {/* Appointments Table */}
      <div className="bg-white rounded-lg border flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Timings</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Contact Info</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Therapist Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Mode</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    Loading...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    No appointments found
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{apt.booking_start_at}</td>
                    <td className="px-6 py-4 text-sm">{apt.booking_resource_name}</td>
                    <td className="px-6 py-4 text-sm">{apt.invitee_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>{apt.invitee_phone}</div>
                      <div className="text-gray-500 text-xs">{apt.invitee_email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{apt.booking_host_name}</td>
                    <td className="px-6 py-4 text-sm">{apt.booking_mode}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing {filteredAppointments.length} of {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button className="p-2 border rounded hover:bg-gray-50">←</button>
            <button className="p-2 border rounded hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>
      <SendBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
