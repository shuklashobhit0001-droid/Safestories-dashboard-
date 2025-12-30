import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Download, MoreVertical, Copy, Send } from 'lucide-react';
import { SendBookingModal } from './SendBookingModal';
import { Toast } from './Toast';

interface Appointment {
  booking_start_at: string;
  booking_resource_name: string;
  invitee_name: string;
  invitee_phone: string;
  invitee_email: string;
  booking_host_name: string;
  booking_mode: string;
  booking_joining_link?: string;
  booking_checkin_url?: string;
}

export const Appointments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

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

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuIndex !== null) {
        setOpenMenuIndex(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuIndex]);



  const toggleMenu = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuIndex === index) {
      setOpenMenuIndex(null);
      setMenuPosition(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setOpenMenuIndex(index);
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 192 + rect.width
      });
    }
  };

  const copyAppointmentDetails = (apt: Appointment) => {
    const details = `${apt.booking_resource_name}
${apt.booking_start_at}
Time zone: Asia/Kolkata
${apt.booking_mode} joining info${apt.booking_joining_link ? `\nVideo call link: ${apt.booking_joining_link}` : ''}`;
    
    navigator.clipboard.writeText(details).then(() => {
      setToast({ message: 'Appointment details copied to clipboard!', type: 'success' });
      setOpenMenuIndex(null);
    }).catch(err => {
      console.error('Failed to copy:', err);
      setToast({ message: 'Failed to copy details', type: 'error' });
    });
  };

  const sendWhatsAppNotification = async (apt: Appointment) => {
    console.log('Appointment data:', apt);
    console.log('booking_checkin_url:', apt.booking_checkin_url);
    
    const webhookData = {
      sessionTimings: apt.booking_start_at,
      sessionName: apt.booking_resource_name,
      clientName: apt.invitee_name,
      phone: apt.invitee_phone,
      email: apt.invitee_email,
      therapistName: apt.booking_host_name,
      mode: apt.booking_mode,
      meetingLink: apt.booking_joining_link || '',
      checkinUrl: apt.booking_checkin_url || ''
    };
    
    console.log('Webhook data being sent:', webhookData);

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
    setOpenMenuIndex(null);
  };

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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
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
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(index, e);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {openMenuIndex !== null && menuPosition && (
          <div 
            className="fixed w-48 bg-white border rounded-lg shadow-lg z-50"
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => copyAppointmentDetails(filteredAppointments[openMenuIndex])}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
            >
              <Copy size={16} />
              Copy
            </button>
            <button 
              onClick={() => sendWhatsAppNotification(filteredAppointments[openMenuIndex])}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
            >
              <Send size={16} />
              Send WhatsApp Notification
            </button>
          </div>
        )}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">Showing {filteredAppointments.length} of {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button className="p-2 border rounded hover:bg-gray-50">←</button>
            <button className="p-2 border rounded hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>
      <SendBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
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
