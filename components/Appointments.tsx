import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Download, Copy, Send, FileText } from 'lucide-react';
import { SendBookingModal } from './SendBookingModal';
import { Toast } from './Toast';
import { Loader } from './Loader';

interface Appointment {
  booking_id?: number;
  booking_start_at: string;
  booking_start_at_raw?: string;
  booking_resource_name: string;
  invitee_name: string;
  invitee_phone: string;
  invitee_email: string;
  booking_host_name: string;
  booking_mode: string;
  booking_joining_link?: string;
  booking_checkin_url?: string;
  has_session_notes?: boolean;
  therapist_id?: string;
  session_status?: string;
  paperform_link?: string;
  booking_status?: string;
}

export const Appointments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const itemsPerPage = 10;
  const appointmentActionsRef = React.useRef<HTMLTableElement>(null);

  const tabs = [
    { id: 'all', label: 'All Appointments' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'completed', label: 'Completed' },
    { id: 'pending_notes', label: 'Pending Notes' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'no_show', label: 'No Show' },
  ];

  useEffect(() => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        console.log('Appointments data:', data);
        setAppointments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (appointmentActionsRef.current && !appointmentActionsRef.current.contains(event.target as Node)) {
        setSelectedRowIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  const copyAppointmentDetails = (apt: Appointment) => {
    const details = `${apt.booking_resource_name}
${apt.booking_start_at}
Time zone: Asia/Kolkata
${apt.booking_mode} joining info${apt.booking_joining_link ? `\nVideo call link: ${apt.booking_joining_link}` : ''}`;
    
    navigator.clipboard.writeText(details).then(() => {
      setToast({ message: 'Appointment details copied to clipboard!', type: 'success' });
    }).catch(err => {
      console.error('Failed to copy:', err);
      setToast({ message: 'Failed to copy details', type: 'error' });
    });
  };

  const isMeetingEnded = (apt: Appointment) => {
    if (apt.booking_start_at_raw) {
      return new Date(apt.booking_start_at_raw) < new Date();
    }
    const timeMatch = apt.booking_start_at?.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) IST/);
    if (timeMatch) {
      const [, dateStr, , endTimeStr] = timeMatch;
      const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
      return new Date() > endDateTime;
    }
    return false;
  };

  const handleReminderClick = (apt: Appointment) => {
    if (isMeetingEnded(apt)) {
      setToast({ message: 'Cannot send reminder after meeting has ended', type: 'error' });
      return;
    }
    
    setSelectedAppointment(apt);
    setShowReminderModal(true);
  };

  const sendWhatsAppNotification = async () => {
    if (!selectedAppointment) return;
    
    const webhookData = {
      sessionTimings: selectedAppointment.booking_start_at,
      sessionName: selectedAppointment.booking_resource_name,
      clientName: selectedAppointment.invitee_name,
      phone: selectedAppointment.invitee_phone,
      email: selectedAppointment.invitee_email,
      therapistName: selectedAppointment.booking_host_name,
      mode: selectedAppointment.booking_mode,
      meetingLink: selectedAppointment.booking_joining_link || '',
      checkinUrl: selectedAppointment.booking_checkin_url || ''
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
      console.error('Error sending notification:', err);
      setToast({ message: 'Failed to send WhatsApp notification', type: 'error' });
    }
    setShowReminderModal(false);
    setSelectedAppointment(null);
  };

  const handleSessionNotesReminder = async (apt: Appointment) => {
    console.log('Full appointment object:', apt);
    console.log('Therapist ID:', apt.therapist_id);
    
    if (!isMeetingEnded(apt)) {
      setToast({ message: 'Cannot send reminder before meeting ends', type: 'error' });
      return;
    }
    
    if (apt.has_session_notes) {
      setToast({ message: 'Session notes already filled for this appointment', type: 'error' });
      return;
    }

    const webhookData = {
      bookingId: apt.booking_id,
      therapistId: apt.therapist_id,
      therapistName: apt.booking_host_name,
      clientName: apt.invitee_name,
      sessionName: apt.booking_resource_name,
      sessionTimings: apt.booking_start_at
    };

    console.log('Session notes reminder data:', webhookData);

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
      console.error('Error sending reminder:', err);
      setToast({ message: 'Failed to send reminder', type: 'error' });
    }
  };

  const getAppointmentStatus = (apt: Appointment) => {
    if (apt.booking_status === 'cancelled') return 'cancelled';
    if (apt.booking_status === 'no_show') return 'no_show';
    if (apt.has_session_notes) return 'completed';
    
    if (apt.booking_start_at_raw) {
      const sessionDate = new Date(apt.booking_start_at_raw);
      if (sessionDate < new Date() && !apt.has_session_notes) return 'pending_notes';
    }
    
    return 'scheduled';
  };

  const filteredAppointments = appointments.filter(apt => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      apt.booking_resource_name.toLowerCase().includes(query) ||
      apt.invitee_name.toLowerCase().includes(query) ||
      apt.booking_host_name.toLowerCase().includes(query)
    );
    
    if (!matchesSearch) return false;
    if (activeTab === 'all') return true;
    
    return getAppointmentStatus(apt) === activeTab;
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

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

      {/* Tabs */}
      <div className="flex gap-6 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
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
      {loading ? (
        <Loader />
      ) : (
      <div className="bg-white rounded-lg border flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full" ref={appointmentActionsRef}>
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Timings</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Contact Info</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Therapist Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Mode</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    Loading...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    No appointments found
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((apt, index) => (
                  <React.Fragment key={index}>
                    <tr 
                      className={`border-b cursor-pointer transition-colors ${
                        selectedRowIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRowIndex(selectedRowIndex === index ? null : index)}
                    >
                      <td className="px-6 py-4 text-sm">{apt.booking_start_at}</td>
                      <td className="px-6 py-4 text-sm">{apt.booking_resource_name}</td>
                      <td className="px-6 py-4 text-sm">{apt.invitee_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>{apt.invitee_phone}</div>
                        <div className="text-gray-500 text-xs">{apt.invitee_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">{apt.booking_host_name}</td>
                      <td className="px-6 py-4 text-sm">{apt.booking_mode}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          getAppointmentStatus(apt) === 'completed' ? 'bg-green-100 text-green-700' :
                          getAppointmentStatus(apt) === 'cancelled' ? 'bg-red-100 text-red-700' :
                          getAppointmentStatus(apt) === 'no_show' ? 'bg-orange-100 text-orange-700' :
                          getAppointmentStatus(apt) === 'pending_notes' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {getAppointmentStatus(apt) === 'pending_notes' ? 'Pending Notes' :
                           getAppointmentStatus(apt) === 'no_show' ? 'No Show' :
                           getAppointmentStatus(apt).charAt(0).toUpperCase() + getAppointmentStatus(apt).slice(1)}
                        </span>
                      </td>
                    </tr>
                    {selectedRowIndex === index && (
                      <tr className="bg-gray-100">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => copyAppointmentDetails(apt)}
                              className="px-6 py-2 border border-gray-400 rounded-lg text-sm text-gray-700 hover:bg-white flex items-center gap-2"
                            >
                              <Copy size={16} />
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
                              <Send size={16} />
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
                              <FileText size={16} />
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
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}</span>
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
      <SendBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {showReminderModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Sending Manual Reminder</h3>
            <p className="text-gray-600 mb-4">This will send a reminder message to {selectedAppointment.invitee_name} on Whatsapp</p>
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
                  setSelectedAppointment(null);
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
};
