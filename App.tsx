import React from 'react';
import { LoginForm } from './components/LoginForm';
import { HeroPanel } from './components/HeroPanel';
import { Logo } from './components/Logo';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Left Section - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16 relative">
        <div className="flex-none">
          <Logo />
        </div>
        
        <div className="flex-grow flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            <LoginForm />
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