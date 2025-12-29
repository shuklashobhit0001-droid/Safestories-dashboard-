import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { User, KeyRound } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-black mb-2">Welcome Back</h1>
        <p className="text-gray-500 text-sm font-medium">Sign in to access your dashboard</p>
      </div>

      <div className="space-y-4">
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
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end mt-2 mb-8">
        <a 
          href="#" 
          className="text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
        >
          Forgot Your Password?
        </a>
      </div>

      <Button type="submit" fullWidth className="text-lg" disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
};