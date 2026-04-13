import React, { useState, useEffect } from 'react';
import { Search, Download, Plus, Pencil, Check, X } from 'lucide-react';
import { SendBookingModal } from '../../../components/SendBookingModal';
import { Loader } from '../../../components/Loader';
import { Toast } from '../../../components/Toast';

interface Client {
  invitee_id: string;
  invitee_name: string;
  invitee_phone: string;
  invitee_email: string;
  booking_host_name: string;
  session_count: number;
  latest_booking_date?: string;
  lead_id?: string | number | null;
}

interface PreTherapyBookingsProps {
  currentUser?: any;
  setCurrentPage?: (page: string) => void;
}

const PreTherapyBookings: React.FC<PreTherapyBookingsProps> = ({ currentUser, setCurrentPage }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefilledClientData, setPrefilledClientData] = useState<{ name: string; phone: string; email: string } | undefined>(undefined);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  // rowEdits: keyed by invitee_phone, stores { name, phone, email, saving }
  const [rowEdits, setRowEdits] = useState<Record<string, { name: string; phone: string; email: string; saving: boolean }>>({});
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching clients for pre-therapy:', err);
        setLoading(false);
      });
  }, []);

  const formatClientName = (name: string): string => {
    if (!name) return name;
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatPreTherapyDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getUTCDate();
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };

  const standardizeTherapistName = (name: string | undefined): string => {
    if (!name) return '';
    if (name.toLowerCase().trim() === 'ishika') return 'Ishika Mahajan';
    return name;
  };

  const filteredClients = clients.filter(client => {
    const isSafestories = (client.booking_host_name || '').toLowerCase().trim() === 'safestories';
    if (!isSafestories) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (client.invitee_name || '').toLowerCase().includes(query) ||
        (client.invitee_phone || '').toLowerCase().includes(query) ||
        (client.invitee_email || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const exportToCSV = () => {
    const headers = ['Client Name', 'Phone No.', 'Email ID', 'Pre-therapy Date'];
    const rows = filteredClients.map(client => [
      formatClientName(client.invitee_name),
      client.invitee_phone,
      client.invitee_email,
      formatPreTherapyDate(client.latest_booking_date)
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre_therapy_clients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAssignTherapist = (client: Client) => {
    setPrefilledClientData({
      name: client.invitee_name,
      phone: client.invitee_phone,
      email: client.invitee_email
    });
    setIsModalOpen(true);
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setRowEdits({});
    } else {
      // Pre-populate all rows
      const edits: Record<string, { name: string; phone: string; email: string; saving: boolean }> = {};
      clients.forEach(c => {
        edits[c.invitee_phone] = { name: c.invitee_name, phone: c.invitee_phone, email: c.invitee_email, saving: false };
      });
      setRowEdits(edits);
    }
    setIsEditMode(prev => !prev);
  };

  const saveRow = async (client: Client) => {
    const edit = rowEdits[client.invitee_phone];
    if (!edit) return;
    setRowEdits(prev => ({ ...prev, [client.invitee_phone]: { ...prev[client.invitee_phone], saving: true } }));
    try {
      const res = await fetch('/api/clients/update-contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_phone: client.invitee_phone || undefined,
          old_email: client.invitee_email || undefined,
          new_name: edit.name !== client.invitee_name ? edit.name : undefined,
          new_phone: edit.phone !== client.invitee_phone ? edit.phone : undefined,
          new_email: edit.email !== client.invitee_email ? edit.email : undefined,
          _audit_user: { id: currentUser?.id, name: currentUser?.full_name || currentUser?.username || 'Admin' }
        })
      });
      if (res.ok) {
        const refreshed = await fetch('/api/clients').then(r => r.json());
        if (Array.isArray(refreshed)) setClients(refreshed);
        setToast({ message: 'Client info updated successfully!', type: 'success' });
      } else {
        setToast({ message: 'Failed to save', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setRowEdits(prev => ({ ...prev, [client.invitee_phone]: { ...prev[client.invitee_phone], saving: false } }));
    }
  };

  return (
    <div className="p-8 h-full flex flex-col relative w-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Pre-Therapy Bookings</h1>
          <p className="text-gray-600">View your Pre-Therapy clients and assign therapists</p>
        </div>
        <button
          onClick={toggleEditMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            isEditMode
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-teal-700 text-white hover:bg-teal-800'
          }`}
        >
          <Pencil size={16} />
          {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
        </button>
      </div>

      <div className="relative mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search clients by name, phone no or email id..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-lg border flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Contact Info</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Pre-therapy Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Assigned Therapist</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      No pre-therapy clients found
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((client, index) => {
                    const edit = rowEdits[client.invitee_phone];
                    return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {isEditMode && edit ? (
                          <input
                            type="text"
                            value={edit.name}
                            onChange={e => setRowEdits(prev => ({ ...prev, [client.invitee_phone]: { ...prev[client.invitee_phone], name: e.target.value } }))}
                            className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        ) : (
                          <button
                            onClick={() => {
                              const navigateId = client.lead_id || `temp:${client.invitee_id || client.invitee_phone || client.invitee_email || 'unknown'}`;
                              setCurrentPage?.(`lead-profile:${navigateId}`);
                            }}
                            className="text-teal-600 hover:text-teal-700 hover:underline cursor-pointer transition-colors text-left font-bold"
                          >
                            {formatClientName(client.invitee_name)}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isEditMode && edit ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="tel"
                              value={edit.phone}
                              onChange={e => setRowEdits(prev => ({ ...prev, [client.invitee_phone]: { ...prev[client.invitee_phone], phone: e.target.value } }))}
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                              placeholder="Phone"
                            />
                            <input
                              type="email"
                              value={edit.email}
                              onChange={e => setRowEdits(prev => ({ ...prev, [client.invitee_phone]: { ...prev[client.invitee_phone], email: e.target.value } }))}
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                              placeholder="Email"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-gray-900">{client.invitee_phone}</div>
                            <div className="text-gray-500 text-xs">{client.invitee_email}</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatPreTherapyDate(client.latest_booking_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {standardizeTherapistName(client.booking_host_name)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex justify-center gap-3">
                          {isEditMode && edit ? (
                            <button
                              onClick={() => saveRow(client)}
                              disabled={edit.saving}
                              className="flex items-center gap-1 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg hover:bg-teal-100 disabled:opacity-50"
                            >
                              <Check size={14} />
                              {edit.saving ? 'Saving...' : 'Save'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignTherapist(client)}
                              className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
                            >
                              <Plus size={16} />
                              Assign a Therapist
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredClients.length > 0 && (
            <div className="px-6 py-4 border-t flex justify-between items-center bg-gray-50 rounded-b-lg mt-auto">
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  ←
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <SendBookingModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setPrefilledClientData(undefined);
        }}
        prefilledClient={prefilledClientData}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default PreTherapyBookings;
