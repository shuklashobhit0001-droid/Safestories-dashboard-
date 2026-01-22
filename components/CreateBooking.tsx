import React, { useState, useEffect, useRef } from 'react';

interface CreateBookingProps {
  onBack: () => void;
}

export const CreateBooking: React.FC<CreateBookingProps> = ({ onBack }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientWhatsApp, setClientWhatsApp] = useState('');
  const [selectedTherapy, setSelectedTherapy] = useState('');
  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [isFreeConsultation, setIsFreeConsultation] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [sessionMode, setSessionMode] = useState<'online' | 'in-person' | ''>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [therapies, setTherapies] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [filteredTherapists, setFilteredTherapists] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [sessionCharges, setSessionCharges] = useState(0);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableModes, setAvailableModes] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const dateContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTherapies();

    const handleClickOutside = (event: MouseEvent) => {
      if (dateContainerRef.current && !dateContainerRef.current.contains(event.target as Node)) {
        dateInputRef.current?.blur();
        setIsPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTherapies = async () => {
    try {
      const response = await fetch('/api/therapies');
      if (response.ok) {
        const data = await response.json();
        setTherapies(data);
      }
    } catch (error) {
      console.error('Error fetching therapies:', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue);
    
    if (dateValue) {
      const [year, month, day] = dateValue.split('-');
      setDisplayDate(`${day}/${month}/${year}`);
    } else {
      setDisplayDate('');
    }
    
    e.target.blur();
    setIsPickerOpen(false);
  };

  const handleCalendarIconClick = () => {
    if (isPickerOpen) {
      dateInputRef.current?.blur();
      setIsPickerOpen(false);
    } else {
      dateInputRef.current?.showPicker();
      setIsPickerOpen(true);
    }
  };

  const fetchTherapistsByTherapy = async (therapyName: string) => {
    try {
      const response = await fetch(`/api/therapists-by-therapy?therapy_name=${encodeURIComponent(therapyName)}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredTherapists(data);
      }
    } catch (error) {
      console.error('Error fetching therapists by therapy:', error);
    }
  };

  const handleTherapyChange = (therapy: string) => {
    setSelectedTherapy(therapy);
    setSelectedTherapist('');
    if (therapy) {
      fetchTherapistsByTherapy(therapy);
    } else {
      setFilteredTherapists([]);
    }
  };

  const isFormValid = () => {
    const hasDate = selectedDate.trim();
    if (isFreeConsultation) {
      return hasDate;
    }
    return hasDate && selectedTherapy && selectedTherapist;
  };

  const handleCheckSlots = async () => {
    console.log('Button clicked!');
    
    if (!isFormValid()) {
      alert('Please fill all required fields');
      return;
    }

    setIsLoadingSlots(true);
    
    const payload = {
      selectedTherapy: isFreeConsultation ? 'Free Consultation' : selectedTherapy,
      selectedTherapist: isFreeConsultation ? 'SafeStories' : selectedTherapist,
      selectedDate,
      isFreeConsultation,
    };
    
    console.log('Sending data:', payload);
    
    try {
      const response = await fetch('https://n8n.srv1169280.hstgr.cloud/webhook/b5ab584c-1203-41c0-b296-3107e2e6035e', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Response:', data);
        
        if (data && data.length > 0 && data[0]['Available Slots']) {
          const availableSlots = data[0]['Available Slots'];
          const charges = data[0]['session charges'] || 0;
          const modeString = data[0]['mode'] || '';
          
          setSessionCharges(charges || 0);
          
          // Parse mode string to extract available modes
          const modes: string[] = [];
          try {
            // Decode HTML entities first
            const decodedMode = modeString
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
            
            const parsedModes = JSON.parse(decodedMode);
            parsedModes.forEach((mode: any) => {
              if (mode.type === 'google_meet') modes.push('online');
              if (mode.type === 'physical') modes.push('in-person');
            });
          } catch (e) {
            console.error('Error parsing modes:', e);
            // Fallback: check if string contains mode types
            if (modeString.includes('google_meet')) modes.push('online');
            if (modeString.includes('physical')) modes.push('in-person');
          }
          
          setAvailableModes(modes);
          
          // Auto-select online if only google_meet is available
          if (modes.length === 1 && modes[0] === 'online') {
            setSessionMode('online');
          } else {
            setSessionMode('');
          }
          
          if (availableSlots.length > 0) {
            const formattedSlots = availableSlots.map((slot: string) => {
              const date = new Date(slot);
              return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            });
            setAvailableSlots(formattedSlots);
          } else {
            setAvailableSlots([]);
          }
        } else {
          setAvailableSlots([]);
          setSessionCharges(0);
          setAvailableModes([]);
        }
      } else {
        setAvailableSlots([]);
        setSessionCharges(0);
        setAvailableModes([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setAvailableSlots([]);
      setSessionCharges(0);
      setAvailableModes([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSendPaymentLink = async () => {
    console.log('Sending payment link...');
    
    const payload = {
      therapyName: isFreeConsultation ? 'Free Consultation' : selectedTherapy,
      therapistName: isFreeConsultation ? 'SafeStories' : selectedTherapist,
      isFreeConsultation,
      date: selectedDate,
      slot: selectedSlot,
      clientName,
      clientEmail,
      clientWhatsApp,
      sessionMode
    };
    
    try {
      const response = await fetch('https://n8n.srv1169280.hstgr.cloud/webhook/7ce18907-f7f2-425e-9d67-6751156172c7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        alert('Failed to send payment link');
      }
    } catch (error) {
      console.error('Error sending payment link:', error);
      alert('Error sending payment link');
    }
  };

  const isPaymentLinkEnabled = () => {
    return selectedSlot && clientName.trim() && clientEmail.trim() && clientWhatsApp.trim();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Payment Link Sent</h2>
            <p className="text-gray-600 mb-6">
              The payment link has been sent to the client. Once the payment is confirmed by the client, their session will be booked automatically.
            </p>
            <button
              onClick={onBack}
              className="w-full bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-800 font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-2xl text-gray-600 hover:text-gray-900">
          ←
        </button>
        <h1 className="text-3xl font-bold">Book a Session for Client</h1>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-[2fr_1fr] gap-8 max-w-7xl">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Therapy and Therapist Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Therapy</label>
              <div className="relative">
                <select
                  value={selectedTherapy}
                  onChange={(e) => handleTherapyChange(e.target.value)}
                  disabled={isFreeConsultation}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed pr-10"
                >
                  <option value="">Select</option>
                  {therapies.map((therapy, index) => (
                    <option key={index} value={therapy.therapy_name}>
                      {therapy.therapy_name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                  ▼
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Therapist</label>
              <div className="relative">
                <select
                  value={selectedTherapist}
                  onChange={(e) => setSelectedTherapist(e.target.value)}
                  disabled={isFreeConsultation}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed pr-10"
                >
                  <option value="">Select</option>
                  {filteredTherapists.map((therapist) => (
                    <option key={therapist.therapist_id} value={therapist.therapist_name}>
                      {therapist.therapist_name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div ref={dateContainerRef}>
            <label className="block text-sm font-medium mb-2">Select Date</label>
            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white pr-12"
              />
              <button
                type="button"
                onClick={handleCalendarIconClick}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xl"
              >
                📅
              </button>
            </div>
          </div>

          {/* Check Slots Button */}
          <button
            onClick={handleCheckSlots}
            disabled={!isFormValid() || isLoadingSlots}
            className="w-full bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-800 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoadingSlots ? 'Loading...' : 'Check Slots →'}
          </button>

          {/* Client Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Client Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Client Email Address<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter client email address"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Client WhatsApp No.<span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value="+91"
                disabled
                className="w-20 px-3 py-3 border rounded-lg bg-gray-50 text-center"
              />
              <input
                type="text"
                placeholder="Enter client whatsapp number"
                value={clientWhatsApp}
                onChange={(e) => setClientWhatsApp(e.target.value)}
                className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>

          {/* Session Mode */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sessionMode === 'online'}
                onChange={(e) => {
                  if (availableModes.length === 1 && availableModes[0] === 'online') return;
                  setSessionMode(e.target.checked ? 'online' : '');
                }}
                disabled={!availableModes.includes('online')}
                className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className={`text-sm ${!availableModes.includes('online') ? 'text-gray-400' : ''}`}>Online</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sessionMode === 'in-person'}
                onChange={(e) => setSessionMode(e.target.checked ? 'in-person' : '')}
                disabled={!availableModes.includes('in-person')}
                className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className={`text-sm ${!availableModes.includes('in-person') ? 'text-gray-400' : ''}`}>In-person</span>
            </label>
          </div>

          {/* Grand Total and Payment */}
          <div className="pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-600">Session Charges:</span>
              <span className="text-2xl font-bold">Rs. {grandTotal}/-</span>
            </div>
            <button
              onClick={handleSendPaymentLink}
              disabled={!isPaymentLinkEnabled()}
              className="w-full bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-800 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Send Payment Link
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Free Consultation */}
          <div>
            <label className="block text-sm font-medium mb-3">Is it a Free Consultation?</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isFreeConsultation === true}
                  onChange={() => {
                    setIsFreeConsultation(true);
                    setSelectedTherapy('');
                    setSelectedTherapist('');
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isFreeConsultation === false}
                  onChange={() => setIsFreeConsultation(false)}
                  className="w-4 h-4"
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <label className="block text-sm font-medium mb-3">Available Slots</label>
            <div className="bg-white rounded-lg p-4 shadow-sm max-h-[400px] overflow-y-auto">
              {availableSlots.length > 0 ? (
                <div className="space-y-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedSlot(selectedSlot === slot ? '' : slot);
                        setGrandTotal(selectedSlot === slot ? 0 : sessionCharges);
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedSlot === slot
                          ? 'bg-white border-2 border-teal-700 text-teal-700'
                          : 'text-gray-700 hover:opacity-80'
                      }`}
                      style={selectedSlot !== slot ? { backgroundColor: '#2D75792E' } : {}}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No slots available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
