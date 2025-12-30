import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, UserCog, Calendar, CreditCard, LogOut, PieChart, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { AllClients } from './AllClients';
import { AllTherapists } from './AllTherapists';
import { Appointments } from './Appointments';
import { RefundsCancellations } from './RefundsCancellations';
import { SendBookingModal } from './SendBookingModal';

interface DashboardProps {
  onLogout: () => void;
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, user }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('All Time');
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const monthOptions = ['Dec 2025', 'Nov 2025', 'Oct 2025', 'Sep 2025', 'Aug 2025', 'Jul 2025', 'Jun 2025', 'May 2025', 'Apr 2025', 'Mar 2025', 'Feb 2025', 'Jan 2025'];

  const [stats, setStats] = useState([
    { title: 'Revenue', value: '₹0', lastMonth: '₹0' },
    { title: 'Sessions', value: '0', lastMonth: '0' },
    { title: 'Free Consultations', value: '0', lastMonth: '0' },
    { title: 'Cancelled', value: '0', lastMonth: '0' },
    { title: 'Refunds', value: '0', lastMonth: '0' },
    { title: 'No-shows', value: '0', lastMonth: '0' },
  ]);
  const [bookings, setBookings] = useState<any[]>([]);

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
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      const statsUrl = dateRange.start && dateRange.end 
        ? `/api/dashboard/stats?start=${dateRange.start}&end=${dateRange.end}`
        : '/api/dashboard/stats';
      const statsRes = await fetch(statsUrl);
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      
      setStats([
        { title: 'Revenue', value: `₹${Number(statsData.revenue || 0).toLocaleString()}`, lastMonth: '₹0' },
        { title: 'Sessions', value: (statsData.sessions || 0).toString(), lastMonth: '0' },
        { title: 'Free Consultations', value: (statsData.freeConsultations || 0).toString(), lastMonth: '0' },
        { title: 'Cancelled', value: (statsData.cancelled || 0).toString(), lastMonth: '0' },
        { title: 'Refunds', value: (statsData.refunds || 0).toString(), lastMonth: '0' },
        { title: 'No-shows', value: (statsData.noShows || 0).toString(), lastMonth: '0' },
      ]);

      const bookingsRes = await fetch(`/api/dashboard/bookings`);
      if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer" 
            style={{ backgroundColor: activeView === 'dashboard' ? '#2D75795C' : 'transparent' }}
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutDashboard size={20} className={activeView === 'dashboard' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'dashboard' ? 'text-teal-700' : 'text-gray-700'}>Dashboard</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'clients' ? '#2D75795C' : 'transparent' }}
            onClick={() => setActiveView('clients')}
          >
            <Users size={20} className={activeView === 'clients' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'clients' ? 'text-teal-700' : 'text-gray-700'}>All Clients</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'therapists' ? '#2D75795C' : 'transparent' }}
            onClick={() => setActiveView('therapists')}
          >
            <UserCog size={20} className={activeView === 'therapists' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'therapists' ? 'text-teal-700' : 'text-gray-700'}>All Therapists</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'appointments' ? '#2D75795C' : 'transparent' }}
            onClick={() => setActiveView('appointments')}
          >
            <Calendar size={20} className={activeView === 'appointments' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'appointments' ? 'text-teal-700' : 'text-gray-700'}>Appointments</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'refunds' ? '#2D75795C' : 'transparent' }}
            onClick={() => setActiveView('refunds')}
          >
            <CreditCard size={20} className={activeView === 'refunds' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'refunds' ? 'text-teal-700' : 'text-gray-700'}>Refunds & Cancellations</span>
          </div>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: '#2D757930' }}>
            <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{user?.full_name || user?.username}</div>
              <div className="text-xs text-gray-600">Role: Admin</div>
            </div>
            <LogOut size={18} className="text-red-500 cursor-pointer" onClick={onLogout} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        {activeView === 'clients' ? (
          <AllClients />
        ) : activeView === 'therapists' ? (
          <AllTherapists />
        ) : activeView === 'appointments' ? (
          <Appointments />
        ) : activeView === 'refunds' ? (
          <RefundsCancellations />
        ) : (
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-gray-600">Welcome Back, {user?.full_name || user?.username}!</p>
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
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border">
                <div className="text-sm text-gray-600 mb-2">{stat.title}</div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500">Last month: {stat.lastMonth}</div>
              </div>
            ))}
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Upcoming Bookings</h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-800"
              >
                <MessageCircle size={18} />
                Send Booking Link
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
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
                        No upcoming bookings
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{booking.client_name}</td>
                        <td className="px-6 py-4">{booking.therapy_type}</td>
                        <td className="px-6 py-4">{booking.mode}</td>
                        <td className="px-6 py-4">{booking.therapist_name}</td>
                        <td className="px-6 py-4">{booking.booking_start_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <span className="text-sm text-gray-600">Showing {bookings.length} result{bookings.length !== 1 ? 's' : ''}</span>
              <div className="flex gap-2">
                <button className="p-2 border rounded hover:bg-gray-50">←</button>
                <button className="p-2 border rounded hover:bg-gray-50">→</button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      {isModalOpen && <SendBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};
