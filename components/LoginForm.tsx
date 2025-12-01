import React from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { User, KeyRound } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempted");
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
        />
        
        <Input 
          label="Password" 
          placeholder="enter password" 
          icon={KeyRound} 
          isPassword
        />
      </div>

      <div className="flex justify-end mt-2 mb-8">
        <a 
          href="#" 
          className="text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
        >
          Forgot Your Password?
        </a>
      </div>

      <Button type="submit" fullWidth className="text-lg">
        Log In
      </Button>
    </form>
  );
};