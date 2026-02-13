import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, UserCog, Calendar, CreditCard, LogOut, PieChart, MessageCircle, ChevronUp, ChevronDown, FileText, Bell, Copy, Send, Plus, User, Eye } from 'lucide-react';
import { Logo } from './Logo';
import { AllClients } from './AllClients';
import { AllTherapists } from './AllTherapists';
import { Appointments } from './Appointments';
import { RefundsCancellations } from './RefundsCancellations';
import { SendBookingModal } from './SendBookingModal';
import { CreateBooking } from './CreateBooking';
import { CreatePage } from './CreatePage';
import { NewTherapist } from './NewTherapist';
import { AuditLogs } from './AuditLogs';
import { Notifications } from './Notifications';
import { Loader } from './Loader';
import { Toast } from './Toast';
import { ChangePassword } from './ChangePassword';
import { AdminEditProfile } from './AdminEditProfile';

interface DashboardProps {
  onLogout: () => void;
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user }) => {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('adminActiveView') || 'dashboard';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<any>(() => {
    const saved = localStorage.getItem('selectedClientForView');
    return saved ? JSON.parse(saved) : null;
  });
  const [clientViewSource, setClientViewSource] = useState<string>(() => {
    return localStorage.getItem('clientViewSource') || '';
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('adminActiveView', activeView);
    if (activeView !== 'therapists') {
      setSelectedClientForView(null);
      setClientViewSource('');
      localStorage.removeItem('selectedClientForView');
      localStorage.removeItem('clientViewSource');
    }
  }, [activeView]);

  useEffect(() => {
    if (selectedClientForView) {
      localStorage.setItem('selectedClientForView', JSON.stringify(selectedClientForView));
    } else {
      localStorage.removeItem('selectedClientForView');
    }
  }, [selectedClientForView]);

  useEffect(() => {
    if (clientViewSource) {
      localStorage.setItem('clientViewSource', clientViewSource);
    } else {
      localStorage.removeItem('clientViewSource');
    }
  }, [clientViewSource]);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('All Time');
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

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
    { title: 'Revenue', value: '₹0', lastMonth: '₹0' },
    { title: 'Refunded', value: '₹0', lastMonth: '₹0' },
    { title: 'Bookings', value: '0', lastMonth: '0' },
    { title: 'Sessions Completed', value: '0', lastMonth: '0' },
    { title: 'Free Consultations', value: '0', lastMonth: '0' },
    { title: 'Cancelled', value: '0', lastMonth: '0' },
    { title: 'Refunds', value: '0', lastMonth: '0' },
    { title: 'No Show', value: '0', lastMonth: '0' },
  ]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const bookingsPerPage = 3;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedBookingIndex, setSelectedBookingIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [liveSessionsCount, setLiveSessionsCount] = useState(0);
  const bookingActionsRef = React.useRef<HTMLTableElement>(null);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  const resetAllStates = () => {
    setIsModalOpen(false);
    setIsDateDropdownOpen(false);
    setShowCustomCalendar(false);
    setSelectedBookingIndex(null);
    setSelectedClientForView(null);
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalBookings / bookingsPerPage);
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      const startIndex = (nextPage - 1) * bookingsPerPage;
      const endIndex = startIndex + bookingsPerPage;
      setBookings(allBookings.slice(startIndex, endIndex));
      setSelectedBookingIndex(null);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      const startIndex = (prevPage - 1) * bookingsPerPage;
      const endIndex = startIndex + bookingsPerPage;
      setBookings(allBookings.slice(startIndex, endIndex));
      setSelectedBookingIndex(null);
    }
  };

  const copyBookingDetails = (booking: any) => {
    const details = `${booking.therapy_type}\n${booking.booking_start_at}\nTime zone: Asia/Kolkata\n${booking.mode} joining info${booking.booking_joining_link ? `\nVideo call link: ${booking.booking_joining_link}` : ''}`;
    navigator.clipboard.writeText(details).then(() => {
      setToast({ message: 'Booking details copied to clipboard!', type: 'success' });
    }).catch(() => {
      setToast({ message: 'Failed to copy details', type: 'error' });
    });
  };

  const handleReminderClick = (booking: any) => {
    setSelectedBooking(booking);
    setShowReminderModal(true);
  };

  const sendWhatsAppNotification = async () => {
    if (!selectedBooking) return;
    const webhookData = {
      sessionTimings: selectedBooking.booking_start_at,
      sessionName: selectedBooking.therapy_type,
      clientName: selectedBooking.client_name,
      phone: selectedBooking.client_phone,
      email: selectedBooking.client_email,
      therapistName: selectedBooking.therapist_name,
      mode: selectedBooking.mode,
      meetingLink: selectedBooking.booking_joining_link || '',
      checkinUrl: selectedBooking.booking_checkin_url || ''
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
    setSelectedBooking(null);
  };

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
    const start = `${year}-${String(monthNum + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), monthNum + 1, 0).getDate();
    const end = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
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
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => {
    const fetchLiveCount = async () => {
      try {
        const response = await fetch('/api/live-sessions-count');
        if (response.ok) {
          const data = await response.json();
          setLiveSessionsCount(data.liveCount);
        }
      } catch (error) {
        console.error('Error fetching live sessions count:', error);
      }
    };

    fetchLiveCount();
    const interval = setInterval(fetchLiveCount, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
        setShowCustomCalendar(false);
      }
      if (bookingActionsRef.current && !bookingActionsRef.current.contains(event.target as Node)) {
        setSelectedBookingIndex(null);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin profile picture
      try {
        const profileRes = await fetch(`/api/admin-profile?user_id=${user.id}`);
        if (profileRes.ok) {
          const contentType = profileRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const profileData = await profileRes.json();
            if (profileData.success && profileData.data.profile_picture_url) {
              setProfilePictureUrl(profileData.data.profile_picture_url);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
      
      const statsUrl = dateRange.start && dateRange.end 
        ? `/api/dashboard/stats?start=${dateRange.start}&end=${dateRange.end}`
        : '/api/dashboard/stats';
      const statsRes = await fetch(statsUrl);
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      
      setStats([
        { title: 'Revenue', value: `₹${Number(statsData.revenue || 0).toLocaleString('en-IN')}`, lastMonth: '₹0' },
        { title: 'Refunded', value: `₹${Number(statsData.refundedAmount || 0).toLocaleString('en-IN')}`, lastMonth: '₹0' },
        { title: 'Bookings', value: (statsData.bookings || 0).toString(), lastMonth: '0' },
        { title: 'Sessions Completed', value: (statsData.sessionsCompleted || 0).toString(), lastMonth: '0' },
        { title: 'Free Consultations', value: (statsData.freeConsultations || 0).toString(), lastMonth: '0' },
        { title: 'Cancelled', value: (statsData.cancelled || 0).toString(), lastMonth: '0' },
        { title: 'Refunds', value: (statsData.refunds || 0).toString(), lastMonth: '0' },
        { title: 'No Show', value: (statsData.noShows || 0).toString(), lastMonth: '0' },
      ]);

      // Fetch all bookings (with a high limit to get total count)
      const bookingsRes = await fetch(`/api/dashboard/bookings?limit=1000`);
      if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
      const bookingsData = await bookingsRes.json();
      setAllBookings(bookingsData);
      setTotalBookings(bookingsData.length);
      
      // Set initial page bookings
      setCurrentPage(1);
      setBookings(bookingsData.slice(0, bookingsPerPage));

      const notificationsRes = await fetch(`/api/notifications?user_id=${user?.id}&user_role=admin`);
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.slice(0, 2));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 flex justify-center">
          <Logo size="small" />
        </div>

        <nav className="flex-1 px-4">
          <div 
            className="rounded-xl px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:opacity-90" 
            style={{ backgroundColor: '#21615D' }}
            onClick={() => {
              resetAllStates();
              setActiveView('create');
            }}
          >
            <Plus size={20} className="text-white" />
            <span className="text-white">Create</span>
          </div>
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
            <span className={activeView === 'clients' ? 'text-teal-700' : 'text-gray-700'}>All Clients</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'therapists' ? '#2D75795C' : 'transparent' }}
            onClick={() => {
              resetAllStates();
              setActiveView('therapists');
            }}
          >
            <UserCog size={20} className={activeView === 'therapists' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'therapists' ? 'text-teal-700' : 'text-gray-700'}>All Therapists</span>
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
            <span className={activeView === 'appointments' ? 'text-teal-700' : 'text-gray-700'}>Appointments</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'refunds' ? '#2D75795C' : 'transparent' }}
            onClick={() => {
              resetAllStates();
              setActiveView('refunds');
            }}
          >
            <CreditCard size={20} className={activeView === 'refunds' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'refunds' ? 'text-teal-700' : 'text-gray-700'}>Payments</span>
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

        <div className="px-4 mb-4 pt-4 border-t">
          <div 
            className="rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'audit' ? '#2D75795C' : 'transparent' }}
            onClick={() => {
              resetAllStates();
              setActiveView('audit');
            }}
          >
            <FileText size={20} className={activeView === 'audit' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'audit' ? 'text-teal-700' : 'text-gray-700'}>Audit Logs</span>
          </div>
        </div>

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
                <User size={18} className="text-gray-600" />
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
                  {import.meta.env.MODE === 'development' ? 'Change/Forgot Password' : 'Change Password'}
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
              <div className="font-semibold text-sm">{user?.full_name || user?.username}</div>
              <div className="text-xs text-gray-600">Role: Admin</div>
            </div>
            <LogOut size={18} className="text-red-500 cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        {activeView === 'settings' ? (
          <AdminEditProfile user={user} onBack={() => setActiveView('dashboard')} />
        ) : activeView === 'changePassword' ? (
          <ChangePassword user={user} onBack={() => setActiveView('dashboard')} />
        ) : activeView === 'create' ? (
          <CreatePage 
            onCreateBooking={() => setActiveView('createBooking')} 
            onSendBookingLink={() => setIsModalOpen(true)}
            onAddNewTherapist={() => setActiveView('newTherapist')}
          />
        ) : activeView === 'createBooking' ? (
          <CreateBooking onBack={() => setActiveView('create')} />
        ) : activeView === 'newTherapist' ? (
          <NewTherapist onBack={() => setActiveView('create')} />
        ) : activeView === 'clients' ? (
          <AllClients onClientClick={(client) => {
            setSelectedClientForView(client);
            setClientViewSource('clients');
            setActiveView('therapists');
          }} onCreateBooking={() => setActiveView('createBooking')} />
        ) : activeView === 'therapists' ? (
          <AllTherapists 
            selectedClientProp={selectedClientForView} 
            onBack={() => {
              const sourceView = clientViewSource || 'therapists';
              setSelectedClientForView(null);
              setClientViewSource('');
              localStorage.removeItem('selectedClientForView');
              localStorage.removeItem('clientViewSource');
              setActiveView(sourceView);
            }}
          />
        ) : activeView === 'appointments' ? (
          <Appointments onClientClick={(client) => {
            setSelectedClientForView(client);
            setClientViewSource('appointments');
            setActiveView('therapists');
          }} onCreateBooking={() => setActiveView('createBooking')} />
        ) : activeView === 'refunds' ? (
          <RefundsCancellations />
        ) : activeView === 'audit' ? (
          <AuditLogs />
        ) : activeView === 'notifications' ? (
          <Notifications userRole="admin" userId={user?.id} />
        ) : loading ? (
          <Loader />
        ) : (
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-gray-600">Welcome Back, {user?.full_name || user?.username}!</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 border rounded-lg px-4 py-2 bg-white hover:bg-gray-50">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium">Live Sessions: {liveSessionsCount}</span>
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
                        <div className="max-h-60 overflow-y-auto">
                          {monthOptions.map((month) => (
                            <button
                              key={month}
                              onClick={() => handleMonthSelect(month)}
                              className="w-full px-4 py-2 text-center text-sm hover:bg-gray-100"
                            >
                              {month}
                            </button>
                          ))}
                        </div>
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
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border">
                <div className="text-sm text-gray-600 mb-2">{stat.title}</div>
                <div className="text-3xl font-bold">{stat.value}</div>
              </div>
            ))}
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
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Assigned Therapist</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Session Timings</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Booking object:', booking);
                                setSelectedClientForView({
                                  invitee_name: booking.client_name,
                                  invitee_email: booking.client_email,
                                  invitee_phone: booking.client_phone
                                });
                                setClientViewSource('dashboard');
                                setActiveView('therapists');
                              }}
                              className="text-teal-700 hover:underline font-medium"
                            >
                              {booking.client_name}
                            </button>
                          </td>
                          <td className="px-6 py-4">{booking.therapy_type}</td>
                          <td className="px-6 py-4">{booking.mode}</td>
                          <td className="px-6 py-4">{booking.therapist_name}</td>
                          <td className="px-6 py-4">{booking.booking_start_at}</td>
                        </tr>
                        {selectedBookingIndex === index && (
                          <tr className="bg-gray-100">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="flex gap-3 justify-center">
                                <button
                                  onClick={() => copyBookingDetails(booking)}
                                  className="px-6 py-2 border border-gray-400 rounded-lg text-sm text-gray-700 hover:bg-white flex items-center gap-2"
                                >
                                  <Copy size={16} />
                                  Copy to Clipboard
                                </button>
                                <button
                                  onClick={() => handleReminderClick(booking)}
                                  className="px-6 py-2 rounded-lg text-sm flex items-center gap-2 border border-gray-400 text-gray-700 hover:bg-white"
                                >
                                  <Send size={16} />
                                  Send Manual Reminder to Client
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
              <span className="text-sm text-gray-600">
                Showing {((currentPage - 1) * bookingsPerPage) + 1}-{Math.min(currentPage * bookingsPerPage, totalBookings)} of {totalBookings} result{totalBookings !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`p-2 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  ←
                </button>
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage >= Math.ceil(totalBookings / bookingsPerPage)}
                  className={`p-2 border rounded ${currentPage >= Math.ceil(totalBookings / bookingsPerPage) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  →
                </button>
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
        </div>
        )}
      </div>
      {isModalOpen && <SendBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showReminderModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Sending Manual Reminder</h3>
            <p className="text-gray-600 mb-4">This will send a reminder message to {selectedBooking.client_name} on Whatsapp</p>
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
                  setSelectedBooking(null);
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
