import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyles = "py-3 px-6 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-teal-700 hover:bg-teal-800 text-white shadow-md hover:shadow-lg focus:ring-teal-700",
    outline: "border-2 border-teal-700 text-teal-700 hover:bg-teal-50 focus:ring-teal-700",
    ghost: "text-teal-700 hover:bg-teal-50 hover:text-teal-800 focus:ring-teal-700"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};