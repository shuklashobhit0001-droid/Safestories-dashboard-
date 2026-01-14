import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Calendar, LogOut, PieChart, ChevronUp, ChevronDown, ChevronRight, Copy, Send, Search, FileText, Bell, X, MoreVertical } from 'lucide-react';
import { Logo } from './Logo';
import { Notifications } from './Notifications';
import { Toast } from './Toast';
import { Loader } from './Loader';

interface TherapistDashboardProps {
  onLogout: () => void;
  user: any;
}

export const TherapistDashboard: React.FC<TherapistDashboardProps> = ({ onLogout, user }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('All Time');
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const monthOptions = ['Dec 2025', 'Nov 2025', 'Oct 2025', 'Sep 2025', 'Aug 2025', 'Jul 2025', 'Jun 2025', 'May 2025', 'Apr 2025', 'Mar 2025', 'Feb 2025', 'Jan 2025'];

  const [stats, setStats] = useState([
    { title: 'Sessions', value: '0', lastMonth: '0' },
    { title: 'No-shows', value: '0', lastMonth: '0' },
    { title: 'Cancelled', value: '0', lastMonth: '0' },
  ]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [selectedAppointmentIndex, setSelectedAppointmentIndex] = useState<number | null>(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosConfirmText, setSosConfirmText] = useState('');
  const [selectedSOSBooking, setSelectedSOSBooking] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [sessionNotesData, setSessionNotesData] = useState<any>(null);
  const [sessionNotesLoading, setSessionNotesLoading] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminderAppointment, setSelectedReminderAppointment] = useState<any>(null);
  const [activeAppointmentTab, setActiveAppointmentTab] = useState('all');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientDetailLoading, setClientDetailLoading] = useState(false);
  const [clientStats, setClientStats] = useState({ sessions: 0, noShows: 0, cancelled: 0 });
  const [clientAppointments, setClientAppointments] = useState<any[]>([]);
  const [clientDateRange, setClientDateRange] = useState({ start: '', end: '' });
  const [clientSelectedMonth, setClientSelectedMonth] = useState('All Time');
  const [isClientDateDropdownOpen, setIsClientDateDropdownOpen] = useState(false);
  const [showClientCustomCalendar, setShowClientCustomCalendar] = useState(false);
  const [clientStartDate, setClientStartDate] = useState('');
  const [clientEndDate, setClientEndDate] = useState('');
  const [selectedSessionNote, setSelectedSessionNote] = useState<any>(null);
  const [sessionNoteTab, setSessionNoteTab] = useState('notes');

  const resetAllStates = () => {
    setSelectedClient(null);
    setSelectedSessionNote(null);
    setSelectedAppointmentIndex(null);
    setOpenMenuIndex(null);
    setMenuPosition(null);
    setExpandedRows(new Set());
    setShowSOSModal(false);
    setShowReminderModal(false);
    setIsDateDropdownOpen(false);
    setShowCustomCalendar(false);
    setIsClientDateDropdownOpen(false);
    setShowClientCustomCalendar(false);
  };

  const appointmentTabs = [
    { id: 'all', label: 'All Appointments' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'completed', label: 'Completed' },
    { id: 'pending_notes', label: 'Pending Notes' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'no_show', label: 'No Show' },
  ];

  const handleClientMonthSelect = (month: string) => {
    setClientSelectedMonth(month);
    setIsClientDateDropdownOpen(false);
    setShowClientCustomCalendar(false);
    
    const [monthName, year] = month.split(' ');
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const monthNum = monthMap[monthName];
    const start = new Date(parseInt(year), monthNum, 1).toISOString().split('T')[0];
    const end = new Date(parseInt(year), monthNum + 1, 0).toISOString().split('T')[0];
    
    setClientDateRange({ start, end });
  };

  const handleClientCustomDateApply = () => {
    if (clientStartDate && clientEndDate) {
      setClientDateRange({ start: clientStartDate, end: clientEndDate });
      setClientSelectedMonth(`${clientStartDate} to ${clientEndDate}`);
      setShowClientCustomCalendar(false);
      setIsClientDateDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      fetchClientDetails(selectedClient);
    }
  }, [clientDateRange]);

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setIsDateDropdownOpen(false);
    setShowCustomCalendar(false);
    
    const [monthName, year] = month.split(' ');
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const monthNum = monthMap[monthName];
    const start = new Date(parseInt(year), monthNum, 1).toISOString().split('T')[0];
    const end = new Date(parseInt(year), monthNum + 1, 0).toISOString().split('T')[0];
    
    setDateRange({ start, end });
  };

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      setDateRange({ start: startDate, end: endDate });
      setSelectedMonth(`${startDate} to ${endDate}`);
      setShowCustomCalendar(false);
      setIsDateDropdownOpen(false);
    }
  };

  useEffect(() => {
    fetchTherapistData();
  }, [dateRange, user.id]);

  useEffect(() => {
    if (activeView === 'clients') {
      fetchClientsData();
    } else if (activeView === 'appointments') {
      fetchAppointmentsData();
    }
  }, [activeView]);

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

  const fetchAppointmentsData = async () => {
    try {
      setAppointmentsLoading(true);
      const response = await fetch(`/api/therapist-appointments?therapist_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Therapist appointments API response:', data);
        console.log('First appointment:', JSON.stringify(data.appointments[0], null, 2));
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments data:', error);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchClientsData = async () => {
    try {
      setClientsLoading(true);
      const response = await fetch(`/api/therapist-clients?therapist_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('=== RAW API RESPONSE ===');
        console.log('Number of clients:', data.clients?.length);
        console.log('Full data:', JSON.stringify(data, null, 2));
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients data:', error);
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchClientDetails = async (client: any) => {
    try {
      setClientDetailLoading(true);
      const response = await fetch(`/api/client-appointments?client_phone=${encodeURIComponent(client.client_phone)}&therapist_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        let filteredAppointments = data.appointments || [];
        
        if (clientDateRange.start && clientDateRange.end) {
          filteredAppointments = filteredAppointments.filter((apt: any) => {
            const aptDate = new Date(apt.booking_date);
            const startDate = new Date(clientDateRange.start);
            const endDate = new Date(clientDateRange.end + 'T23:59:59');
            return aptDate >= startDate && aptDate <= endDate;
          });
        }
        
        setClientAppointments(filteredAppointments);
        const sessions = filteredAppointments.length;
        const noShows = filteredAppointments.filter((a: any) => a.booking_status === 'no_show').length;
        const cancelled = filteredAppointments.filter((a: any) => a.booking_status === 'cancelled').length;
        setClientStats({ sessions, noShows, cancelled });
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setClientDetailLoading(false);
    }
  };

  const fetchTherapistData = async () => {
    try {
      setDashboardLoading(true);
      // Fetch therapist-specific stats and bookings
      const statsUrl = dateRange.start && dateRange.end 
        ? `/api/therapist-stats?therapist_id=${user.id}&start=${dateRange.start}&end=${dateRange.end}`
        : `/api/therapist-stats?therapist_id=${user.id}`;
      
      const response = await fetch(statsUrl);
      if (response.ok) {
        const data = await response.json();
        
        setStats([
          { title: 'Sessions', value: (data.stats.sessions || 0).toString(), lastMonth: '0' },
          { title: 'No-shows', value: (data.stats.noShows || 0).toString(), lastMonth: '0' },
          { title: 'Cancelled', value: (data.stats.cancelled || 0).toString(), lastMonth: '0' },
        ]);
        
        setBookings(data.upcomingBookings || []);

        const notificationsRes = await fetch(`/api/notifications?user_id=${user.id}&user_role=therapist`);
        if (notificationsRes.ok) {
          const notificationsData = await notificationsRes.json();
          setNotifications(notificationsData.slice(0, 2));
        }
      } else {
        // Fallback to empty data
        setStats([
          { title: 'Sessions', value: '0', lastMonth: '0' },
          { title: 'No-shows', value: '0', lastMonth: '0' },
          { title: 'Cancelled', value: '0', lastMonth: '0' },
        ]);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching therapist data:', error);
      // Fallback to empty data
      setStats([
        { title: 'Sessions', value: '0', lastMonth: '0' },
        { title: 'No-shows', value: '0', lastMonth: '0' },
        { title: 'Cancelled', value: '0', lastMonth: '0' },
      ]);
      setBookings([]);
    } finally {
      setDashboardLoading(false);
    }
  };

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

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

  const copyAppointmentDetails = async (apt: any) => {
    const details = `${apt.session_name || apt.therapy_type}\n${apt.session_timings}\nClient: ${apt.client_name}\nContact: ${apt.contact_info || 'N/A'}\nMode: ${apt.mode}`;
    navigator.clipboard.writeText(details).then(async () => {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapist_id: user.therapist_id,
          therapist_name: user.username,
          action_type: 'copy_appointment',
          action_description: `${user.username} copied appointment details`,
          client_name: apt.client_name
        })
      });
      setToast({ message: 'Appointment details copied to clipboard!', type: 'success' });
      setSelectedAppointmentIndex(null);
    }).catch(err => {
      console.error('Failed to copy:', err);
      setToast({ message: 'Failed to copy details', type: 'error' });
    });
  };

  const isMeetingEnded = (apt: any) => {
    const timeMatch = apt.session_timings?.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) IST/);
    if (timeMatch) {
      const [, dateStr, , endTimeStr] = timeMatch;
      const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
      return new Date() > endDateTime;
    }
    return false;
  };

  const handleReminderClick = (apt: any) => {
    setSelectedReminderAppointment(apt);
    setShowReminderModal(true);
    setSelectedAppointmentIndex(null);
  };

  const sendWhatsAppNotification = async () => {
    if (!selectedReminderAppointment) return;

    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapist_id: user.therapist_id,
        therapist_name: user.username,
        action_type: 'send_whatsapp',
        action_description: `${user.username} sent WhatsApp notification`,
        client_name: selectedReminderAppointment.client_name
      })
    });
    
    setToast({ message: 'WhatsApp notification sent successfully!', type: 'success' });
    setShowReminderModal(false);
    setSelectedReminderAppointment(null);
  };

  const handleSOSClick = (booking: any) => {
    console.log('=== SOS BUTTON CLICKED ===');
    console.log('Booking:', booking);
    console.log('Session timings:', booking.session_timings);
    
    const timeMatch = booking.session_timings?.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) IST/);
    if (timeMatch) {
      const [, dateStr, startTimeStr, endTimeStr] = timeMatch;
      const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
      const startDateTime = new Date(`${dateStr} ${startTimeStr}`);
      const now = new Date();
      const hoursSinceEnd = (now.getTime() - endDateTime.getTime()) / (1000 * 60 * 60);
      
      console.log('Start date time:', endDateTime);
      console.log('Current time:', now);
      console.log('End date time:', endDateTime);
      console.log('Hours since end:', hoursSinceEnd);
      
      if (now < startDateTime) {
        console.log('❌ Session has not started yet');
        setToast({ message: 'SOS ticket can only be raised after the session starts', type: 'error' });
        setSelectedAppointmentIndex(null);
        return;
      }
      
      if (hoursSinceEnd > 24) {
        console.log('❌ More than 24 hours since session ended');
        setToast({ message: 'SOS ticket can only be raised within 24 hours of session end', type: 'error' });
        setSelectedAppointmentIndex(null);
        return;
      }
      
      console.log('✓ All checks passed, showing modal');
    }
    
    setSelectedSOSBooking(booking);
    setShowSOSModal(true);
    setSelectedAppointmentIndex(null);
  };

  const handleSOSConfirm = async () => {
    if (sosConfirmText === 'Confirm') {
      console.log('=== SOS TICKET DATA ===');
      console.log('Selected booking:', selectedSOSBooking);
      
      const webhookData = {
        therapist_id: user.therapist_id,
        therapist_name: user.username,
        client_name: selectedSOSBooking?.client_name,
        session_name: selectedSOSBooking?.session_name || selectedSOSBooking?.therapy_type,
        session_timings: selectedSOSBooking?.session_timings,
        contact_info: selectedSOSBooking?.contact_info,
        mode: selectedSOSBooking?.mode,
        booking_id: selectedSOSBooking?.booking_id,
        timestamp: new Date().toISOString()
      };
      
      console.log('Webhook data:', webhookData);
      console.log('Webhook URL:', 'https://n8n.srv1169280.hstgr.cloud/webhook/3e725c04-ed19-4967-8a05-c0a1e8c8441d');
      
      // Send to n8n webhook
      try {
        const response = await fetch('https://n8n.srv1169280.hstgr.cloud/webhook/3e725c04-ed19-4967-8a05-c0a1e8c8441d', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        
        console.log('Webhook response status:', response.status);
        console.log('Webhook response ok:', response.ok);
        
        if (response.ok) {
          console.log('✓ Webhook sent successfully');
        } else {
          console.error('✗ Webhook failed:', await response.text());
        }
      } catch (error) {
        console.error('✗ Webhook error:', error);
      }
      
      // Create audit log
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapist_id: user.therapist_id,
          therapist_name: user.username,
          action_type: 'raise_sos',
          action_description: `${user.username} raised SOS ticket`,
          client_name: selectedSOSBooking?.client_name
        })
      });
      
      // Notify all admins
      await fetch('/api/notifications/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_type: 'sos_ticket',
          title: 'SOS Ticket Raised',
          message: `${user.username} raised an SOS ticket for client ${selectedSOSBooking?.client_name}`,
          related_id: selectedSOSBooking?.booking_id
        })
      });
      
      console.log('✓ Audit log created');
      console.log('======================');
      
      setToast({ message: 'SOS ticket raised successfully!', type: 'success' });
      setShowSOSModal(false);
      setSosConfirmText('');
      setSelectedSOSBooking(null);
    }
  };

  const handleFillSessionNotes = (appointment: any) => {
    console.log('Fill session notes for:', appointment);
    setSelectedAppointmentIndex(null);
  };

  const handleViewSessionNotes = async (appointment: any) => {
    console.log('View session notes for booking_id:', appointment.booking_id);
    setSessionNotesLoading(true);
    setSelectedAppointmentIndex(null);
    
    try {
      const response = await fetch(`/api/session-notes?booking_id=${appointment.booking_id}`);
      if (response.ok) {
        const data = await response.json();
        setSessionNotesData(data);
      } else {
        setSessionNotesData({ error: 'Session notes not found for this appointment' });
      }
    } catch (error) {
      console.error('Error fetching session notes:', error);
      setSessionNotesData({ error: 'Failed to load session notes' });
    } finally {
      setSessionNotesLoading(false);
    }
  };

  const renderMyClients = () => {
    const filteredClients = clients.filter(client => 
      searchTerm === '' || 
      client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_phone.includes(searchTerm)
    );
    
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

    return (
    <div className="p-8">
      {clientsLoading ? (
        <Loader />
      ) : (
      <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Clients</h1>
          <p className="text-gray-600">View Client Details, Sessions and more...</p>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users by name, phone no or email id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Phone No.</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">No. of Sessions</th>
              </tr>
            </thead>
            <tbody>
              {clientsLoading ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">
                    Loading...
                  </td>
                </tr>
              ) : paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">
                    No clients found
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client, index) => (
                    <React.Fragment key={index}>
                      <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => {
                        setSelectedClient(client);
                        fetchClientDetails(client);
                      }}>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            {client.therapists && client.therapists.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(index);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {expandedRows.has(index) ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </button>
                            )}
                            <span>{client.client_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{client.client_phone}</td>
                        <td className="px-6 py-4 text-sm">{client.client_email}</td>
                        <td className="px-6 py-4 text-sm">{client.total_sessions}</td>
                      </tr>
                      {expandedRows.has(index) && client.therapists && client.therapists.length > 1 && (
                        client.therapists.map((therapist: any, tIndex: number) => (
                          <tr key={`${index}-${tIndex}`} className="bg-gray-50 border-b">
                            <td className="px-6 py-4 text-sm pl-16 text-gray-600">{therapist.client_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{therapist.client_phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{client.client_email}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{therapist.total_sessions}</td>
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
      </>
      )}
    </div>
  );
  };

  const getAppointmentStatus = (apt: any) => {
    if (apt.booking_status === 'cancelled') return 'cancelled';
    if (apt.booking_status === 'no_show') return 'no_show';
    if (apt.has_session_notes) return 'completed';
    
    if (apt.session_timings) {
      const timeMatch = apt.session_timings.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) IST/);
      if (timeMatch) {
        const [, dateStr, , endTimeStr] = timeMatch;
        const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
        if (endDateTime < new Date() && !apt.has_session_notes) return 'pending_notes';
      }
    }
    
    return 'scheduled';
  };

  const renderMyAppointments = () => (
    <div className="p-8">
      {appointmentsLoading ? (
        <Loader />
      ) : (
      <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Appointments</h1>
          <p className="text-gray-600">View Recently Book Session, Send invite and more...</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-6 mb-6">
        {appointmentTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAppointmentTab(tab.id)}
            className={`pb-2 font-medium ${
              activeAppointmentTab === tab.id
                ? 'text-teal-700 border-b-2 border-teal-700'
                : 'text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search appointments by session, client or therapist name..."
            value={appointmentSearchTerm}
            onChange={(e) => setAppointmentSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Timings</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Contact Info</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Mode</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointmentsLoading ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    Loading...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    No appointments found
                  </td>
                </tr>
              ) : (
                appointments
                  .filter(appointment => {
                    const matchesSearch = appointmentSearchTerm === '' || 
                      appointment.session_name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
                      appointment.client_name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
                      (user.full_name || user.username).toLowerCase().includes(appointmentSearchTerm.toLowerCase());
                    
                    if (!matchesSearch) return false;
                    if (activeAppointmentTab === 'all') return true;
                    
                    return getAppointmentStatus(appointment) === activeAppointmentTab;
                  })
                  .map((appointment, index, filteredArray) => (
                    <React.Fragment key={index}>
                      <tr 
                        className={`border-b cursor-pointer transition-colors ${
                          selectedAppointmentIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedAppointmentIndex(selectedAppointmentIndex === index ? null : index)}
                      >
                        <td className="px-6 py-4 text-sm">{appointment.session_timings}</td>
                        <td className="px-6 py-4 text-sm">{appointment.session_name}</td>
                        <td className="px-6 py-4 text-sm">{appointment.client_name}</td>
                        <td className="px-6 py-4 text-sm">{appointment.contact_info}</td>
                        <td className="px-6 py-4 text-sm">
                          {appointment.mode?.includes('_') 
                            ? appointment.mode.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                            : appointment.mode || 'Google Meet'
                          }
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            getAppointmentStatus(appointment) === 'completed' ? 'bg-green-100 text-green-700' :
                            getAppointmentStatus(appointment) === 'cancelled' ? 'bg-red-100 text-red-700' :
                            getAppointmentStatus(appointment) === 'no_show' ? 'bg-orange-100 text-orange-700' :
                            getAppointmentStatus(appointment) === 'pending_notes' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {getAppointmentStatus(appointment) === 'pending_notes' ? 'Pending Notes' :
                             getAppointmentStatus(appointment) === 'no_show' ? 'No Show' :
                             getAppointmentStatus(appointment).charAt(0).toUpperCase() + getAppointmentStatus(appointment).slice(1)}
                          </span>
                        </td>
                      </tr>
                      {selectedAppointmentIndex === index && (
                        <tr className="bg-gray-100">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={() => copyAppointmentDetails(appointment)}
                                className="px-6 py-2 border border-gray-400 rounded-lg text-sm text-gray-700 hover:bg-white flex items-center gap-2"
                              >
                                <Copy size={16} />
                                Copy to Clipboard
                              </button>
                              <button
                                onClick={() => handleReminderClick(appointment)}
                                disabled={isMeetingEnded(appointment)}
                                className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                  isMeetingEnded(appointment)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                    : 'border border-gray-400 text-gray-700 hover:bg-white'
                                }`}
                              >
                                <Send size={16} />
                                Send Manual Reminder to Client
                              </button>
                              <button
                                onClick={() => handleSOSClick(appointment)}
                                className="px-6 py-2 border border-red-600 rounded-lg text-sm text-red-600 hover:bg-white flex items-center gap-2"
                              >
                                <span className="font-bold">SOS</span>
                                Raise Ticket
                              </button>
                              <button
                                onClick={() => handleViewSessionNotes(appointment)}
                                className="px-6 py-2 border border-blue-600 rounded-lg text-sm text-blue-600 hover:bg-white flex items-center gap-2"
                              >
                                <FileText size={16} />
                                View Session Notes
                              </button>
                              <button
                                onClick={() => handleFillSessionNotes(appointment)}
                                disabled={appointment.has_session_notes}
                                className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                  appointment.has_session_notes
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                    : 'border border-teal-600 text-teal-600 hover:bg-white'
                                }`}
                              >
                                <FileText size={16} />
                                Fill Session Notes
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
          <span className="text-sm text-gray-600">Showing {appointments.filter(appointment => {
            const matchesSearch = appointmentSearchTerm === '' || 
              appointment.session_name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
              appointment.client_name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
              'Ishika Mahajan'.toLowerCase().includes(appointmentSearchTerm.toLowerCase());
            if (!matchesSearch) return false;
            if (activeAppointmentTab === 'all') return true;
            return getAppointmentStatus(appointment) === activeAppointmentTab;
          }).length} of {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button className="p-2 border rounded hover:bg-gray-50">←</button>
            <button className="p-2 border rounded hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 flex justify-center">
          <Logo size="small" />
        </div>

        <nav className="flex-1 px-4">
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer" 
            style={{ backgroundColor: activeView === 'dashboard' ? '#2D75795C' : 'transparent' }}
            onClick={() => {
              resetAllStates();
              setActiveView('dashboard');
            }}
          >
            <LayoutDashboard size={20} className={activeView === 'dashboard' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'dashboard' ? 'text-teal-700' : 'text-gray-700'}>Dashboard</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'clients' ? '#2D75795C' : 'transparent' }}
            onClick={() => {
              resetAllStates();
              setActiveView('clients');
            }}
          >
            <Users size={20} className={activeView === 'clients' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'clients' ? 'text-teal-700' : 'text-gray-700'}>My Clients</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'appointments' ? '#2D75795C' : 'transparent' }}
            onClick={() => {
              resetAllStates();
              setActiveView('appointments');
            }}
          >
            <Calendar size={20} className={activeView === 'appointments' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'appointments' ? 'text-teal-700' : 'text-gray-700'}>My Appointments</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'notifications' ? '#2D75795C' : 'transparent' }}
            onClick={() => {
              resetAllStates();
              setActiveView('notifications');
            }}
          >
            <Bell size={20} className={activeView === 'notifications' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'notifications' ? 'text-teal-700' : 'text-gray-700'}>Notifications</span>
          </div>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: '#2D757930' }}>
            <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{user.full_name || user.username}</div>
              <div className="text-xs text-gray-600">Role: Therapist</div>
            </div>
            <LogOut size={18} className="text-red-500 cursor-pointer" onClick={async () => {
              await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user })
              });
              onLogout();
            }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        {selectedSessionNote ? (
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => {
                setSelectedSessionNote(null);
                setSessionNotesData(null);
                setSessionNoteTab('notes');
              }} className="text-2xl hover:text-gray-600">
                ←
              </button>
              <h1 className="text-2xl font-bold">{selectedClient?.client_name}</h1>
            </div>

            <div className="flex gap-8 mb-6 border-b">
              <button
                onClick={() => setSessionNoteTab('notes')}
                className={`pb-3 font-medium ${
                  sessionNoteTab === 'notes'
                    ? 'text-teal-700 border-b-2 border-teal-700'
                    : 'text-gray-500'
                }`}
              >
                Session Notes
              </button>
              <button
                onClick={() => setSessionNoteTab('timelines')}
                className={`pb-3 font-medium ${
                  sessionNoteTab === 'timelines'
                    ? 'text-teal-700 border-b-2 border-teal-700'
                    : 'text-gray-500'
                }`}
              >
                Timelines
              </button>
            </div>

            <div className="flex gap-6">
              <div className="flex-1">
                {sessionNoteTab === 'notes' ? (
                  sessionNotesLoading ? (
                    <div className="text-center py-8"><Loader /></div>
                  ) : sessionNotesData?.error ? (
                    <div className="bg-white rounded-lg border p-8 text-center">
                      <p className="text-red-600">{sessionNotesData.error}</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border p-6">
                      <div className="mb-6">
                        <p className="text-sm text-gray-600">
                          Session Timings: {sessionNotesData?.session_timing || 'N/A'}
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Client Age:</label>
                          <p className="text-sm">{sessionNotesData?.client_age || ''}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Gender:</label>
                          <p className="text-sm">{sessionNotesData?.gender || ''}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Occupation:</label>
                          <p className="text-sm">{sessionNotesData?.occupation || ''}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Marital status:</label>
                          <p className="text-sm">{sessionNotesData?.marital_status || ''}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm text-gray-600 mb-2">Concerns or themes discussed today?:</label>
                        <div className="text-sm whitespace-pre-wrap">{sessionNotesData?.concerns_discussed || ''}</div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm text-gray-600 mb-2">
                          Somatic Cues: How did the client present today (appearance, behaviour, energy, mood, non-verbal cues)?
                        </label>
                        <div className="text-sm whitespace-pre-wrap">{sessionNotesData?.somatic_cues?.join(', ') || ''}</div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Which interventions were used?</label>
                        <div className="text-sm whitespace-pre-wrap">{sessionNotesData?.interventions_used || ''}</div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-white rounded-lg border p-8 text-center text-gray-400">
                    No timeline data available
                  </div>
                )}
              </div>

              <div className="w-80">
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-bold mb-4">Additional Notes</h3>
                  <button className="text-teal-700 text-sm">+ Add Notes</button>
                </div>
              </div>
            </div>
          </div>
        ) : selectedClient ? (
          <div className="p-8">
            <button onClick={() => setSelectedClient(null)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
              <span className="text-2xl">←</span>
            </button>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{selectedClient.client_name}</h1>
                <div className="flex gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>{selectedClient.client_phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <span>{selectedClient.client_email}</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsClientDateDropdownOpen(!isClientDateDropdownOpen)}
                  className="flex items-center gap-2 border rounded-lg px-4 py-2"
                  style={{ backgroundColor: '#2D757938' }}
                >
                  <PieChart size={18} className="text-gray-600" />
                  <span className="text-sm text-teal-700">{clientSelectedMonth}</span>
                  {isClientDateDropdownOpen ? (
                    <ChevronUp size={16} className="text-teal-700" />
                  ) : (
                    <ChevronDown size={16} className="text-teal-700" />
                  )}
                </button>
                {isClientDateDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-10">
                    {!showClientCustomCalendar ? (
                      <>
                        <button
                          onClick={() => {
                            setClientSelectedMonth('All Time');
                            setClientDateRange({ start: '', end: '' });
                            setIsClientDateDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-center text-sm hover:bg-gray-100 border-b"
                        >
                          All Time
                        </button>
                        <button
                          onClick={() => setShowClientCustomCalendar(true)}
                          className="w-full px-4 py-2 text-center text-sm hover:bg-gray-100 border-b"
                        >
                          Custom Dates
                        </button>
                        {monthOptions.map((month) => (
                          <button
                            key={month}
                            onClick={() => handleClientMonthSelect(month)}
                            className="w-full px-4 py-2 text-center text-sm hover:bg-gray-100"
                          >
                            {month}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-4">
                        <div className="mb-3">
                          <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={clientStartDate}
                            onChange={(e) => setClientStartDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={clientEndDate}
                            onChange={(e) => setClientEndDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowClientCustomCalendar(false)}
                            className="flex-1 px-3 py-2 border rounded text-sm hover:bg-gray-100"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleClientCustomDateApply}
                            className="flex-1 px-3 py-2 bg-teal-700 text-white rounded text-sm hover:bg-teal-800"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg p-6 border">
                <div className="text-sm text-gray-600 mb-2">Sessions</div>
                <div className="text-3xl font-bold text-teal-700">{clientStats.sessions}</div>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <div className="text-sm text-gray-600 mb-2">No-Show</div>
                <div className="text-3xl font-bold text-teal-700">{clientStats.noShows}</div>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <div className="text-sm text-gray-600 mb-2">Cancelled</div>
                <div className="text-3xl font-bold text-teal-700">{clientStats.cancelled}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Appointments List</h2>
              </div>
              {clientDetailLoading ? (
                <div className="p-8 text-center"><Loader /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Timings</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Mode</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-600"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAppointments.length === 0 ? (
                        <tr><td colSpan={3} className="text-center text-gray-400 py-8">No appointments found</td></tr>
                      ) : (
                        clientAppointments.map((apt, i) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm">{apt.session_timings}</td>
                            <td className="px-6 py-4 text-sm">{apt.mode || 'Google Meet'}</td>
                            <td className="px-6 py-4 text-sm text-right">
                              {apt.has_session_notes && (
                                <button onClick={() => {
                                  setSelectedSessionNote(apt);
                                  handleViewSessionNotes(apt);
                                }} className="text-teal-700 hover:underline">View Session Notes</button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeView === 'clients' ? (
          renderMyClients()
        ) : activeView === 'appointments' ? (
          renderMyAppointments()
        ) : activeView === 'notifications' ? (
          <Notifications userRole="therapist" userId={user.id} />
        ) : (
          <div className="p-8">
            {dashboardLoading ? (
              <Loader />
            ) : (
            <>
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-1">Therapist Dashboard</h1>
                <p className="text-gray-600">Welcome Back, {user.username}!</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                    className="flex items-center gap-2 border rounded-lg px-4 py-2"
                    style={{ backgroundColor: '#2D757938' }}
                  >
                    <PieChart size={18} className="text-gray-600" />
                    <span className="text-sm text-teal-700">{selectedMonth}</span>
                    {isDateDropdownOpen ? (
                      <ChevronUp size={16} className="text-teal-700" />
                    ) : (
                      <ChevronDown size={16} className="text-teal-700" />
                    )}
                  </button>
                  {isDateDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-10">
                      {!showCustomCalendar ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedMonth('All Time');
                              setDateRange({ start: '', end: '' });
                              setIsDateDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 text-center text-sm hover:bg-gray-100 border-b"
                          >
                            All Time
                          </button>
                          <button
                            onClick={() => setShowCustomCalendar(true)}
                            className="w-full px-4 py-2 text-center text-sm hover:bg-gray-100 border-b"
                          >
                            Custom Dates
                          </button>
                          {monthOptions.map((month) => (
                            <button
                              key={month}
                              onClick={() => handleMonthSelect(month)}
                              className="w-full px-4 py-2 text-center text-sm hover:bg-gray-100"
                            >
                              {month}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="p-4">
                          <div className="mb-3">
                            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full px-3 py-2 border rounded text-sm"
                            />
                          </div>
                          <div className="mb-3">
                            <label className="block text-xs text-gray-600 mb-1">End Date</label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full px-3 py-2 border rounded text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowCustomCalendar(false)}
                              className="flex-1 px-3 py-2 border rounded text-sm hover:bg-gray-100"
                            >
                              Back
                            </button>
                            <button
                              onClick={handleCustomDateApply}
                              className="flex-1 px-3 py-2 bg-teal-700 text-white rounded text-sm hover:bg-teal-800"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg p-6 border">
                  <div className="text-sm text-gray-600 mb-2">{stat.title}</div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Upcoming Bookings</h2>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Therapy Type</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Mode</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Timings</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                          No upcoming bookings
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4">{booking.client_name}</td>
                          <td className="px-6 py-4">{booking.therapy_type}</td>
                          <td className="px-6 py-4">{booking.mode}</td>
                          <td className="px-6 py-4">{booking.session_timings}</td>
                          <td className="px-6 py-4">
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
                    onClick={() => handleReminderClick(bookings[openMenuIndex])}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                  >
                    <Send size={16} />
                    Send Manual Reminder
                  </button>
                  <button 
                    onClick={() => handleSOSClick(bookings[openMenuIndex])}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2 text-red-600 border-t"
                  >
                    <span className="font-bold">SOS</span>
                    Raise Ticket
                  </button>
                  <button 
                    onClick={() => handleViewSessionNotes(bookings[openMenuIndex])}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2 text-blue-600"
                  >
                    <FileText size={16} />
                    View Session Notes
                  </button>
                  <button 
                    onClick={() => handleFillSessionNotes(bookings[openMenuIndex])}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2 text-teal-600"
                  >
                    <FileText size={16} />
                    Fill Session Notes
                  </button>
                </div>
              )}
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <span className="text-sm text-gray-600">Showing {Math.min(10, bookings.length)} of {bookings.length} results</span>
                <div className="flex gap-2">
                  <button className="p-2 border rounded hover:bg-gray-50">←</button>
                  <button className="p-2 border rounded hover:bg-gray-50">→</button>
                </div>
              </div>
            </div>

            {/* Latest Notifications */}
            <div className="bg-white rounded-lg border mt-8">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Latest Notifications</h2>
              </div>
              <div className="divide-y">
                {notifications.length === 0 ? (
                  <div className="px-6 py-20 text-center text-gray-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={index}
                      onClick={() => setActiveView('notifications')}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer flex items-start gap-4"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <Bell size={20} className={notification.is_read ? 'text-gray-400' : 'text-teal-700'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-6 py-4 border-t">
                <button
                  onClick={() => setActiveView('notifications')}
                  className="text-sm text-teal-700 hover:text-teal-800 font-medium"
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          </>
          )}
          </div>
        )
        }
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {showSOSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-red-600">Raise SOS Ticket</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to raise a ticket for this appointment?</p>
            
            {selectedSOSBooking && (
              <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                <p><strong>Client:</strong> {selectedSOSBooking.client_name}</p>
                <p><strong>Session:</strong> {selectedSOSBooking.session_name || selectedSOSBooking.therapy_type}</p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "Confirm" to proceed:
              </label>
              <input
                type="text"
                value={sosConfirmText}
                onChange={(e) => setSosConfirmText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type Confirm"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSOSModal(false);
                  setSosConfirmText('');
                  setSelectedSOSBooking(null);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSOSConfirm}
                disabled={sosConfirmText !== 'Confirm'}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  sosConfirmText === 'Confirm'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Raise Ticket
              </button>
            </div>
          </div>
        </div>
      )}
      
      
      {showReminderModal && selectedReminderAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Sending Manual Reminder</h3>
            <p className="text-gray-600 mb-4">This will send a reminder message to {selectedReminderAppointment.client_name} on Whatsapp</p>
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
                  setSelectedReminderAppointment(null);
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
    </div>
  );
};
