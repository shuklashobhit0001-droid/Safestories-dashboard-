import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, FileText, Wallet, LogOut, User, CalendarPlus, UserCircle } from 'lucide-react';
import { Logo } from './Logo';
import { ClientAppointments } from './ClientAppointments';
import { ClientCheckIns } from './ClientCheckIns';
import { ClientPayments } from './ClientPayments';
import { ClientProfile } from './ClientProfile';

interface ClientDashboardProps {
  onLogout: () => void;
  user: any;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onLogout, user }) => {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('clientActiveView') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('clientActiveView', activeView);
  }, [activeView]);

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
            style={{ backgroundColor: activeView === 'profile' ? '#2D75795C' : 'transparent' }}
            onClick={() => setActiveView('profile')}
          >
            <UserCircle size={20} className={activeView === 'profile' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'profile' ? 'text-teal-700' : 'text-gray-700'}>Profile</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'appointments' ? '#2D75795C' : 'transparent' }}
            onClick={() => setActiveView('appointments')}
          >
            <Calendar size={20} className={activeView === 'appointments' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'appointments' ? 'text-teal-700' : 'text-gray-700'}>My Bookings</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'checkins' ? '#2D75795C' : 'transparent' }}
            onClick={() => setActiveView('checkins')}
          >
            <FileText size={20} className={activeView === 'checkins' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'checkins' ? 'text-teal-700' : 'text-gray-700'}>Check-Ins</span>
          </div>
          <div 
            className="rounded-lg px-4 py-3 mb-2 flex items-center gap-3 cursor-pointer hover:bg-gray-100" 
            style={{ backgroundColor: activeView === 'payment' ? '#2D75795C' : 'transparent' }}
            onClick={() => setActiveView('payment')}
          >
            <Wallet size={20} className={activeView === 'payment' ? 'text-teal-700' : 'text-gray-700'} />
            <span className={activeView === 'payment' ? 'text-teal-700' : 'text-gray-700'}>Payment & Cancellation</span>
          </div>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 rounded-lg p-3 cursor-pointer" style={{ backgroundColor: '#2D757930' }} onClick={() => setActiveView('profile')}>
            <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{user?.full_name || user?.username}</div>
              <div className="text-xs text-gray-600">+91 75229 XXXXX</div>
            </div>
            <LogOut size={18} className="text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); onLogout(); }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'profile' ? (
          <ClientProfile user={user} />
        ) : activeView === 'appointments' ? (
          <ClientAppointments />
        ) : activeView === 'checkins' ? (
          <ClientCheckIns />
        ) : activeView === 'payment' ? (
          <ClientPayments />
        ) : (
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Hello {user?.full_name?.split(' ')[0] || user?.username},
              </h1>
              <p className="text-xl">
                Welcome to <span className="text-teal-700 font-semibold">SafeStories!</span>
              </p>
            </div>
            <button className="bg-gray-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-600">
              <CalendarPlus size={20} />
              Book a Session
            </button>
          </div>

          {/* Profile Completion */}
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Complete your profile!</h2>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col items-center" style={{ width: '33%' }}>
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Primary Information</span>
                </div>
                <div className="flex flex-col items-center" style={{ width: '33%' }}>
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Emergency Contact</span>
                </div>
                <div className="flex flex-col items-center" style={{ width: '33%' }}>
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Pre-therapy Questionnaires</span>
                </div>
              </div>
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300" style={{ zIndex: -1, width: '100%', marginLeft: '0' }}>
                <div className="h-full bg-green-500" style={{ width: '33%' }}></div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* My Therapist */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-6">My Therapist</h2>
              <div className="flex items-center justify-center h-64 text-gray-400">
                Therapist not assigned!
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-6">Upcoming Bookings</h2>
              <div className="mb-4">
                <div className="flex border-b">
                  <div className="flex-1 text-center py-2 text-sm font-medium text-gray-600">Session Timings</div>
                  <div className="flex-1 text-center py-2 text-sm font-medium text-gray-600">Therapy Type</div>
                  <div className="flex-1 text-center py-2 text-sm font-medium text-gray-600">Mode</div>
                </div>
              </div>
              <div className="flex items-center justify-center h-48 text-gray-400">
                No Booking Found!
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
