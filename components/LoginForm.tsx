import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { User, KeyRound, Mail } from 'lucide-react';
import { CompleteProfileModal } from './CompleteProfileModal';

interface LoginFormProps {
  onLogin: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [loginMode, setLoginMode] = useState<'normal' | 'otp'>('normal');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/verify-therapist-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        // Show profile completion modal
        setPrefilledData(data.data);
        setShowProfileModal(true);
      } else {
        setError(data.error || 'Invalid email or OTP');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    setLoginMode('normal');
    setEmail('');
    setOtp('');
    alert('Profile created successfully! Please login with your email and password.');
  };

  return (
    <>
      <form onSubmit={loginMode === 'normal' ? handleNormalLogin : handleOTPLogin} className="w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-black mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm font-medium">
            {loginMode === 'normal' ? 'Sign in to access your dashboard' : 'First time login with OTP'}
          </p>
        </div>

        <div className="space-y-4">
          {loginMode === 'normal' ? (
            <>
              <Input 
                label="Username" 
                placeholder="enter email address or phone no." 
                icon={User}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              
              <Input 
                label="Password" 
                placeholder="enter password" 
                icon={KeyRound} 
                isPassword
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          ) : (
            <>
              <Input 
                label="Email" 
                placeholder="enter your email" 
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <Input 
                label="OTP" 
                placeholder="enter 6-digit OTP" 
                icon={KeyRound}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mt-2 mb-8">
          <button
            type="button"
            onClick={() => {
              setLoginMode(loginMode === 'normal' ? 'otp' : 'normal');
              setError('');
            }}
            className="text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
          >
            {loginMode === 'normal' ? 'First Time Login?' : 'Back to Normal Login'}
          </button>
          
          {loginMode === 'normal' && (
            <a 
              href="#" 
              className="text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
            >
              Forgot Your Password?
            </a>
          )}
        </div>

        <Button type="submit" fullWidth className="text-lg" disabled={loading}>
          {loading ? 'Please wait...' : (loginMode === 'normal' ? 'Log In' : 'Verify OTP')}
        </Button>
      </form>

      {showProfileModal && prefilledData && (
        <CompleteProfileModal
          onClose={() => setShowProfileModal(false)}
          onComplete={handleProfileComplete}
          prefilledData={prefilledData}
        />
      )}
    </>
  );
};