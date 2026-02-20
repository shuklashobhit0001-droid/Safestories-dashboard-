import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface CountUpNumberProps {
  value: string | number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({ 
  value, 
  prefix = '', 
  suffix = '', 
  className = 'text-3xl font-bold',
  duration = 2000 
}) => {
  // Extract numeric value from string (handles cases like "₹1,234" or "41")
  const numericValue = typeof value === 'number' 
    ? value 
    : parseInt(value.replace(/[^0-9]/g, '')) || 0;

  const count = useCountUp({ end: numericValue, duration });

  // Format the number with commas if it's a large number
  const formatNumber = (num: number) => {
    if (prefix === '₹') {
      return num.toLocaleString('en-IN');
    }
    return num.toString();
  };

  return (
    <span className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};
