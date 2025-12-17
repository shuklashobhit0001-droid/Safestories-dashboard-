import React, { useState, useEffect } from 'react';
import { MessageCircle, Search } from 'lucide-react';
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search appointments by session, client or therapist name..."
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
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
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    No appointments found
                  </td>
                </tr>
              ) : (
                appointments.map((apt, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{formatDateTime(apt.booking_start_at)}</td>
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
          <span className="text-sm text-gray-600">Showing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
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
