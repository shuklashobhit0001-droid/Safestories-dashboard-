import React, { useEffect, useState } from 'react';
import { X, User, Mail, Phone, Calendar } from 'lucide-react';

interface Client {
  invitee_name: string;
  invitee_email: string;
  invitee_phone: string;
}

interface Appointment {
  invitee_name: string;
  booking_resource_name: string;
  booking_start_at: string;
  booking_invitee_time: string;
}

interface TherapistDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: {
    name: string;
    specialization: string;
    contact_info: string | null;
    total_sessions_lifetime: number;
    sessions_this_month: number;
    total_revenue: number;
    revenue_this_month: number;
  } | null;
}

export const TherapistDetailsModal: React.FC<TherapistDetailsModalProps> = ({ isOpen, onClose, therapist }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && therapist) {
      fetchTherapistDetails();
    }
  }, [isOpen, therapist]);

  const fetchTherapistDetails = async () => {
    if (!therapist) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/therapist-details?name=${encodeURIComponent(therapist.name)}`);
      const data = await response.json();
      setClients(data.clients || []);
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error fetching therapist details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !therapist) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User size={24} className="text-teal-700" />
            <h2 className="text-2xl font-bold">{therapist.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Therapist Info */}
        <div className="mb-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {therapist.specialization.split(',').map((spec, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#2D757930', color: '#2D7579' }}>
                  {spec.trim()}
                </span>
              ))}
            </div>
          </div>

          {therapist.contact_info && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={16} />
              <span>{therapist.contact_info}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Sessions Lifetime</p>
              <p className="text-2xl font-bold text-teal-700">{therapist.total_sessions_lifetime}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Sessions This Month</p>
              <p className="text-2xl font-bold text-teal-700">{therapist.sessions_this_month}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-teal-700">₹{Number(therapist.total_revenue || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Revenue This Month</p>
              <p className="text-2xl font-bold text-teal-700">₹{Number(therapist.revenue_this_month || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Clients List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Assigned Clients ({clients.length})</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Client Name</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Email</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-gray-400 text-sm">No clients found</td>
                      </tr>
                    ) : (
                      clients.map((client, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{client.invitee_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{client.invitee_email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{client.invitee_phone}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Appointments */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Appointments ({appointments.length})</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Client Name</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Session Type</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-gray-400 text-sm">No appointments found</td>
                      </tr>
                    ) : (
                      appointments.map((apt, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{apt.invitee_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{apt.booking_resource_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{apt.booking_invitee_time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
