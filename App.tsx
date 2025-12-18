import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { HeroPanel } from './components/HeroPanel';
import { Logo } from './components/Logo';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { Monitor } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn.toString());
  }, [isLoggedIn]);

  if (isMobile) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100 p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
              <Monitor size={40} className="text-teal-700" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Desktop View Required</h1>
          <p className="text-gray-600 mb-2">Mobile view is not available yet.</p>
          <p className="text-gray-600">Please view this application on a desktop or laptop for the best experience.</p>
        </div>
      </div>
    );
  }

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  };

  if (isLoggedIn) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Left Section - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16 relative">
        <div className="flex-none">
          <Logo />
        </div>
        
        <div className="flex-grow flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            <LoginForm onLogin={handleLogin} />
          </div>
        </div>

        <div className="flex-none flex justify-center">
            <Footer />
        </div>
      </div>

      {/* Right Section - Hero Panel */}
      <div className="hidden md:flex md:w-1/2 p-4 h-screen">
        <HeroPanel />
      </div>
    </div>
  );
};

export default App;