import React, { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, icon: Icon, isPassword, className, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : props.type || 'text';

  return (
    <div className="mb-5">
      <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Icon size={20} strokeWidth={1.5} />
          </div>
        )}
        <input
          type={inputType}
          className={`
            w-full pl-10 pr-4 py-3 
            bg-white
            border border-gray-400 rounded-xl
            text-gray-600 placeholder-gray-400
            focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700
            transition-all duration-200
            ${isPassword ? 'pr-12' : ''}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? <Eye size={20} strokeWidth={1.5} /> : <EyeOff size={20} strokeWidth={1.5} />}
          </button>
        )}
      </div>
    </div>
  );
};