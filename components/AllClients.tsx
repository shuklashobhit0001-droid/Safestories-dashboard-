import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { SendBookingModal } from './SendBookingModal';

interface Client {
  invitee_name: string;
  invitee_phone: string;
  invitee_email: string;
  booking_host_name: string;
  session_count: number;
}

export const AllClients: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching clients:', err);
        setLoading(false);
      });
  }, []);
  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">All Clients</h1>
          <p className="text-gray-600">View Client Details, Sessions and more...</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-800"
        >
          <MessageCircle size={18} />
          Send Booking Link
        </button>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg border flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Phone No.</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">No. of Sessions</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Assigned Therapist</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">
                    Loading...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((client, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{client.invitee_name}</td>
                    <td className="px-6 py-4 text-sm">{client.invitee_phone}</td>
                    <td className="px-6 py-4 text-sm">{client.invitee_email}</td>
                    <td className="px-6 py-4 text-sm">{client.session_count}</td>
                    <td className="px-6 py-4 text-sm">{client.booking_host_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing {clients.length} client{clients.length !== 1 ? 's' : ''}</span>
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
