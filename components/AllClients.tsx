import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, Download, ChevronDown, ChevronRight, ArrowRightLeft, Plus, Send } from 'lucide-react';
import { SendBookingModal } from './SendBookingModal';
import { TransferClientModal } from './TransferClientModal';
import { Loader } from './Loader';
import { Toast } from './Toast';

interface Therapist {
  invitee_name: string;
  invitee_phone: string;
  booking_host_name: string;
  session_count: number;
}

interface Client {
  invitee_name: string;
  invitee_phone: string;
  invitee_email: string;
  booking_host_name: string;
  booking_resource_name?: string;
  session_count: number;
  therapists: Therapist[];
  latest_booking_date?: string;
  booking_link_sent_at?: string;
  last_session_date?: string;
}

export const AllClients: React.FC<{ onClientClick?: (client: any) => void; onCreateBooking?: () => void }> = ({ onClientClick, onCreateBooking }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefilledClientData, setPrefilledClientData] = useState<{ name: string; phone: string; email: string } | undefined>(undefined);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'clients' | 'pretherapy' | 'leads'>('clients');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const itemsPerPage = 10;
  const tableRef = useRef<HTMLDivElement>(null);
  const [adminUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const formatClientName = (name: string): string => {
    if (!name) return name;
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatSessionName = (sessionName: string | undefined, therapistName: string | undefined): string => {
    if (!sessionName) return 'N/A';
    
    // If session name already includes "Session with", return as is
    if (sessionName.toLowerCase().includes('session with')) {
      return sessionName;
    }
    
    // If we have a therapist name, append it
    if (therapistName) {
      const standardizedTherapist = standardizeTherapistName(therapistName);
      return `${sessionName} Session with ${standardizedTherapist}`;
    }
    
    return sessionName;
  };

  const standardizeTherapistName = (name: string | undefined): string => {
    if (!name) return '';
    
    // Standardize Ishika to Ishika Mahajan
    if (name.toLowerCase().trim() === 'ishika') {
      return 'Ishika Mahajan';
    }
    
    return name;
  };

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

  // Click outside to close expanded rows
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setExpandedRows(new Set());
      }
    };

    if (expandedRows.size > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedRows]);

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const formatBookingLinkDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatPreTherapyDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    
    // Handle the format: "Monday, Feb 9, 2026 at 1:00 PM - 1:50 PM (GMT+01:00)"
    // Extract just the date part before "at"
    const datePart = dateString.split(' at ')[0];
    
    // Parse the date
    const date = new Date(datePart);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      (client.invitee_name || '').toLowerCase().includes(query) ||
      (client.invitee_phone || '').toLowerCase().includes(query) ||
      (client.invitee_email || '').toLowerCase().includes(query) ||
      (client.booking_host_name || '').toLowerCase().includes(query)
    );
    
    if (!matchesSearch) return false;
    
    const isSafestories = (client.booking_host_name || '').toLowerCase().trim() === 'safestories';
    
    // Filter by tab - each client appears in only one tab
    if (activeTab === 'pretherapy') {
      // Pre-Therapy: clients with Safestories as therapist (any booking count)
      return isSafestories;
    } else if (activeTab === 'leads') {
      // Leads: clients with 0 bookings (any therapist)
      return client.session_count === 0;
    } else {
      // All Clients: clients with bookings AND therapist is NOT Safestories
      return client.session_count > 0 && !isSafestories;
    }
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const exportToCSV = () => {
    let headers: string[];
    let rows: any[][];
    
    if (activeTab === 'pretherapy') {
      headers = ['Client Name', 'Phone No.', 'Email ID', 'Pre-therapy Date'];
      rows = filteredClients.map(client => [
        formatClientName(client.invitee_name),
        client.invitee_phone,
        client.invitee_email,
        formatPreTherapyDate(client.latest_booking_date)
      ]);
    } else if (activeTab === 'leads') {
      headers = ['Client Name', 'Phone No.', 'Email ID', 'Assigned Therapist', 'Booking Link Sent'];
      rows = filteredClients.map(client => [
        formatClientName(client.invitee_name),
        client.invitee_phone,
        client.invitee_email,
        client.booking_host_name,
        formatBookingLinkDate(client.booking_link_sent_at)
      ]);
    } else {
      headers = ['Client Name', 'Phone No.', 'Email ID', 'No. of Bookings', 'Session Name', 'Assigned Therapist'];
      rows = filteredClients.map(client => [
        formatClientName(client.invitee_name),
        client.invitee_phone,
        client.invitee_email,
        client.session_count,
        formatSessionName(client.booking_resource_name, client.booking_host_name),
        standardizeTherapistName(client.booking_host_name)
      ]);
    }
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleTransferClick = (client: Client) => {
    if (isTransferDisabled(client)) {
      return;
    }
    
    const actualTherapist = client.therapists && client.therapists.length > 0 
      ? client.therapists[0].booking_host_name 
      : client.booking_host_name;
    setSelectedClient({ ...client, booking_host_name: actualTherapist });
    setIsTransferModalOpen(true);
  };

  const isTransferDisabled = (client: Client) => {
    if (client.latest_booking_date) {
      return new Date(client.latest_booking_date) > new Date();
    }
    return false;
  };

  const handleSendBookingLink = async (client: Client) => {
    try {
      // Get the most recent therapy type for this client
      let therapyType = 'Individual Therapy';
      try {
        const response = await fetch(`/api/client-therapy-type?email=${encodeURIComponent(client.invitee_email)}&phone=${encodeURIComponent(client.invitee_phone)}`);
        if (response.ok) {
          const data = await response.json();
          therapyType = data.therapy_type || 'Individual Therapy';
        }
      } catch (error) {
        console.warn('Could not fetch client therapy type, using default:', error);
      }

      // Clean therapy type to remove therapist name and "Session"
      const cleanTherapyType = (therapy: string) => {
        let cleaned = therapy.replace(/\s+with\s+[A-Za-z\s]+$/i, '').trim();
        cleaned = cleaned.replace(/\s+Session$/i, '').trim();
        return cleaned;
      };

      const webhookData = {
        clientName: client.invitee_name,
        email: client.invitee_email,
        phone: client.invitee_phone,
        therapistName: client.booking_host_name,
        therapy: cleanTherapyType(therapyType)
      };

      const response = await fetch('/api/send-booking-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.warning) {
          setToast({ message: `${result.message} (${result.warning})`, type: 'success' });
        } else {
          setToast({ message: 'Booking link sent to client successfully!', type: 'success' });
        }
      } else {
        setToast({ message: 'Failed to send booking link to client', type: 'error' });
      }
    } catch (error) {
      console.error('Error sending booking link:', error);
      setToast({ message: 'Failed to send booking link to client', type: 'error' });
    }
  };

  const handleTransferSuccess = () => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data);
      });
  };

  const handleAssignTherapist = (client: Client) => {
    setPrefilledClientData({
      name: client.invitee_name,
      phone: client.invitee_phone,
      email: client.invitee_email
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">All Clients</h1>
          <p className="text-gray-600">View Client Details, Sessions and more...</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6">
        <button
          onClick={() => {
            setActiveTab('clients');
            setCurrentPage(1);
          }}
          className={`pb-2 font-medium ${
            activeTab === 'clients'
              ? 'text-teal-700 border-b-2 border-teal-700'
              : 'text-gray-400'
          }`}
        >
          Clients
        </button>
        <button
          onClick={() => {
            setActiveTab('pretherapy');
            setCurrentPage(1);
          }}
          className={`pb-2 font-medium ${
            activeTab === 'pretherapy'
              ? 'text-teal-700 border-b-2 border-teal-700'
              : 'text-gray-400'
          }`}
        >
          Pre-Therapy
        </button>
        <button
          onClick={() => {
            setActiveTab('leads');
            setCurrentPage(1);
          }}
          className={`pb-2 font-medium ${
            activeTab === 'leads'
              ? 'text-teal-700 border-b-2 border-teal-700'
              : 'text-gray-400'
          }`}
        >
          Leads
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users by name, phone no, email id or therapist..."
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

      {/* Clients Table */}
      {loading ? (
        <Loader />
      ) : (
      <div className="bg-white rounded-lg border flex-1 flex flex-col" ref={tableRef}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Contact Info</th>
                {activeTab === 'clients' && (
                  <>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">No. of Bookings</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Last Session Booked</th>
                  </>
                )}
                {activeTab === 'pretherapy' && (
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Pre-therapy Date</th>
                )}
                {activeTab !== 'pretherapy' && (
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Assigned Therapist</th>
                )}
                {activeTab === 'leads' && (
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Booking Link Sent</th>
                )}
                {(activeTab === 'pretherapy' || activeTab === 'leads') && (
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'pretherapy' ? 4 : activeTab === 'leads' ? 6 : 7} className="text-center text-gray-400 py-8">
                    Loading...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pretherapy' ? 4 : activeTab === 'leads' ? 6 : 7} className="text-center text-gray-400 py-8">
                    No {activeTab === 'clients' ? 'clients' : activeTab === 'pretherapy' ? 'pre-therapy clients' : 'leads'} found
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client, index) => (
                  <React.Fragment key={index}>
                    <tr 
                      className={`border-b hover:bg-gray-50 ${activeTab === 'clients' ? 'cursor-pointer' : ''}`}
                      onClick={activeTab === 'clients' ? () => toggleRow(index) : undefined}
                    >
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onClientClick) {
                                  onClientClick({
                                    invitee_name: client.invitee_name,
                                    invitee_email: client.invitee_email,
                                    invitee_phone: client.invitee_phone
                                  });
                                }
                              }}
                              className="text-teal-700 hover:underline font-medium"
                            >
                              {formatClientName(client.invitee_name)}
                            </button>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>{client.invitee_phone}</div>
                        <div className="text-gray-500 text-xs">{client.invitee_email}</div>
                      </td>
                      {activeTab === 'clients' && (
                        <>
                          <td className="px-6 py-4 text-sm">{client.session_count}</td>
                          <td className="px-6 py-4 text-sm">{formatSessionName(client.booking_resource_name, client.booking_host_name)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {client.last_session_date ? formatDate(client.last_session_date) : 'N/A'}
                          </td>
                        </>
                      )}
                      {activeTab === 'pretherapy' && (
                        <td className="px-6 py-4 text-sm">{formatPreTherapyDate(client.latest_booking_date)}</td>
                      )}
                      {activeTab !== 'pretherapy' && (
                        <td className="px-6 py-4 text-sm">
                          {standardizeTherapistName(client.booking_host_name)}
                        </td>
                      )}
                      {activeTab === 'leads' && (
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatBookingLinkDate(client.booking_link_sent_at)}
                        </td>
                      )}
                      {activeTab === 'pretherapy' && (
                        <td className="px-6 py-4 text-sm">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleAssignTherapist(client)}
                              className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
                            >
                              <Plus size={16} />
                              Assign a Therapist
                            </button>
                          </div>
                        </td>
                      )}
                      {activeTab === 'leads' && (
                        <td className="px-6 py-4 text-sm">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleSendBookingLink(client)}
                              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              <Send size={16} />
                              Send Booking Link
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    
                    {/* Expanded Actions Row - Only for Clients tab */}
                    {activeTab === 'clients' && expandedRows.has(index) && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="flex gap-4 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendBookingLink(client);
                              }}
                              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              <Send size={16} />
                              Send Booking Link
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTransferClick(client);
                              }}
                              disabled={isTransferDisabled(client)}
                              className={`flex items-center gap-1 text-sm font-medium ${
                                isTransferDisabled(client)
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-orange-600 hover:text-orange-700'
                              }`}
                            >
                              <ArrowRightLeft size={16} />
                              Transfer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {/* Multi-therapist rows */}
                    {expandedRows.has(index) && client.therapists && client.therapists.length > 1 && (
                      client.therapists.map((therapist, tIndex) => (
                        <tr key={`${index}-${tIndex}`} className="bg-gray-50 border-b">
                          <td className="px-6 py-4 text-sm pl-16 text-gray-600">{therapist.invitee_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div>{therapist.invitee_phone}</div>
                            <div className="text-gray-400 text-xs">{client.invitee_email}</div>
                          </td>
                          {activeTab === 'clients' && (
                            <>
                              <td className="px-6 py-4 text-sm text-gray-600">{therapist.session_count}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{therapist.booking_host_name}</td>
                            </>
                          )}
                          {activeTab === 'pretherapy' && (
                            <td className="px-6 py-4 text-sm text-gray-600"></td>
                          )}
                          {(activeTab === 'clients' || activeTab === 'pretherapy') && <td></td>}
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
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
      <TransferClientModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        client={selectedClient}
        onTransferSuccess={handleTransferSuccess}
        adminUser={adminUser}
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
