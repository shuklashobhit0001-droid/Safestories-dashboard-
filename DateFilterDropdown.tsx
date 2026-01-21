import React, { useState, useRef, useEffect } from 'react';
import { PieChart, ChevronUp, ChevronDown } from 'lucide-react';

interface DateFilterDropdownProps {
  onDateRangeChange: (start: string, end: string) => void;
}

export const DateFilterDropdown: React.FC<DateFilterDropdownProps> = ({ onDateRangeChange }) => {
  const [selectedMonth, setSelectedMonth] = useState('All Time');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const monthOptions = ['Dec 2025', 'Nov 2025', 'Oct 2025', 'Sep 2025', 'Aug 2025', 'Jul 2025', 'Jun 2025', 'May 2025', 'Apr 2025', 'Mar 2025', 'Feb 2025', 'Jan 2025'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowCustomCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setIsDropdownOpen(false);
    setShowCustomCalendar(false);
    
    const [monthName, year] = month.split(' ');
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const monthNum = monthMap[monthName];
    const start = new Date(parseInt(year), monthNum, 1).toISOString().split('T')[0];
    const end = new Date(parseInt(year), monthNum + 1, 0).toISOString().split('T')[0];
    
    onDateRangeChange(start, end);
  };

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
      setSelectedMonth(`${startDate} to ${endDate}`);
      setShowCustomCalendar(false);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 border rounded-lg px-4 py-2"
        style={{ backgroundColor: '#2D757938' }}
      >
        <PieChart size={18} className="text-gray-600" />
        <span className="text-sm text-teal-700">{selectedMonth}</span>
        {isDropdownOpen ? (
          <ChevronUp size={16} className="text-teal-700" />
        ) : (
          <ChevronDown size={16} className="text-teal-700" />
        )}
      </button>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-10">
          {!showCustomCalendar ? (
            <>
              <button
                onClick={() => {
                  setSelectedMonth('All Time');
                  onDateRangeChange('', '');
                  setIsDropdownOpen(false);
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
  );
};
