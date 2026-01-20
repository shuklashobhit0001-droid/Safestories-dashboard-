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
  booking_host_name?: string;
  booking_status?: string;
  has_session_notes?: boolean;
  booking_start_at_raw?: string;
}

export const AllTherapists: React.FC<{ selectedClientProp?: any; onBack?: () => void }> = ({ selectedClientProp, onBack }) => {
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
  const [expandedClientRows, setExpandedClientRows] = useState<Set<number>>(new Set());
  const [clientAppointmentTab, setClientAppointmentTab] = useState('upcoming');
  const [selectedAppointmentIndex, setSelectedAppointmentIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedAppointmentForReminder, setSelectedAppointmentForReminder] = useState<Appointment | null>(null);
  const appointmentActionsRef = React.useRef<HTMLTableElement>(null);

  useEffect(() => {
    fetchTherapists();
    if (selectedClientProp) {
      openClientDetails(selectedClientProp);
    }
  }, [selectedClientProp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (appointmentActionsRef.current && !appointmentActionsRef.current.contains(event.target as Node)) {
        setSelectedAppointmentIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      
      // Group clients by email OR phone
      const clientMap = new Map();
      const emailToKey = new Map();
      const phoneToKey = new Map();
      
      (data.clients || []).forEach((client: Client) => {
        let key = null;
        
        if (client.invitee_email && emailToKey.has(client.invitee_email)) {
          key = emailToKey.get(client.invitee_email);
        } else if (client.invitee_phone && phoneToKey.has(client.invitee_phone)) {
          key = phoneToKey.get(client.invitee_phone);
        } else {
          key = `client-${clientMap.size}`;
        }
        
        if (client.invitee_email) emailToKey.set(client.invitee_email, key);
        if (client.invitee_phone) phoneToKey.set(client.invitee_phone, key);
        
        if (!clientMap.has(key)) {
          clientMap.set(key, {
            invitee_name: client.invitee_name,
            invitee_email: client.invitee_email,
            invitee_phone: client.invitee_phone,
            phoneNumbers: []
          });
        }
        
        const groupedClient = clientMap.get(key);
        if (!groupedClient.invitee_email && client.invitee_email) {
          groupedClient.invitee_email = client.invitee_email;
        }
        
        if (client.invitee_phone && !groupedClient.phoneNumbers.some((p: string) => p === client.invitee_phone)) {
          groupedClient.phoneNumbers.push(client.invitee_phone);
        }
      });
      
      const groupedClients = Array.from(clientMap.values()).map(client => ({
        ...client,
        invitee_phone: client.phoneNumbers.join(', ')
      }));
      
      setClients(groupedClients);
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
    setExpandedClientRows(new Set());
  };

  const toggleClientRow = (index: number) => {
    const newExpanded = new Set(expandedClientRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedClientRows(newExpanded);
  };

  const openClientDetails = async (client: any) => {
    console.log('Opening client details for:', client);
    
    const normalizedClient = {
      invitee_name: client.invitee_name || client.client_name || 'Unknown',
      invitee_email: client.invitee_email || '',
      invitee_phone: client.invitee_phone || ''
    };
    
    console.log('Normalized client:', normalizedClient);
    setSelectedClient(normalizedClient);
    
    if (!normalizedClient.invitee_email && !normalizedClient.invitee_phone) {
      console.log('No email or phone, skipping API call');
      setClientAppointments([]);
      return;
    }
    
    setClientDetailsLoading(true);
    try {
      const params = new URLSearchParams();
      if (normalizedClient.invitee_email) params.append('email', normalizedClient.invitee_email);
      if (normalizedClient.invitee_phone) params.append('phone', normalizedClient.invitee_phone);
      
      console.log('Fetching with params:', params.toString());
      const response = await fetch(`/api/client-details?${params.toString()}`);
      const data = await response.json();
      console.log('Client details response:', data);
      
      const appointmentsWithStatus = (data.appointments || []).map((apt: any) => {
        let status = apt.booking_status || 'confirmed';
        const now = new Date();
        const sessionDate = apt.booking_start_at_raw ? new Date(apt.booking_start_at_raw) : new Date();
        
        if (status !== 'cancelled' && status !== 'no_show') {
          if (apt.has_session_notes) {
            status = 'completed';
          } else if (sessionDate < now) {
            status = 'pending_notes';
          } else {
            status = 'scheduled';
          }
        }
        
        return { ...apt, booking_status: status };
      });
      
      setClientAppointments(appointmentsWithStatus);
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setClientDetailsLoading(false);
    }
  };

  const closeClientDetails = () => {
    setSelectedClient(null);
    setClientAppointments([]);
    if (onBack) {
      onBack();
    }
  };

  const copyAppointmentDetails = (apt: Appointment) => {
    const details = `${apt.booking_resource_name}\n${apt.booking_invitee_time}\nTime zone: Asia/Kolkata\n${apt.booking_host_name ? 'Therapist: ' + apt.booking_host_name : ''}`;
    navigator.clipboard.writeText(details).then(() => {
      setToast({ message: 'Appointment details copied to clipboard!', type: 'success' });
    }).catch(() => {
      setToast({ message: 'Failed to copy details', type: 'error' });
    });
  };

  const isMeetingEnded = (apt: Appointment) => {
    if (apt.booking_start_at_raw) {
      return new Date(apt.booking_start_at_raw) < new Date();
    }
    return false;
  };

  const handleReminderClick = async (apt: Appointment) => {
    if (isMeetingEnded(apt)) {
      setToast({ message: 'Cannot send reminder after meeting has ended', type: 'error' });
      return;
    }
    
    setSelectedAppointmentForReminder(apt);
    setShowReminderModal(true);
  };

  const sendWhatsAppNotification = async () => {
    if (!selectedAppointmentForReminder || !selectedClient) return;
    
    const webhookData = {
      sessionTimings: selectedAppointmentForReminder.booking_invitee_time,
      sessionName: selectedAppointmentForReminder.booking_resource_name,
      clientName: selectedClient.invitee_name,
      phone: selectedClient.invitee_phone,
      email: selectedClient.invitee_email,
      therapistName: selectedAppointmentForReminder.booking_host_name || selectedTherapist?.name,
      mode: 'Online',
      meetingLink: '',
      checkinUrl: ''
    };

    try {
      const response = await fetch('https://n8n.srv1169280.hstgr.cloud/webhook/0d1db363-bf04-41e5-a667-a9fe1b5ffc83', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        setToast({ message: 'WhatsApp notification sent successfully!', type: 'success' });
      } else {
        setToast({ message: 'Failed to send WhatsApp notification', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to send WhatsApp notification', type: 'error' });
    }
    setShowReminderModal(false);
    setSelectedAppointmentForReminder(null);
  };

  const handleSessionNotesReminder = async (apt: Appointment) => {
    if (!isMeetingEnded(apt)) {
      setToast({ message: 'Cannot send reminder before meeting ends', type: 'error' });
      return;
    }
    
    if (apt.has_session_notes) {
      setToast({ message: 'Session notes already filled for this appointment', type: 'error' });
      return;
    }

    const webhookData = {
      therapistName: apt.booking_host_name || selectedTherapist?.name,
      clientName: selectedClient?.invitee_name,
      sessionName: apt.booking_resource_name,
      sessionTimings: apt.booking_invitee_time
    };

    try {
      const response = await fetch('https://n8n.srv1169280.hstgr.cloud/webhook/fd13ea75-06b4-49e5-8188-75a88a9aaade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        setToast({ message: 'Reminder sent to therapist to fill session notes', type: 'success' });
      } else {
        setToast({ message: 'Failed to send reminder', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to send reminder', type: 'error' });
    }
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
            <div className="flex gap-6 mb-4">
              {[
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'all', label: 'All Appointments' },
                { id: 'completed', label: 'Completed' },
                { id: 'pending_notes', label: 'Pending Notes' },
                { id: 'cancelled', label: 'Cancelled' },
                { id: 'no_show', label: 'No Show' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setClientAppointmentTab(tab.id)}
                  className={`pb-2 font-medium ${
                    clientAppointmentTab === tab.id
                      ? 'text-teal-700 border-b-2 border-teal-700'
                      : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <h3 className="text-lg font-semibold mb-3">
              Appointment History ({clientAppointments.filter(apt => {
                if (clientAppointmentTab === 'all') return true;
                if (clientAppointmentTab === 'upcoming') {
                  const sessionDate = apt.booking_start_at_raw ? new Date(apt.booking_start_at_raw) : new Date();
                  return sessionDate >= new Date() && apt.booking_status !== 'cancelled';
                }
                return apt.booking_status === clientAppointmentTab;
              }).length})
            </h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full" ref={appointmentActionsRef}>
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Session Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Date & Time</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Therapist</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clientAppointments.filter(apt => {
                    if (clientAppointmentTab === 'all') return true;
                    if (clientAppointmentTab === 'upcoming') {
                      const sessionDate = apt.booking_start_at_raw ? new Date(apt.booking_start_at_raw) : new Date();
                      return sessionDate >= new Date() && apt.booking_status !== 'cancelled';
                    }
                    return apt.booking_status === clientAppointmentTab;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-400 text-sm">No appointments found</td>
                    </tr>
                  ) : (
                    clientAppointments.filter(apt => {
                      if (clientAppointmentTab === 'all') return true;
                      if (clientAppointmentTab === 'upcoming') {
                        const sessionDate = apt.booking_start_at_raw ? new Date(apt.booking_start_at_raw) : new Date();
                        return sessionDate >= new Date() && apt.booking_status !== 'cancelled';
                      }
                      return apt.booking_status === clientAppointmentTab;
                    }).map((apt, index) => (
                      <React.Fragment key={index}>
                        <tr 
                          className={`border-b cursor-pointer transition-colors ${
                            selectedAppointmentIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedAppointmentIndex(selectedAppointmentIndex === index ? null : index)}
                        >
                          <td className="px-4 py-3 text-sm">{apt.booking_resource_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{apt.booking_invitee_time}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{apt.booking_host_name || selectedTherapist?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              apt.booking_status === 'completed' ? 'bg-green-100 text-green-700' :
                              apt.booking_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              apt.booking_status === 'no_show' ? 'bg-orange-100 text-orange-700' :
                              apt.booking_status === 'pending_notes' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {apt.booking_status === 'pending_notes' ? 'Pending Notes' :
                               apt.booking_status === 'no_show' ? 'No Show' :
                               apt.booking_status === 'scheduled' ? 'Scheduled' :
                               apt.booking_status?.charAt(0).toUpperCase() + apt.booking_status?.slice(1)}
                            </span>
                          </td>
                        </tr>
                        {selectedAppointmentIndex === index && (
                          <tr className="bg-gray-100">
                            <td colSpan={4} className="px-4 py-4">
                              <div className="flex gap-3 justify-center">
                                <button
                                  onClick={() => copyAppointmentDetails(apt)}
                                  className="px-6 py-2 border border-gray-400 rounded-lg text-sm text-gray-700 hover:bg-white flex items-center gap-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                  Copy to Clipboard
                                </button>
                                <button
                                  onClick={() => handleReminderClick(apt)}
                                  disabled={isMeetingEnded(apt) || apt.booking_status === 'cancelled'}
                                  className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                    isMeetingEnded(apt) || apt.booking_status === 'cancelled'
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                      : 'border border-gray-400 text-gray-700 hover:bg-white'
                                  }`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                  Send Manual Reminder to Client
                                </button>
                                <button
                                  onClick={() => handleSessionNotesReminder(apt)}
                                  disabled={!isMeetingEnded(apt) || apt.has_session_notes || apt.booking_status === 'cancelled'}
                                  className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                    !isMeetingEnded(apt) || apt.has_session_notes || apt.booking_status === 'cancelled'
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                      : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                                  }`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                  Send Session Note Reminder to Therapist
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {toast && (
          <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 flex items-center gap-3 z-50">
            <div className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}
        {showReminderModal && selectedAppointmentForReminder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Sending Manual Reminder</h3>
              <p className="text-gray-600 mb-4">This will send a reminder message to {selectedClient?.invitee_name} on Whatsapp</p>
              <div className="flex gap-3">
                <button
                  onClick={sendWhatsAppNotification}
                  className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setShowReminderModal(false);
                    setSelectedAppointmentForReminder(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
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
                      clients.map((client, index) => {
                        const phoneNumbers = client.invitee_phone.split(', ');
                        const hasMultiplePhones = phoneNumbers.length > 1;
                        
                        return (
                          <React.Fragment key={index}>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  {hasMultiplePhones && (
                                    <button
                                      onClick={() => toggleClientRow(index)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      {expandedClientRows.has(index) ? '▼' : '▶'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openClientDetails(client)}
                                    className="text-teal-700 hover:underline font-medium text-left"
                                  >
                                    {client.invitee_name}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{client.invitee_email}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{phoneNumbers[0]}</td>
                            </tr>
                            {expandedClientRows.has(index) && hasMultiplePhones && (
                              phoneNumbers.slice(1).map((phone, pIndex) => (
                                <tr key={`${index}-${pIndex}`} className="bg-gray-50 border-b">
                                  <td className="px-4 py-3 text-sm pl-12 text-gray-600">{client.invitee_name}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{client.invitee_email}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{phone}</td>
                                </tr>
                              ))
                            )}
                          </React.Fragment>
                        );
                      })
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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Total sessions lifetime</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Sessions this month</th>
              </tr>
            </thead>
            <tbody>
              {filteredTherapists.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-20">
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
