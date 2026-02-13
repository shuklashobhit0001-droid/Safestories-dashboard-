import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Calendar, LogOut, PieChart, ChevronUp, ChevronDown, ChevronRight, Copy, Send, Search, FileText, Bell, X, User, CalendarIcon, ArrowLeft, Mail, Eye, EyeOff, Edit } from 'lucide-react';
import { Logo } from './Logo';
import { Notifications } from './Notifications';
import { Toast } from './Toast';
import { Loader } from './Loader';
import { TherapistCalendar } from './TherapistCalendar';
import { EditProfile } from './EditProfile';
import { ChangePassword } from './ChangePassword';
import { CaseHistoryTab } from './CaseHistoryTab';
import { ProgressNotesTab } from './ProgressNotesTab';
import { ProgressNoteDetail } from './ProgressNoteDetail';
import { GoalTrackingTab } from './GoalTrackingTab';
import { FreeConsultationDetail } from './FreeConsultationDetail';

interface TherapistDashboardProps {
  onLogout: () => void;
  user: any;
}

export const TherapistDashboard: React.FC<TherapistDashboardProps> = ({ onLogout, user }) => {
  // Force re-render check - v2.0
  console.log('🔄 TherapistDashboard rendered at:', new Date().toISOString());
  
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('therapistActiveView') || 'dashboard';
  });
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('All Time');
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);

  useEffect(() => {
    localStorage.setItem('therapistActiveView', activeView);
  }, [activeView]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const generateMonthOptions = () => {
    const months = [];
    const startDate = new Date(2025, 9, 1); // Oct 2025
    const currentDate = new Date();
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); // +1 month ahead
    
    for (let d = new Date(endDate); d >= startDate; d.setMonth(d.getMonth() - 1)) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
    return months;
  };
  
  const monthOptions = generateMonthOptions();

  const [stats, setStats] = useState([
    { title: 'Sessions', value: '0', lastMonth: '0' },
    { title: 'No-shows', value: '0', lastMonth: '0' },
    { title: 'Cancelled', value: '0', lastMonth: '0' },
    { title: 'Pending Session Notes', value: '0', lastMonth: '0', clickable: true },
  ]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [selectedAppointmentIndex, setSelectedAppointmentIndex] = useState<number | null>(null);
  const [selectedBookingIndex, setSelectedBookingIndex] = useState<number | null>(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosConfirmText, setSosConfirmText] = useState('');
  const [selectedSOSBooking, setSelectedSOSBooking] = useState<any>(null);
  
  // SOS Risk Assessment Form State
  const [sosRiskSeverity, setSosRiskSeverity] = useState<number>(0);
  const [sosRiskIndicators, setSosRiskIndicators] = useState<{[key: string]: 'Y' | 'N' | 'U' | ''}>({
    emotionalDysregulation: '',
    physicalHarmIdeas: '',
    drugAlcoholAbuse: '',
    suicidalAttempt: '',
    selfHarm: '',
    delusionsHallucinations: '',
    impulsiveness: '',
    severeStress: '',
    socialIsolation: '',
    concernByOthers: '',
    other: ''
  });
  const [sosOtherDetails, setSosOtherDetails] = useState('');
  const [sosRiskSummary, setSosRiskSummary] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [sessionNotesData, setSessionNotesData] = useState<any>(null);
  const [sessionNotesLoading, setSessionNotesLoading] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminderAppointment, setSelectedReminderAppointment] = useState<any>(null);
  const [activeAppointmentTab, setActiveAppointmentTab] = useState('scheduled');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientDetailLoading, setClientDetailLoading] = useState(false);
  const [clientStats, setClientStats] = useState({ bookings: 0, sessionsCompleted: 0, noShows: 0, cancelled: 0 });
  const [clientAppointments, setClientAppointments] = useState<any[]>([]);
  const [clientDateRange, setClientDateRange] = useState({ start: '', end: '' });
  const [clientSelectedMonth, setClientSelectedMonth] = useState('All Time');
  const [isClientDateDropdownOpen, setIsClientDateDropdownOpen] = useState(false);
  const [showClientCustomCalendar, setShowClientCustomCalendar] = useState(false);
  const [clientStartDate, setClientStartDate] = useState('');
  const [clientEndDate, setClientEndDate] = useState('');
  const [selectedSessionNote, setSelectedSessionNote] = useState<any>(null);
  const [sessionNoteTab, setSessionNoteTab] = useState('notes');
  const [clientViewTab, setClientViewTab] = useState<'overview' | 'sessions' | 'documents' | 'caseHistory'>('overview');
  const [isCaseHistoryVisible, setIsCaseHistoryVisible] = useState(false);
  const [showCaseHistoryPasswordModal, setShowCaseHistoryPasswordModal] = useState(false);
  const [caseHistoryPassword, setCaseHistoryPassword] = useState('');
  const [caseHistoryPasswordError, setCaseHistoryPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedProgressNoteId, setSelectedProgressNoteId] = useState<number | null>(null);
  const [isFreeConsultationNote, setIsFreeConsultationNote] = useState(false);
  const [clientSessionType, setClientSessionType] = useState<{ hasPaidSessions: boolean; hasFreeConsultation: boolean }>({ hasPaidSessions: false, hasFreeConsultation: false });
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const clientDropdownRef = React.useRef<HTMLDivElement>(null);
  const bookingActionsRef = React.useRef<HTMLTableElement>(null);
  const appointmentActionsRef = React.useRef<HTMLTableElement>(null);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  // Utility functions to mask contact information
  const maskPhone = (phone: string): string => {
    if (!phone || phone === 'N/A') return phone;
    // Show first 5 characters (e.g., "+91 98"), mask the rest
    if (phone.length > 5) {
      return phone.substring(0, 5) + '*** *****';
    }
    return phone;
  };

  const maskEmail = (email: string): string => {
    if (!email || email === 'N/A') return email;
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    // Show first 2 characters of local part, mask middle, show domain
    if (localPart.length > 2) {
      return localPart.substring(0, 2) + '***@' + domain;
    }
    return email;
  };
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [additionalNoteText, setAdditionalNoteText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState<any[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [clientAppointmentSearchTerm, setClientAppointmentSearchTerm] = useState('');

  // Calendar view state for upcoming bookings
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [calendarModeFilter, setCalendarModeFilter] = useState<'all' | 'online' | 'in-person'>('all');
  const [calendarStatusFilter, setCalendarStatusFilter] = useState<'all' | 'upcoming' | 'cancelled' | 'completed'>('upcoming');
  const [selectedTherapistFilters, setSelectedTherapistFilters] = useState<string[]>([]);
  
  // Profile picture state
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');

  const resetAllStates = () => {
    setSelectedClient(null);
    setSelectedSessionNote(null);
    setSelectedAppointmentIndex(null);
    setSelectedBookingIndex(null);
    setExpandedRows(new Set());
    setShowSOSModal(false);
    setShowReminderModal(false);
    setIsDateDropdownOpen(false);
    setShowCustomCalendar(false);
    setIsClientDateDropdownOpen(false);
    setShowClientCustomCalendar(false);
    setShowCalendarView(false);
    setIsCaseHistoryVisible(false);
    setShowCaseHistoryPasswordModal(false);
    setCaseHistoryPassword('');
    setCaseHistoryPasswordError('');
    setShowPassword(false);
  };

  const handleCaseHistoryView = () => {
    if (isCaseHistoryVisible) {
      // Hide case history
      setIsCaseHistoryVisible(false);
    } else {
      // Show password modal to authenticate
      setShowCaseHistoryPasswordModal(true);
      setCaseHistoryPassword('');
      setCaseHistoryPasswordError('');
      setShowPassword(false);
    }
  };

  const handleCaseHistoryPasswordSubmit = async () => {
    if (!caseHistoryPassword) {
      setCaseHistoryPasswordError('Please enter your password');
      return;
    }

    try {
      // Verify password by attempting to authenticate
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: caseHistoryPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsCaseHistoryVisible(true);
        setShowCaseHistoryPasswordModal(false);
        setCaseHistoryPassword('');
        setCaseHistoryPasswordError('');
        setShowPassword(false);
      } else {
        setCaseHistoryPasswordError('Incorrect password');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setCaseHistoryPasswordError('Error verifying password');
    }
  };

  const toggleTherapistFilter = (therapistName: string) => {
    setSelectedTherapistFilters(prev => 
      prev.includes(therapistName) 
        ? prev.filter(name => name !== therapistName)
        : [...prev, therapistName]
    );
  };

  const appointmentTabs = [
    { id: 'scheduled', label: 'Upcoming' },
    { id: 'all', label: 'All Appointments' },
    { id: 'completed', label: 'Completed' },
    { id: 'pending_notes', label: 'Pending Session Notes' },
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

  const getClientStatus = (client: any) => {
    // If no appointments data, return inactive
    if (!appointments || appointments.length === 0) {
      return 'inactive';
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Check if client has any appointments in the last 30 days
    const hasRecentAppointment = appointments.some(apt => {
      // Match by email or phone (normalize for comparison)
      const clientEmail = client.client_email?.toLowerCase().trim();
      const aptEmail = apt.invitee_email?.toLowerCase().trim();
      const clientPhone = client.client_phone?.replace(/[\s\-\(\)\+]/g, '');
      const aptPhone = apt.invitee_phone?.replace(/[\s\-\(\)\+]/g, '');
      
      const emailMatch = clientEmail && aptEmail && clientEmail === aptEmail;
      const phoneMatch = clientPhone && aptPhone && clientPhone === aptPhone;
      
      if (emailMatch || phoneMatch) {
        // Use booking_start_at (standardized field from API)
        const aptDate = apt.booking_start_at ? new Date(apt.booking_start_at) : new Date();
        const isRecent = aptDate >= thirtyDaysAgo;
        const isNotCancelled = apt.booking_status !== 'cancelled' && apt.booking_status !== 'canceled';
        return isRecent && isNotCancelled;
      }
      return false;
    });
    
    return hasRecentAppointment ? 'active' : 'inactive';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
        setShowCustomCalendar(false);
      }
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setIsClientDateDropdownOpen(false);
        setShowClientCustomCalendar(false);
      }
      if (bookingActionsRef.current && !bookingActionsRef.current.contains(event.target as Node)) {
        setSelectedBookingIndex(null);
      }
      if (appointmentActionsRef.current && !appointmentActionsRef.current.contains(event.target as Node)) {
        setSelectedAppointmentIndex(null);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    } else if (activeView === 'dashboard') {
      // Fetch clients for Active/Inactive stats on dashboard
      fetchClientsData();
    }
  }, [activeView]);



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
      
      // Fetch client session type
      const sessionTypeRes = await fetch(`/api/client-session-type?client_id=${encodeURIComponent(client.client_phone)}`);
      if (sessionTypeRes.ok) {
        const sessionTypeData = await sessionTypeRes.json();
        console.log('📊 Client Session Type:', sessionTypeData);
        if (sessionTypeData.success) {
          setClientSessionType(sessionTypeData.data);
          console.log('✅ Session type set:', sessionTypeData.data);
        }
      }
      
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
        const bookings = filteredAppointments.length; // Total appointments
        const sessionsCompleted = filteredAppointments.filter((a: any) => {
          const sessionDate = a.booking_date ? new Date(a.booking_date) : new Date();
          const isPast = sessionDate < new Date();
          const isNotCancelledOrNoShow = a.booking_status !== 'cancelled' && a.booking_status !== 'no_show';
          return isPast && isNotCancelledOrNoShow;
        }).length; // Only past sessions (completed + pending notes), excluding cancelled/no_show
        const noShows = filteredAppointments.filter((a: any) => a.booking_status === 'no_show').length;
        const cancelled = filteredAppointments.filter((a: any) => a.booking_status === 'cancelled').length;
        setClientStats({ bookings, sessionsCompleted, noShows, cancelled });
        
        // Update selectedClient with emergency contact and demographic data from the most recent appointment
        if (data.appointments && data.appointments.length > 0) {
          // Find the first appointment that has emergency contact info
          const aptWithEmergency = data.appointments.find((apt: any) => apt.emergency_contact_name) || data.appointments[0];
          
          setSelectedClient((prev: any) => ({
            ...prev,
            emergency_contact_name: aptWithEmergency.emergency_contact_name,
            emergency_contact_relation: aptWithEmergency.emergency_contact_relation,
            emergency_contact_number: aptWithEmergency.emergency_contact_number,
            invitee_age: aptWithEmergency.invitee_age,
            invitee_gender: aptWithEmergency.invitee_gender,
            invitee_occupation: aptWithEmergency.invitee_occupation,
            invitee_marital_status: aptWithEmergency.invitee_marital_status,
            clinical_profile: aptWithEmergency.clinical_profile
          }));
        }
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
      
      // Fetch therapist profile picture
      try {
        const profileRes = await fetch(`/api/therapist-profile?therapist_id=${user.therapist_id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.success && profileData.data.profile_picture_url) {
            setProfilePictureUrl(profileData.data.profile_picture_url);
          }
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
      
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
          { title: 'Pending Session Notes', value: '0', lastMonth: '0', clickable: true },
        ]);
        
        setBookings(data.upcomingBookings || []);

        const notificationsRes = await fetch(`/api/notifications?user_id=${user.id}&user_role=therapist`);
        if (notificationsRes.ok) {
          const notificationsData = await notificationsRes.json();
          setNotifications(notificationsData.slice(0, 2));
        }

        // Fetch all appointments to get pending notes
        const appointmentsRes = await fetch(`/api/therapist-appointments?therapist_id=${user.id}`);
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          setAppointments(appointmentsData.appointments || []);
          
          // Count pending notes
          const pendingNotesCount = appointmentsData.appointments.filter((apt: any) => {
            if (apt.booking_status === 'cancelled' || apt.booking_status === 'no_show') return false;
            if (apt.has_session_notes) return false;
            if (apt.session_timings) {
              const timeMatch = apt.session_timings.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M)/);
              if (timeMatch) {
                const [, dateStr, , endTimeStr] = timeMatch;
                const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
                return endDateTime < new Date();
              }
            }
            return false;
          }).length;
          
          setStats([
            { title: 'Sessions', value: (data.stats.sessions || 0).toString(), lastMonth: '0' },
            { title: 'No-shows', value: (data.stats.noShows || 0).toString(), lastMonth: '0' },
            { title: 'Cancelled', value: (data.stats.cancelled || 0).toString(), lastMonth: '0' },
            { title: 'Pending Session Notes', value: pendingNotesCount.toString(), lastMonth: '0', clickable: true },
          ]);
        }
      } else {
        // Fallback to empty data
        setStats([
          { title: 'Sessions', value: '0', lastMonth: '0' },
          { title: 'No-shows', value: '0', lastMonth: '0' },
          { title: 'Cancelled', value: '0', lastMonth: '0' },
          { title: 'Pending Session Notes', value: '0', lastMonth: '0', clickable: true },
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
        { title: 'Pending Session Notes', value: '0', lastMonth: '0', clickable: true },
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

  const handleViewClientFromAppointment = async (appointment: any) => {
    // Find client by phone
    let clientsList = clients;
    if (clients.length === 0) {
      try {
        const response = await fetch(`/api/therapist-clients?therapist_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          clientsList = data.clients || [];
          setClients(clientsList);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    }
    
    const client = clientsList.find(c => c.client_phone === appointment.contact_info);
    if (client) {
      setActiveView('clients');
      setSelectedClient(client);
      await fetchClientDetails(client);
    }
  };

  const handleViewClientFromBooking = async (booking: any) => {
    // Find client by name (from upcoming bookings)
    let clientsList = clients;
    if (clients.length === 0) {
      try {
        const response = await fetch(`/api/therapist-clients?therapist_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          clientsList = data.clients || [];
          setClients(clientsList);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    }
    
    const client = clientsList.find(c => c.client_name === booking.client_name);
    if (client) {
      setActiveView('clients');
      setSelectedClient(client);
      await fetchClientDetails(client);
    }
  };

  const isMeetingStarted = (apt: any) => {
    const timeMatch = apt.session_timings?.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) IST/);
    if (timeMatch) {
      const [, dateStr, startTimeStr] = timeMatch;
      const startDateTime = new Date(`${dateStr} ${startTimeStr}`);
      return new Date() >= startDateTime;
    }
    return false;
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

  const fetchTimelineData = async (bookingId: number) => {
    try {
      const timeline: any[] = [];
      
      // Fetch session notes
      const sessionNotesRes = await fetch(`/api/session-notes?booking_id=${bookingId}`);
      if (sessionNotesRes.ok) {
        const sessionNotes = await sessionNotesRes.json();
        if (sessionNotes && !sessionNotes.error) {
          timeline.push({
            type: 'session_notes',
            action: 'Session notes added',
            timestamp: sessionNotes.created_at,
            data: sessionNotes
          });
          if (sessionNotes.updated_at && sessionNotes.updated_at !== sessionNotes.created_at) {
            timeline.push({
              type: 'session_notes',
              action: 'Session notes updated',
              timestamp: sessionNotes.updated_at,
              data: sessionNotes
            });
          }
        }
      }
      
      // Fetch additional notes
      const additionalNotesRes = await fetch(`/api/additional-notes?booking_id=${bookingId}`);
      if (additionalNotesRes.ok) {
        const additionalNotes = await additionalNotesRes.json();
        additionalNotes.forEach((note: any) => {
          timeline.push({
            type: 'additional_note',
            action: 'Additional note added',
            timestamp: note.created_at,
            data: note
          });
          if (note.updated_at && note.updated_at !== note.created_at) {
            timeline.push({
              type: 'additional_note',
              action: 'Additional note updated',
              timestamp: note.updated_at,
              data: note
            });
          }
        });
      }
      
      // Sort by timestamp descending
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTimelineData(timeline);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    }
  };

  const handleAddNote = () => {
    setShowAddNoteModal(true);
    setAdditionalNoteText('');
    setEditingNoteId(null);
  };

  const handleEditNote = (note: any) => {
    setShowAddNoteModal(true);
    setAdditionalNoteText(note.note_text);
    setEditingNoteId(note.note_id);
  };

  const handleSaveAdditionalNote = async () => {
    if (!additionalNoteText.trim() || !selectedSessionNote) return;
    
    try {
      const response = await fetch('/api/additional-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_id: editingNoteId,
          booking_id: selectedSessionNote.booking_id,
          therapist_id: user.therapist_id,
          therapist_name: user.username,
          note_text: additionalNoteText
        })
      });
      
      if (response.ok) {
        setToast({ message: editingNoteId ? 'Note updated successfully!' : 'Note added successfully!', type: 'success' });
        setShowAddNoteModal(false);
        setAdditionalNoteText('');
        setEditingNoteId(null);
        
        // Refresh additional notes and timeline
        const notesRes = await fetch(`/api/additional-notes?booking_id=${selectedSessionNote.booking_id}`);
        if (notesRes.ok) {
          const data = await notesRes.json();
          setAdditionalNotes(data);
        }
        await fetchTimelineData(selectedSessionNote.booking_id);
      } else {
        setToast({ message: 'Failed to save note', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving additional note:', error);
      setToast({ message: 'Failed to save note', type: 'error' });
    }
  };

  const handleSOSClick = (booking: any) => {
    console.log('=== SOS BUTTON CLICKED ===');
    console.log('Booking:', booking);
    console.log('Session timings:', booking.session_timings);
    
    // Time validation DISABLED - Allow SOS at any time
    console.log('✓ Time validation disabled, showing modal');
    
    setSelectedSOSBooking(booking);
    setShowSOSModal(true);
    setSelectedAppointmentIndex(null);
  };

  const handleSOSClickFromClient = (apt: any) => {
    // Time validation DISABLED - Allow SOS at any time
    const booking = {
      ...apt,
      client_name: selectedClient?.client_name,
      session_name: 'Individual Therapy Session',
      contact_info: selectedClient?.client_phone,
      session_timings: apt.session_timings
    };
    
    setSelectedSOSBooking(booking);
    setShowSOSModal(true);
    setSelectedAppointmentIndex(null);
  };

  const handleSOSConfirm = async () => {
    try {
      // Validate all required fields are completed
      if (sosRiskSeverity === 0 || 
          Object.values(sosRiskIndicators).some(val => val === '') ||
          sosRiskSummary.trim() === '' ||
          (sosRiskIndicators.other === 'Y' && sosOtherDetails.trim() === '')) {
        setToast({ message: 'Please complete all required fields', type: 'error' });
        return;
      }

      const riskAssessmentData = {
        severity_level: sosRiskSeverity,
        severity_description: sosRiskSeverity === 1 ? 'None - no evidence of risk present'
          : sosRiskSeverity === 2 ? 'Low - low or minor evidence of risk of harm to self or others'
          : sosRiskSeverity === 3 ? 'Medium - moderate risk present'
          : sosRiskSeverity === 4 ? 'High - high or major risk of harm/injury to self or others'
          : 'Severe/catastrophic - immediate attention needed',
        risk_indicators: sosRiskIndicators,
        other_details: sosOtherDetails,
        risk_summary: sosRiskSummary
      };
      
      // 1. Save to database first - this is the critical step
      const dbResponse = await fetch('/api/sos-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: selectedSOSBooking?.booking_id,
          therapist_id: user?.therapist_id,
          therapist_name: user?.username,
          client_name: selectedSOSBooking?.client_name,
          session_name: selectedSOSBooking?.session_name || selectedSOSBooking?.therapy_type,
          session_timings: selectedSOSBooking?.session_timings,
          contact_info: selectedSOSBooking?.contact_info,
          mode: selectedSOSBooking?.mode,
          risk_assessment: riskAssessmentData
        })
      });
      
      let assessmentId = null;
      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        console.error('Database save failed:', errorData);
        setToast({ message: 'Failed to save SOS assessment to database', type: 'error' });
        return;
      }
      
      const dbResult = await dbResponse.json();
      assessmentId = dbResult.assessment_id;
      console.log('✅ SOS assessment saved to database with ID:', assessmentId);
      
      // 2. Send to webhook with database ID (non-critical - don't fail if this fails)
      try {
        const webhookData = {
          database_id: assessmentId,
          therapist_id: user?.therapist_id,
          therapist_name: user?.username,
          client_name: selectedSOSBooking?.client_name,
          session_name: selectedSOSBooking?.session_name || selectedSOSBooking?.therapy_type,
          session_timings: selectedSOSBooking?.session_timings,
          contact_info: selectedSOSBooking?.contact_info,
          mode: selectedSOSBooking?.mode,
          booking_id: selectedSOSBooking?.booking_id,
          timestamp: new Date().toISOString(),
          risk_assessment: riskAssessmentData
        };
        
        const webhookResponse = await fetch('https://n8n.srv1169280.hstgr.cloud/webhook/3e725c04-ed19-4967-8a05-c0a1e8c8441d', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        
        // 3. Update database with webhook status
        if (assessmentId) {
          await fetch(`/api/sos-assessments?id=${assessmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webhook_sent: webhookResponse.ok,
              webhook_response: webhookResponse.ok ? 'Success' : `Failed: ${webhookResponse.status}`
            })
          });
        }
        
        console.log('✅ Webhook sent successfully');
      } catch (webhookError) {
        console.error('⚠️ Webhook failed (non-critical):', webhookError);
        // Update database to record webhook failure
        if (assessmentId) {
          try {
            await fetch(`/api/sos-assessments?id=${assessmentId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                webhook_sent: false,
                webhook_response: `Error: ${webhookError.message}`
              })
            });
          } catch (updateError) {
            console.error('Failed to update webhook status:', updateError);
          }
        }
      }
      
      // 4. Create audit log (non-critical)
      try {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            therapist_id: user?.therapist_id,
            therapist_name: user?.username,
            action_type: 'raise_sos',
            action_description: `${user?.username} raised SOS ticket with risk assessment (Severity: ${sosRiskSeverity})`,
            client_name: selectedSOSBooking?.client_name
          })
        });
        console.log('✅ Audit log created');
      } catch (auditError) {
        console.error('⚠️ Audit log failed (non-critical):', auditError);
      }
      
      // 5. Notify all admins (non-critical)
      try {
        await fetch('/api/notifications/create-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification_type: 'sos_ticket',
            title: 'SOS Risk Assessment Submitted',
            message: `${user?.username} submitted SOS risk assessment for client ${selectedSOSBooking?.client_name} (Severity Level: ${sosRiskSeverity})`,
            related_id: selectedSOSBooking?.booking_id
          })
        });
        console.log('✅ Admin notifications sent');
      } catch (notificationError) {
        console.error('⚠️ Admin notification failed (non-critical):', notificationError);
      }
      
      // Success! Show success message and reset form
      setToast({ message: 'SOS Risk Assessment submitted successfully!', type: 'success' });
      setShowSOSModal(false);
      setSosConfirmText('');
      setSelectedSOSBooking(null);
      // Reset form
      setSosRiskSeverity(0);
      setSosRiskIndicators({
        emotionalDysregulation: '',
        physicalHarmIdeas: '',
        drugAlcoholAbuse: '',
        suicidalAttempt: '',
        selfHarm: '',
        delusionsHallucinations: '',
        impulsiveness: '',
        severeStress: '',
        socialIsolation: '',
        concernByOthers: '',
        other: ''
      });
      setSosOtherDetails('');
      setSosRiskSummary('');
      
    } catch (error) {
      console.error('❌ Critical SOS assessment error:', error);
      setToast({ message: 'Failed to submit SOS assessment. Please try again.', type: 'error' });
    }
  };

  const handleFillSessionNotes = async (appointment: any) => {
    console.log('Fill session notes for:', appointment);
    setSelectedAppointmentIndex(null);
    
    try {
      const response = await fetch(`/api/paperform-link?booking_id=${appointment.booking_id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.paperform_link) {
          window.open(data.paperform_link, '_blank');
        } else {
          setToast({ message: 'No session notes form available for this appointment', type: 'error' });
        }
      } else {
        setToast({ message: 'Failed to get session notes form link', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching paperform link:', error);
      setToast({ message: 'Error opening session notes form', type: 'error' });
    }
  };

  const handleViewSessionNotes = async (appointment: any) => {
    console.log('View session notes for booking_id:', appointment.booking_id);
    console.log('Appointment object:', appointment);
    setSessionNotesLoading(true);
    setSelectedAppointmentIndex(null);
    
    // If we're viewing from client details, we already have the selected client
    if (selectedClient) {
      setSelectedSessionNote(appointment);
      
      // Fetch session notes
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
      }
      
      // Fetch additional notes
      try {
        const response = await fetch(`/api/additional-notes?booking_id=${appointment.booking_id}`);
        if (response.ok) {
          const data = await response.json();
          setAdditionalNotes(data);
        }
      } catch (error) {
        console.error('Error fetching additional notes:', error);
      }
      
      // Fetch timeline data
      await fetchTimelineData(appointment.booking_id);
      
      setSessionNotesLoading(false);
      return;
    }
    
    // Fetch clients if not already loaded
    let clientsList = clients;
    if (clients.length === 0) {
      try {
        const response = await fetch(`/api/therapist-clients?therapist_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          clientsList = data.clients || [];
          setClients(clientsList);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    }
    
    // Find client by phone number - use invitee_phone from appointments
    const clientPhone = appointment.contact_info || appointment.invitee_phone;
    const client = clientsList.find(c => c.client_phone === clientPhone);
    
    if (client) {
      // Switch to clients view
      setActiveView('clients');
      // Set selected client
      setSelectedClient(client);
      // Fetch client details
      await fetchClientDetails(client);
      // Set selected session note
      setSelectedSessionNote(appointment);
      
      // Fetch session notes
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
      }
      
      // Fetch additional notes
      try {
        const response = await fetch(`/api/additional-notes?booking_id=${appointment.booking_id}`);
        if (response.ok) {
          const data = await response.json();
          setAdditionalNotes(data);
        }
      } catch (error) {
        console.error('Error fetching additional notes:', error);
      }
      
      // Fetch timeline data
      await fetchTimelineData(appointment.booking_id);
      
      setSessionNotesLoading(false);
    } else {
      console.error('Client not found for phone:', clientPhone);
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
                    <tr key={index} className="border-b hover:bg-gray-50 cursor-pointer" onClick={async () => {
                      console.log('🖱️ Client clicked:', client.client_name);
                      setActiveAppointmentTab('upcoming');
                      await fetchClientDetails(client);
                      setSelectedClient(client);
                    }}>
                      <td className="px-6 py-4 text-sm">{client.client_name}</td>
                      <td className="px-6 py-4 text-sm">{client.client_phone}</td>
                      <td className="px-6 py-4 text-sm">{client.client_email}</td>
                      <td className="px-6 py-4 text-sm">{client.total_sessions}</td>
                    </tr>
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

  // Inline component for Free Consultation Notes List
  const FreeConsultationNotesList = ({ clientId, onViewNote }: { clientId: string; onViewNote: (id: number) => void }) => {
    const [notes, setNotes] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [hasBooking, setHasBooking] = React.useState(false);

    React.useEffect(() => {
      const fetchNotes = async () => {
        try {
          const response = await fetch(`/api/free-consultation-notes?client_id=${clientId}`);
          const data = await response.json();
          if (data.success) {
            setNotes(data.data);
          }
          
          // Check if client has free consultation booking
          if (data.data.length === 0) {
            // Check bookings to see if there's a free consultation scheduled
            setHasBooking(clientSessionType.hasFreeConsultation);
          }
        } catch (error) {
          console.error('Error fetching free consultation notes:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchNotes();
    }, [clientId]);

    if (loading) {
      return <div className="flex items-center justify-center py-12"><div className="text-gray-500">Loading...</div></div>;
    }

    if (notes.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          {hasBooking ? (
            <>
              <p className="text-gray-500 text-lg mb-4">Free consultation session booked</p>
              <p className="text-gray-400 text-sm">Pre-therapy notes will appear here after the therapist fills the consultation form</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-lg mb-4">No pre-therapy consultation notes yet</p>
              <p className="text-gray-400 text-sm">Notes will appear after the free consultation session</p>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Pre-therapy Consultation Notes</h2>
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-purple-50 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-colors cursor-pointer p-6"
            onClick={() => onViewNote(note.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                    FREE CONSULTATION
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(note.session_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-3">
                  <span>Mode: {note.session_mode || 'N/A'}</span>
                  <span>•</span>
                  <span>Duration: {note.session_duration || 'N/A'}</span>
                  <span>•</span>
                  <span>Therapist: {note.therapist_name || 'N/A'}</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-purple-400" />
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-purple-700">Presenting Concerns:</span>
                <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                  {note.presenting_concerns || 'No concerns recorded'}
                </p>
              </div>
              {note.assigned_therapist_name && (
                <div>
                  <span className="text-xs font-medium text-purple-700">Assigned Therapist:</span>
                  <p className="text-sm text-gray-700 mt-1">{note.assigned_therapist_name}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getAppointmentStatus = (apt: any) => {
    if (apt.booking_status === 'cancelled') return 'cancelled';
    if (apt.booking_status === 'no_show' || apt.booking_status === 'no show') return 'no_show';
    if (apt.has_session_notes) return 'completed';
    
    // Parse session_timings to check if session ended - handle both IST and GMT formats
    if (apt.session_timings) {
      const timeMatch = apt.session_timings.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M)/);
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
          <table className="w-full" ref={appointmentActionsRef}>
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
                        <td className="px-6 py-4 text-sm">
                          <span 
                            className="text-teal-700 hover:underline cursor-pointer"
                            onClick={() => handleViewClientFromAppointment(appointment)}
                          >
                            {appointment.client_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{appointment.contact_info}</td>
                        <td className="px-6 py-4 text-sm">
                          {appointment.mode?.includes('_') 
                            ? appointment.mode.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                            : appointment.mode || 'Google Meet'
                          }
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
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
                                disabled={isMeetingEnded(appointment) || appointment.booking_status === 'cancelled'}
                                className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                  isMeetingEnded(appointment) || appointment.booking_status === 'cancelled'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                    : 'border border-gray-400 text-gray-700 hover:bg-white'
                                }`}
                              >
                                <Send size={16} />
                                Send Manual Reminder to Client
                              </button>
                              <button
                                onClick={() => handleSOSClick(appointment)}
                                disabled={appointment.booking_status === 'cancelled'}
                                className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                  appointment.booking_status === 'cancelled'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                    : 'border border-red-600 text-red-600 hover:bg-white'
                                }`}
                              >
                                <span className="font-bold">SOS</span>
                                Raise Ticket
                              </button>
                              <button
                                onClick={() => handleViewSessionNotes(appointment)}
                                disabled={!appointment.has_session_notes || appointment.booking_status === 'cancelled'}
                                className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                  !appointment.has_session_notes || appointment.booking_status === 'cancelled'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                    : 'border border-blue-600 text-blue-600 hover:bg-white'
                                }`}
                              >
                                <FileText size={16} />
                                View Session Notes
                              </button>
                              <button
                                onClick={() => handleFillSessionNotes(appointment)}
                                disabled={appointment.has_session_notes || appointment.booking_status === 'cancelled' || !isMeetingStarted(appointment)}
                                className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                  appointment.has_session_notes || appointment.booking_status === 'cancelled' || !isMeetingStarted(appointment)
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
          }).length} of {appointments.filter(appointment => {
            const matchesSearch = appointmentSearchTerm === '' || 
              appointment.session_name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
              appointment.client_name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
              'Ishika Mahajan'.toLowerCase().includes(appointmentSearchTerm.toLowerCase());
            if (!matchesSearch) return false;
            if (activeAppointmentTab === 'all') return true;
            return getAppointmentStatus(appointment) === activeAppointmentTab;
          }).length} appointment{appointments.filter(appointment => {
            const matchesSearch = appointmentSearchTerm === '' || 
              appointment.session_name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
              appointment.client_name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
              'Ishika Mahajan'.toLowerCase().includes(appointmentSearchTerm.toLowerCase());
            if (!matchesSearch) return false;
            if (activeAppointmentTab === 'all') return true;
            return getAppointmentStatus(appointment) === activeAppointmentTab;
          }).length !== 1 ? 's' : ''}</span>
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

        <div className="p-4 border-t relative" ref={profileMenuRef}>
          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setActiveView('settings');
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b"
              >
                <Edit size={18} className="text-gray-600" />
                <span className="text-sm font-medium">Edit Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setActiveView('changePassword');
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                <Eye size={18} className="text-gray-600" />
                <span className="text-sm font-medium">
                  {import.meta.env.VITE_VERCEL !== '1' ? 'Change/Forgot Password' : 'Change Password'}
                </span>
              </button>
            </div>
          )}
          
          {/* Profile Box */}
          <div 
            className="flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: '#2D757930' }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {profilePictureUrl ? (
              <img 
                src={profilePictureUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
            )}
            <div className="flex-1">
              <div className="font-semibold text-sm">{user.full_name || user.username}</div>
              <div className="text-xs text-gray-600">Role: Therapist</div>
            </div>
            <LogOut size={18} className="text-red-500 cursor-pointer" onClick={async (e) => {
              e.stopPropagation();
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
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="font-semibold mb-4">Timeline</h3>
                    {timelineData.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No timeline data available</p>
                    ) : (
                      <div className="space-y-4">
                        {timelineData.map((item, index) => {
                          const now = new Date();
                          const createdAt = new Date(item.timestamp);
                          const minutesSinceCreation = Math.abs((now.getTime() - createdAt.getTime()) / (1000 * 60));
                          const canEdit = minutesSinceCreation <= 5;
                          
                          return (
                            <div key={index} className="border-l-2 border-teal-700 pl-4 pb-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{item.action}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(item.timestamp).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                {item.type === 'additional_note' && (
                                  <button
                                    onClick={() => {
                                      if (!canEdit) {
                                        setToast({ message: 'Notes can only be edited within 5 minutes of creation', type: 'error' });
                                        setTimeout(() => setToast(null), 3000);
                                        return;
                                      }
                                      handleEditNote(item.data);
                                    }}
                                    className={`text-xs ${
                                      canEdit ? 'text-teal-700 hover:underline' : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                              {item.type === 'additional_note' && (
                                <p className="text-sm text-gray-600 mt-2">{item.data.note_text}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {sessionNoteTab === 'notes' && (
                <div className="w-80">
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="font-bold mb-4">Additional Notes</h3>
                    <button onClick={handleAddNote} className="text-teal-700 text-sm hover:underline">+ Add Notes</button>
                    
                    {additionalNotes.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {additionalNotes.map((note) => {
                          const now = new Date();
                          const createdAt = new Date(note.created_at);
                          // Handle both UTC and IST timestamps by using absolute value
                          const minutesSinceCreation = Math.abs((now.getTime() - createdAt.getTime()) / (1000 * 60));
                          const canEdit = minutesSinceCreation <= 5;
                          
                          console.log('Additional note edit check:', {
                            note_id: note.note_id,
                            now: now.toISOString(),
                            created_at: note.created_at,
                            createdAt: createdAt.toISOString(),
                            minutesSinceCreation,
                            canEdit
                          });
                          
                          return (
                            <div key={note.note_id} className="border-l-2 border-gray-300 pl-3 py-2">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-xs text-gray-500">
                                  {new Date(note.created_at).toLocaleDateString()}
                                </p>
                                <button
                                  onClick={() => {
                                    if (!canEdit) {
                                      setToast({ message: 'Notes can only be edited within 5 minutes of creation', type: 'error' });
                                      setTimeout(() => setToast(null), 3000);
                                      return;
                                    }
                                    handleEditNote(note);
                                  }}
                                  className={`text-xs ${
                                    canEdit ? 'text-teal-700 hover:underline' : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  Edit
                                </button>
                              </div>
                              <p className="text-sm text-gray-700">{note.note_text}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : selectedClient ? (
          <div className="p-8 h-full overflow-auto">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{selectedClient.client_name}</h1>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ 
                    backgroundColor: getClientStatus(selectedClient) === 'active' ? '#21615D' : '#B91C1C'
                  }}
                >
                  {getClientStatus(selectedClient) === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Two Column Layout - Left side fixed, Right side with tabs */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - Client Information (Always Visible) */}
              <div className="col-span-4 space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Contact Info:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <span className="text-gray-700">{maskPhone(selectedClient.client_phone || 'N/A')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={18} />
                      <span className="text-gray-700">{maskEmail(selectedClient.client_email || 'N/A')}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Emergency Contact:</h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="mb-2">
                      <span className="font-medium text-sm">{selectedClient.emergency_contact_name || 'Not provided'}</span>
                      {selectedClient.emergency_contact_relation && (
                        <span className="text-gray-500 text-sm ml-2">({selectedClient.emergency_contact_relation})</span>
                      )}
                    </div>
                    {selectedClient.emergency_contact_number && (
                      <div className="text-sm text-gray-600">{maskPhone(selectedClient.emergency_contact_number)}</div>
                    )}
                  </div>
                </div>

                {/* Case History / Pre-therapy Notes */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-600">
                      {clientSessionType.hasPaidSessions ? 'Case History:' : 'Pre-therapy Notes:'}
                    </h3>
                    {clientSessionType.hasPaidSessions && (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleCaseHistoryView}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors" 
                          title={isCaseHistoryVisible ? "Hide Case History" : "View Case History"}
                        >
                          {isCaseHistoryVisible ? (
                            <Eye size={16} className="text-gray-600" />
                          ) : (
                            <EyeOff size={16} className="text-gray-600" />
                          )}
                        </button>
                        <button 
                          disabled={!isCaseHistoryVisible}
                          className={`p-1.5 rounded transition-colors ${
                            isCaseHistoryVisible 
                              ? 'hover:bg-gray-200 cursor-pointer' 
                              : 'cursor-not-allowed opacity-40'
                          }`}
                          title={isCaseHistoryVisible ? "Edit Case History" : "View case history first to edit"}
                        >
                          <Edit size={16} className="text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[100px]">
                    {clientSessionType.hasPaidSessions ? (
                      // Show case history for paid sessions
                      isCaseHistoryVisible ? (
                        selectedClient.clinical_profile ? (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedClient.clinical_profile}</p>
                        ) : (
                          <button className="text-teal-600 text-sm hover:text-teal-700 flex items-center gap-2">
                            <span>+ add case history</span>
                          </button>
                        )
                      ) : (
                        <div className="flex items-center justify-center h-20">
                          <p className="text-gray-400 text-sm">Case history is hidden. Click the eye icon to view.</p>
                        </div>
                      )
                    ) : (
                      // Show message for free consultation only
                      <div className="flex items-center justify-center h-20">
                        <p className="text-gray-400 text-sm">Pre-therapy notes will appear after consultation form is filled</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Tabbed Content */}
              <div className="col-span-8 space-y-6">
                {/* Navigation Tabs */}
                <div className="flex gap-8 border-b">
                  {(() => {
                    console.log('🎯 Rendering tabs with clientSessionType:', clientSessionType);
                    return clientSessionType.hasPaidSessions ? (
                      // Show all tabs for paid sessions
                      [
                        { id: 'overview' as const, label: 'Overview' },
                        { id: 'caseHistory' as const, label: 'Case History' },
                        { id: 'sessions' as const, label: 'Progress notes' },
                        { id: 'documents' as const, label: 'Goal Tracking' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setClientViewTab(tab.id)}
                          className={`pb-3 font-medium text-sm ${
                            clientViewTab === tab.id
                              ? 'text-teal-700 border-b-2 border-teal-700'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))
                    ) : (
                      // Show only Overview and Pre-therapy Notes for free consultation only
                      [
                        { id: 'overview' as const, label: 'Overview' },
                        { id: 'caseHistory' as const, label: 'Pre-therapy Notes' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setClientViewTab(tab.id)}
                          className={`pb-3 font-medium text-sm ${
                            clientViewTab === tab.id
                              ? 'text-teal-700 border-b-2 border-teal-700'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))
                    );
                  })()}
                </div>

                {/* Date Filter */}
                <div className="flex justify-end">
                  <div className="relative" ref={clientDropdownRef}>
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

                {/* Tab Content - Overview */}
                {clientViewTab === 'overview' && (
                <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{clientStats.bookings}</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Sessions Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{clientStats.sessionsCompleted}</p>
                  </div>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Next Session</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(() => {
                        const upcoming = clientAppointments
                          .filter(apt => {
                            const sessionDate = apt.booking_date ? new Date(apt.booking_date) : new Date();
                            return sessionDate >= new Date() && apt.booking_status !== 'cancelled';
                          })
                          .sort((a, b) => {
                            const dateA = a.booking_date ? new Date(a.booking_date) : new Date();
                            const dateB = b.booking_date ? new Date(b.booking_date) : new Date();
                            return dateA.getTime() - dateB.getTime();
                          })[0];
                        
                        if (upcoming && upcoming.booking_date) {
                          const date = new Date(upcoming.booking_date);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        }
                        return 'N/A';
                      })()}
                    </p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Cancellation</p>
                    <p className="text-3xl font-bold text-gray-900">{clientStats.cancelled}</p>
                  </div>
                </div>

                {/* Third Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">No Show</p>
                    <p className="text-3xl font-bold text-gray-900">{clientStats.noShows}</p>
                  </div>
                </div>

                {/* Appointments Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User size={20} className="text-gray-700" />
                    Bookings
                  </h3>

            {/* Tabs */}
            <div className="flex gap-6 mb-4">
              {[
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'all', label: 'All' },
                { id: 'completed', label: 'Completed' },
                { id: 'pending_notes', label: 'Pending Session Notes' },
                { id: 'cancelled', label: 'Cancelled' },
                { id: 'no_show', label: 'No Show' },
              ].map((tab) => {
                const count = clientAppointments.filter(apt => {
                  if (clientAppointmentSearchTerm && !apt.booking_resource_name?.toLowerCase().includes(clientAppointmentSearchTerm.toLowerCase())) {
                    return false;
                  }
                  if (tab.id === 'all') return true;
                  if (tab.id === 'upcoming') {
                    const sessionDate = apt.booking_date ? new Date(apt.booking_date) : new Date();
                    return sessionDate >= new Date() && apt.booking_status !== 'cancelled' && !apt.has_session_notes;
                  }
                  return getAppointmentStatus(apt) === tab.id;
                }).length;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAppointmentTab(tab.id)}
                    className={`pb-2 font-medium ${
                      activeAppointmentTab === tab.id
                        ? 'text-teal-700 border-b-2 border-teal-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            {clientDetailLoading ? (
              <div className="p-8 text-center"><Loader /></div>
            ) : (
              <div>
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
                        if (clientAppointmentSearchTerm && !apt.booking_resource_name?.toLowerCase().includes(clientAppointmentSearchTerm.toLowerCase())) {
                          return false;
                        }
                        if (activeAppointmentTab === 'all') return true;
                        if (activeAppointmentTab === 'upcoming') {
                          const sessionDate = apt.booking_date ? new Date(apt.booking_date) : new Date();
                          return sessionDate >= new Date() && apt.booking_status !== 'cancelled' && !apt.has_session_notes;
                        }
                        return getAppointmentStatus(apt) === activeAppointmentTab;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-gray-400 text-sm">No appointments found</td>
                        </tr>
                      ) : (
                        clientAppointments.filter(apt => {
                          if (clientAppointmentSearchTerm && !apt.booking_resource_name?.toLowerCase().includes(clientAppointmentSearchTerm.toLowerCase())) {
                            return false;
                          }
                          if (activeAppointmentTab === 'all') return true;
                          if (activeAppointmentTab === 'upcoming') {
                            const sessionDate = apt.booking_date ? new Date(apt.booking_date) : new Date();
                            return sessionDate >= new Date() && apt.booking_status !== 'cancelled' && !apt.has_session_notes;
                          }
                          return getAppointmentStatus(apt) === activeAppointmentTab;
                        }).map((apt, index) => (
                          <React.Fragment key={index}>
                            <tr 
                              className={`border-b cursor-pointer transition-colors ${
                                selectedAppointmentIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedAppointmentIndex(selectedAppointmentIndex === index ? null : index)}
                            >
                              <td className="px-4 py-3 text-sm">Individual Therapy Session</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{apt.session_timings}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{user.full_name || user.username}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                  getAppointmentStatus(apt) === 'completed' ? 'bg-green-100 text-green-700' :
                                  getAppointmentStatus(apt) === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  getAppointmentStatus(apt) === 'no_show' ? 'bg-orange-100 text-orange-700' :
                                  getAppointmentStatus(apt) === 'pending_notes' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {getAppointmentStatus(apt) === 'pending_notes' ? 'Pending Notes' :
                                   getAppointmentStatus(apt) === 'no_show' ? 'No Show' :
                                   getAppointmentStatus(apt) === 'scheduled' ? 'Scheduled' :
                                   getAppointmentStatus(apt).charAt(0).toUpperCase() + getAppointmentStatus(apt).slice(1)}
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
                                      onClick={() => handleSOSClickFromClient(apt)}
                                      disabled={apt.booking_status === 'cancelled'}
                                      className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                        apt.booking_status === 'cancelled'
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                          : 'border border-red-600 text-red-600 hover:bg-white'
                                      }`}
                                    >
                                      <span className="font-bold">SOS</span>
                                      Raise Ticket
                                    </button>
                                    <button
                                      onClick={() => handleViewSessionNotes(apt)}
                                      disabled={!apt.has_session_notes || apt.booking_status === 'cancelled'}
                                      className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                        !apt.has_session_notes || apt.booking_status === 'cancelled'
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                          : 'border border-blue-600 text-blue-600 hover:bg-white'
                                      }`}
                                    >
                                      <FileText size={16} />
                                      View Session Notes
                                    </button>
                                    <button
                                      onClick={() => handleFillSessionNotes(apt)}
                                      disabled={apt.has_session_notes || apt.booking_status === 'cancelled' || !isMeetingStarted(apt)}
                                      className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                        apt.has_session_notes || apt.booking_status === 'cancelled' || !isMeetingStarted(apt)
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
              </div>
            )}
                </div>
                </>
                )}

                {/* Sessions Tab */}
                {clientViewTab === 'sessions' && (
                  selectedProgressNoteId ? (
                    isFreeConsultationNote ? (
                      <FreeConsultationDetail 
                        noteId={selectedProgressNoteId}
                        onBack={() => {
                          setSelectedProgressNoteId(null);
                          setIsFreeConsultationNote(false);
                        }}
                      />
                    ) : (
                      <ProgressNoteDetail 
                        noteId={selectedProgressNoteId}
                        onBack={() => {
                          setSelectedProgressNoteId(null);
                          setIsFreeConsultationNote(false);
                        }}
                      />
                    )
                  ) : (
                    <ProgressNotesTab 
                      clientId={selectedClient.client_phone}
                      onViewNote={(noteId, isFreeConsult = false) => {
                        setSelectedProgressNoteId(noteId);
                        setIsFreeConsultationNote(isFreeConsult);
                      }}
                      hasFreeConsultation={clientSessionType.hasFreeConsultation}
                    />
                  )
                )}

                {/* Case History Tab */}
                {clientViewTab === 'caseHistory' && (
                  clientSessionType.hasPaidSessions ? (
                    <CaseHistoryTab clientId={selectedClient.client_phone} />
                  ) : (
                    // Show free consultation notes when only free consultation exists
                    selectedProgressNoteId ? (
                      <FreeConsultationDetail 
                        noteId={selectedProgressNoteId}
                        onBack={() => setSelectedProgressNoteId(null)}
                      />
                    ) : (
                      <div>
                        {/* Free Consultation Notes List */}
                        <FreeConsultationNotesList 
                          clientId={selectedClient.client_phone}
                          onViewNote={(noteId) => setSelectedProgressNoteId(noteId)}
                        />
                      </div>
                    )
                  )
                )}

                {/* Documents Tab */}
                {clientViewTab === 'documents' && clientSessionType.hasPaidSessions && (
                  <GoalTrackingTab 
                    clientId={selectedClient.client_phone}
                    clientName={selectedClient.client_name}
                  />
                )}
              </div>
            </div>
          </div>
        ) : activeView === 'clients' ? (
          renderMyClients()
        ) : activeView === 'appointments' ? (
          renderMyAppointments()
        ) : activeView === 'notifications' ? (
          <Notifications userRole="therapist" userId={user.id} />
        ) : activeView === 'settings' ? (
          <EditProfile user={user} onBack={() => setActiveView('dashboard')} />
        ) : activeView === 'changePassword' ? (
          <ChangePassword user={user} onBack={() => setActiveView('dashboard')} />
        ) : showCalendarView ? (
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setShowCalendarView(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <span className="text-2xl">←</span>
              </button>
              <h1 className="text-3xl font-bold">My Calendar</h1>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-700 mr-4">Session Mode:</h4>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All Sessions' },
                    { value: 'online', label: 'Online' },
                    { value: 'in-person', label: 'In-Person' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCalendarModeFilter(option.value as any)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        calendarModeFilter === option.value
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-teal-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-700 mr-4">Status:</h4>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'upcoming', label: 'Upcoming' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'completed', label: 'Completed' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCalendarStatusFilter(option.value as any)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        calendarStatusFilter === option.value
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-teal-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: 'calc(100vh - 200px)' }}>
              <TherapistCalendar 
                therapists={[{ name: user.full_name || user.username, therapist_id: user.id }]}
                selectedTherapistFilters={[user.full_name?.split(' ')[0] || user.username]}
                selectedModeFilter={calendarModeFilter}
                statusFilter={calendarStatusFilter}
                therapistId={user.id}
              />
            </div>
          </div>
        ) : (
          <div className="p-8">
            {dashboardLoading ? (
              <Loader />
            ) : (
            <>
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">Therapist Dashboard</h1>
                  <p className="text-gray-600">Welcome Back, {user.username}!</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowCalendarView(!showCalendarView)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <CalendarIcon size={16} />
                  My Calendar
                </button>
                <div className="relative" ref={dropdownRef}>
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

            {/* Stats Grid - Row 1 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {stats.slice(0, 3).map((stat, index) => (
                <div 
                  key={index} 
                  className={`bg-white rounded-lg p-6 border ${
                    stat.clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                  }`}
                  onClick={() => {
                    if (stat.clickable) {
                      setActiveView('appointments');
                      setActiveAppointmentTab('pending_notes');
                    }
                  }}
                >
                  <div className="text-sm text-gray-600 mb-2">{stat.title}</div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
              ))}
            </div>
            
            {/* Stats Grid - Row 2 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {stats.slice(3).map((stat, index) => (
                <div 
                  key={index + 3} 
                  className={`bg-white rounded-lg p-6 border ${
                    stat.clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                  }`}
                  onClick={() => {
                    if (stat.clickable) {
                      setActiveView('appointments');
                      setActiveAppointmentTab('pending_notes');
                    }
                  }}
                >
                  <div className="text-sm text-gray-600 mb-2">{stat.title}</div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
              ))}
              <div className="bg-white rounded-lg p-6 border">
                <div className="text-sm text-gray-600 mb-2">Active Clients</div>
                <div className="text-3xl font-bold" style={{ color: '#000000' }}>
                  {clients.filter(client => getClientStatus(client) === 'active').length}
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <div className="text-sm text-gray-600 mb-2">Inactive Clients</div>
                <div className="text-3xl font-bold" style={{ color: '#000000' }}>
                  {clients.filter(client => getClientStatus(client) === 'inactive').length}
                </div>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Upcoming Sessions</h2>
              </div>

              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full" ref={bookingActionsRef}>
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Therapy Type</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Mode</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Timings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                          No upcoming sessions
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking, index) => (
                        <React.Fragment key={index}>
                          <tr 
                            className={`border-b cursor-pointer transition-colors ${
                              selectedBookingIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedBookingIndex(selectedBookingIndex === index ? null : index)}
                          >
                            <td className="px-6 py-4">
                              <span 
                                className="text-teal-700 hover:underline cursor-pointer"
                                onClick={() => handleViewClientFromBooking(booking)}
                              >
                                {booking.client_name}
                              </span>
                            </td>
                            <td className="px-6 py-4">{booking.therapy_type}</td>
                            <td className="px-6 py-4">{booking.mode}</td>
                            <td className="px-6 py-4">{booking.session_timings}</td>
                          </tr>
                          {selectedBookingIndex === index && (
                            <tr className="bg-gray-100">
                              <td colSpan={4} className="px-6 py-4">
                                <div className="flex gap-3 justify-center">
                                  <button
                                    onClick={() => {
                                      handleReminderClick(booking);
                                      setSelectedBookingIndex(null);
                                    }}
                                    className="px-6 py-2 border border-gray-400 rounded-lg text-sm text-gray-700 hover:bg-white flex items-center gap-2"
                                  >
                                    <Send size={16} />
                                    Send Manual Reminder
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleSOSClick(booking);
                                      setSelectedBookingIndex(null);
                                    }}
                                    className="px-6 py-2 border border-red-600 rounded-lg text-sm text-red-600 hover:bg-white flex items-center gap-2"
                                  >
                                    <span className="font-bold">SOS</span>
                                    Raise Ticket
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
                <span className="text-sm text-gray-600">Showing {Math.min(10, bookings.length)} of {bookings.length} results</span>
                <div className="flex gap-2">
                  <button className="p-2 border rounded hover:bg-gray-50">←</button>
                  <button className="p-2 border rounded hover:bg-gray-50">→</button>
                </div>
              </div>
            </div>

            {/* Pending Session Notes */}
            <div className="bg-white rounded-lg border mt-8">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Pending Session Notes</h2>
                {appointments.filter(apt => getAppointmentStatus(apt) === 'pending_notes').length > 3 && (
                  <button
                    onClick={() => {
                      setActiveView('appointments');
                      setActiveAppointmentTab('pending_notes');
                    }}
                    className="text-sm text-teal-700 hover:text-teal-800 font-medium"
                  >
                    View More →
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" ref={appointmentActionsRef}>
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Client Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Therapy Type</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Timings</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Mode</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.filter(apt => getAppointmentStatus(apt) === 'pending_notes').length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                          No pending session notes
                        </td>
                      </tr>
                    ) : (
                      appointments
                        .filter(apt => getAppointmentStatus(apt) === 'pending_notes')
                        .slice(0, 3)
                        .map((appointment, index) => (
                          <React.Fragment key={index}>
                            <tr 
                              className={`border-b cursor-pointer transition-colors ${
                                selectedAppointmentIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedAppointmentIndex(selectedAppointmentIndex === index ? null : index)}
                            >
                              <td className="px-6 py-4">
                                <span 
                                  className="text-teal-700 hover:underline cursor-pointer"
                                  onClick={() => handleViewClientFromAppointment(appointment)}
                                >
                                  {appointment.client_name}
                                </span>
                              </td>
                              <td className="px-6 py-4">{appointment.session_name}</td>
                              <td className="px-6 py-4 text-sm">{appointment.session_timings}</td>
                              <td className="px-6 py-4">
                                {appointment.mode?.includes('_') 
                                  ? appointment.mode.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                                  : appointment.mode || 'Google Meet'
                                }
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-yellow-100 text-yellow-700">
                                  Pending Notes
                                </span>
                              </td>
                            </tr>
                            {selectedAppointmentIndex === index && (
                              <tr className="bg-gray-100">
                                <td colSpan={5} className="px-6 py-4">
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
                                      disabled={isMeetingEnded(appointment) || appointment.booking_status === 'cancelled'}
                                      className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                        isMeetingEnded(appointment) || appointment.booking_status === 'cancelled'
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                          : 'border border-gray-400 text-gray-700 hover:bg-white'
                                      }`}
                                    >
                                      <Send size={16} />
                                      Send Manual Reminder to Client
                                    </button>
                                    <button
                                      onClick={() => handleSOSClick(appointment)}
                                      disabled={appointment.booking_status === 'cancelled'}
                                      className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                        appointment.booking_status === 'cancelled'
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                          : 'border border-red-600 text-red-600 hover:bg-white'
                                      }`}
                                    >
                                      <span className="font-bold">SOS</span>
                                      Raise Ticket
                                    </button>
                                    <button
                                      onClick={() => handleViewSessionNotes(appointment)}
                                      disabled={!appointment.has_session_notes || appointment.booking_status === 'cancelled'}
                                      className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                        !appointment.has_session_notes || appointment.booking_status === 'cancelled'
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                          : 'border border-blue-600 text-blue-600 hover:bg-white'
                                      }`}
                                    >
                                      <FileText size={16} />
                                      View Session Notes
                                    </button>
                                    <button
                                      onClick={() => handleFillSessionNotes(appointment)}
                                      disabled={appointment.has_session_notes || appointment.booking_status === 'cancelled' || !isMeetingStarted(appointment)}
                                      className={`px-6 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                        appointment.has_session_notes || appointment.booking_status === 'cancelled' || !isMeetingStarted(appointment)
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

      {/* Case History Password Modal */}
      {showCaseHistoryPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Verify Password</h3>
            <p className="text-gray-600 mb-4">Please enter your password to view case history</p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={caseHistoryPassword}
                onChange={(e) => setCaseHistoryPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCaseHistoryPasswordSubmit()}
                placeholder="Enter your password"
                className="w-full px-4 py-2 pr-10 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            {caseHistoryPasswordError && (
              <p className="text-red-600 text-sm mb-4">{caseHistoryPasswordError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleCaseHistoryPasswordSubmit}
                className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
              >
                Verify
              </button>
              <button
                onClick={() => {
                  setShowCaseHistoryPasswordModal(false);
                  setCaseHistoryPassword('');
                  setCaseHistoryPasswordError('');
                  setShowPassword(false);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showSOSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-6 border-b bg-white rounded-t-lg flex-shrink-0">
              <h3 className="text-2xl font-bold text-red-600 mb-2">SOS Risk Assessment</h3>
              <p className="text-gray-600 mb-4">You're raising an SOS for client safety. Please answer the following so we can support you and the client appropriately:</p>
              
              {selectedSOSBooking && (
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><strong>Client:</strong> {selectedSOSBooking.client_name}</p>
                  <p><strong>Session:</strong> {selectedSOSBooking.session_name || selectedSOSBooking.therapy_type}</p>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Section 1: Risk Severity */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">1. Risk Severity</h4>
                
                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSosRiskSeverity(level)}
                        className={`flex-1 h-8 rounded-lg border-2 transition-all ${
                          sosRiskSeverity >= level
                            ? level === 1 ? 'bg-green-500 border-green-500'
                            : level === 2 ? 'bg-yellow-400 border-yellow-400'
                            : level === 3 ? 'bg-orange-400 border-orange-400'
                            : level === 4 ? 'bg-red-500 border-red-500'
                            : 'bg-red-700 border-red-700'
                            : 'bg-gray-100 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className={`text-sm font-medium ${
                          sosRiskSeverity >= level ? 'text-white' : 'text-gray-600'
                        }`}>
                          {level}
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Level Labels */}
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>None</span>
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                    <span>Severe</span>
                  </div>
                  
                  {/* Selected Level Description */}
                  {sosRiskSeverity > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        Level {sosRiskSeverity}: {
                          sosRiskSeverity === 1 ? 'None - no evidence of risk present'
                          : sosRiskSeverity === 2 ? 'Low - low or minor evidence of risk of harm to self or others'
                          : sosRiskSeverity === 3 ? 'Medium - moderate risk present'
                          : sosRiskSeverity === 4 ? 'High - high or major risk of harm/injury to self or others'
                          : 'Severe/catastrophic - immediate attention needed'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Current Risk Indicators */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">2. Current Risk Indicators</h4>
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  <div><span className="font-bold">Y</span> - Yes, Risk Present</div>
                  <div><span className="font-bold">N</span> - No Risk Present</div>
                  <div><span className="font-bold">U</span> - Unknown</div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { key: 'emotionalDysregulation', label: 'Severe emotional dysregulation' },
                    { key: 'physicalHarmIdeas', label: 'Physical harm to others or ideas of harming others' },
                    { key: 'drugAlcoholAbuse', label: 'Drug/Alcohol Abuse' },
                    { key: 'suicidalAttempt', label: 'Suicidal Attempt or plan to commit Suicide' },
                    { key: 'selfHarm', label: 'Deliberate Self Harm or ideas of self harm / suicidal ideation' },
                    { key: 'delusionsHallucinations', label: 'Delusions or hallucinations' },
                    { key: 'impulsiveness', label: 'Impulsiveness' },
                    { key: 'severeStress', label: 'Recent severe stress/life event' },
                    { key: 'socialIsolation', label: 'Social Isolation' },
                    { key: 'concernByOthers', label: 'Concern expressed by others (relatives, carers)' },
                    { key: 'other', label: 'Other (please specify)' }
                  ].map((item) => {
                    const selectedValue = sosRiskIndicators[item.key];
                    const bgColor = selectedValue === 'Y' ? 'bg-red-50' : 
                                   selectedValue === 'N' ? 'bg-green-50' : 
                                   selectedValue === 'U' ? 'bg-gray-100' : 'bg-gray-50';
                    
                    return (
                    <div key={item.key} className={`border rounded-lg p-4 ${bgColor} transition-colors duration-200`}>
                      <div className="flex items-start justify-between">
                        <label className="text-sm font-medium text-gray-700 flex-1 mr-4">
                          {item.label}
                        </label>
                        <div className="flex space-x-4">
                          {['Y', 'N', 'U'].map((option) => (
                            <label key={option} className={`flex items-center space-x-1 ${
                              item.key === 'other' && option === 'U' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            }`}>
                              <input
                                type="radio"
                                name={item.key}
                                value={option}
                                checked={sosRiskIndicators[item.key] === option}
                                disabled={item.key === 'other' && option === 'U'}
                                onChange={(e) => setSosRiskIndicators(prev => ({
                                  ...prev,
                                  [item.key]: e.target.value as 'Y' | 'N' | 'U'
                                }))}
                                className="text-red-600 focus:ring-red-500"
                              />
                              <span className="text-sm font-medium text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Other details input */}
                      {item.key === 'other' && sosRiskIndicators.other === 'Y' && (
                        <div className="mt-3">
                          <input
                            type="text"
                            value={sosOtherDetails}
                            onChange={(e) => setSosOtherDetails(e.target.value)}
                            placeholder="Please specify other risk factors..."
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              </div>

              {/* Section 3: Risk Summary */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">3. Risk Summary</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Give brief details of risks identified and any protective factors and what risk remains:
                  </label>
                  <textarea
                    value={sosRiskSummary}
                    onChange={(e) => setSosRiskSummary(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-300"
                    placeholder="Provide detailed risk assessment summary..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-6 border-t bg-white rounded-b-lg flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSOSModal(false);
                    setSosConfirmText('');
                    setSelectedSOSBooking(null);
                    // Reset form
                    setSosRiskSeverity(0);
                    setSosRiskIndicators({
                      emotionalDysregulation: '',
                      physicalHarmIdeas: '',
                      drugAlcoholAbuse: '',
                      suicidalAttempt: '',
                      selfHarm: '',
                      delusionsHallucinations: '',
                      impulsiveness: '',
                      severeStress: '',
                      socialIsolation: '',
                      concernByOthers: '',
                      other: ''
                    });
                    setSosOtherDetails('');
                    setSosRiskSummary('');
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSOSConfirm}
                  disabled={
                    sosRiskSeverity === 0 || 
                    Object.values(sosRiskIndicators).some(val => val === '') ||
                    sosRiskSummary.trim() === '' ||
                    (sosRiskIndicators.other === 'Y' && sosOtherDetails.trim() === '')
                  }
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    sosRiskSeverity > 0 && 
                    Object.values(sosRiskIndicators).every(val => val !== '') &&
                    sosRiskSummary.trim() !== '' &&
                    (sosRiskIndicators.other !== 'Y' || sosOtherDetails.trim() !== '')
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit SOS Assessment
                </button>
              </div>
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
      
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingNoteId ? 'Edit Note' : 'Add Note'}</h3>
            <textarea
              value={additionalNoteText}
              onChange={(e) => setAdditionalNoteText(e.target.value)}
              placeholder="Type your note here..."
              className="w-full h-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveAdditionalNote}
                className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddNoteModal(false);
                  setAdditionalNoteText('');
                  setEditingNoteId(null);
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
