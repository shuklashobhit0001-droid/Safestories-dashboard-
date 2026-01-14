import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, User, Mail } from 'lucide-react';
import { Loader } from './Loader';

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

export const AllTherapists: React.FC = () => {
  const [therapists, setTherapists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/therapists');
      const data = await response.json();
      setTherapists(data);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapists = therapists
    .filter(therapist => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        therapist.name.toLowerCase().includes(query) ||
        therapist.specialization.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (!searchQuery) return 0;
      const query = searchQuery.toLowerCase();
      const aNameMatch = a.name.toLowerCase().includes(query);
      const bNameMatch = b.name.toLowerCase().includes(query);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });

  const openTherapistDetails = async (therapist: any) => {
    setSelectedTherapist(therapist);
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/therapist-details?name=${encodeURIComponent(therapist.name)}`);
      const data = await response.json();
      setClients(data.clients || []);
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error fetching therapist details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeTherapistDetails = () => {
    setSelectedTherapist(null);
    setSelectedClient(null);
    setClients([]);
    setAppointments([]);
    setClientAppointments([]);
  };

  const openClientDetails = async (client: Client) => {
    setSelectedClient(client);
    setClientDetailsLoading(true);
    try {
      const response = await fetch(`/api/client-details?email=${encodeURIComponent(client.invitee_email)}&phone=${encodeURIComponent(client.invitee_phone)}`);
      const data = await response.json();
      setClientAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setClientDetailsLoading(false);
    }
  };

  const closeClientDetails = () => {
    setSelectedClient(null);
    setClientAppointments([]);
  };

  if (selectedClient) {
    return (
      <div className="p-8 h-full flex flex-col">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={closeClientDetails}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <User size={24} className="text-teal-700" />
            <h1 className="text-3xl font-bold">{selectedClient.invitee_name}</h1>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-lg font-semibold text-teal-700">{selectedClient.invitee_email || 'N/A'}</p>
            </div>
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="text-lg font-semibold text-teal-700">{selectedClient.invitee_phone || 'N/A'}</p>
            </div>
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-teal-700">{clientAppointments.length}</p>
            </div>
          </div>
        </div>

        {clientDetailsLoading ? (
          <Loader />
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-3">Appointment History ({clientAppointments.length})</h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Session Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Date & Time</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Therapist</th>
                  </tr>
                </thead>
                <tbody>
                  {clientAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-gray-400 text-sm">No appointments found</td>
                    </tr>
                  ) : (
                    clientAppointments.map((apt, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{apt.booking_resource_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{apt.booking_invitee_time}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{selectedTherapist?.name || 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (selectedTherapist) {
    return (
      <div className="p-8 h-full flex flex-col">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={closeTherapistDetails}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <User size={24} className="text-teal-700" />
            <h1 className="text-3xl font-bold">{selectedTherapist.name}</h1>
          </div>
        </div>

        {/* Therapist Info */}
        <div className="mb-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {selectedTherapist.specialization.split(',').map((spec: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#2D757930', color: '#2D7579' }}>
                  {spec.trim()}
                </span>
              ))}
            </div>
          </div>

          {selectedTherapist.contact_info && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={16} />
              <span>{selectedTherapist.contact_info}</span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Sessions Lifetime</p>
              <p className="text-3xl font-bold text-teal-700">{selectedTherapist.total_sessions_lifetime}</p>
            </div>
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Sessions This Month</p>
              <p className="text-3xl font-bold text-teal-700">{selectedTherapist.sessions_this_month}</p>
            </div>
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-teal-700">₹{Number(selectedTherapist.total_revenue || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Revenue This Month</p>
              <p className="text-3xl font-bold text-teal-700">₹{Number(selectedTherapist.revenue_this_month || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {detailsLoading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Clients List */}
            <div>
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
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => openClientDetails(client)}
                              className="text-teal-700 hover:underline font-medium text-left"
                            >
                              {client.invitee_name}
                            </button>
                          </td>
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
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">All Therapists</h1>
          <p className="text-gray-600">View Therapists Details, Specialization and more...</p>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users by name or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Therapists Table */}
      {loading ? (
        <Loader />
      ) : (
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Therapists Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Specialization</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Contact Info</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Total sessions lifetime</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Sessions this month</th>
              </tr>
            </thead>
            <tbody>
              {filteredTherapists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-20">
                    No therapists found
                  </td>
                </tr>
              ) : (
                filteredTherapists.map((therapist, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openTherapistDetails(therapist)}
                        className="text-teal-700 hover:underline font-medium text-left"
                      >
                        {therapist.name}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {therapist.specialization.split(',').map((spec: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#2D757930', color: '#2D7579' }}>
                            {spec.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">{therapist.contact_info || '-'}</td>
                    <td className="px-6 py-4">{therapist.total_sessions_lifetime}</td>
                    <td className="px-6 py-4">{therapist.sessions_this_month}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing {filteredTherapists.length} of {therapists.length} results</span>
          <div className="flex gap-2">
            <button className="p-2 border rounded hover:bg-gray-50">←</button>
            <button className="p-2 border rounded hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
