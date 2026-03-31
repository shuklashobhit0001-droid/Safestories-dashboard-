import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import sessionBookedAnimation from '../session-booked.json';
import { 
  ChevronLeft, ChevronRight, Globe, Clock, Check, 
  CalendarCheck, User, Mail, MessageSquare, Video, MapPin, CreditCard,
  MessageCircle, Info, Calendar as CalendarIcon
} from 'lucide-react';
import moment from 'moment';
import './BookingPage.css';

interface BookingPageProps {
  session: {
    title: string;
    detailedDescription: string;
    duration: string;
    charges: string;
    owner: string;
    slug: string;
    label?: string;
  };
  onBack?: () => void;
  isPublic?: boolean;
}

export const BookingPage: React.FC<BookingPageProps> = ({ session, onBack, isPublic }) => {
  const [view, setView] = useState<'selection' | 'registration'>('selection');
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [showFull, setShowFull] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    whatsappCountryCode: '+91',
    name2: '',
    email2: '',
    whatsapp2: '',
    whatsapp2CountryCode: '+91',
    emergencyName: '',
    emergencyRelation: '',
    emergencyNumber: '',
    emergencyCountryCode: '+91',
    notes: '',
    location: 'google_meet' as 'google_meet' | 'in_person',
    paymentMethod: 'razorpay',
    agreedTerms: false
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [sessionCharges, setSessionCharges] = useState(session.charges);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookedDetails, setBookedDetails] = useState<any>(null);

  const formatTime = (timeStr: string) => {
    return moment(timeStr, 'HH:mm').format(timeFormat === '12h' ? 'h:mm A' : 'HH:mm');
  };

  const fetchSlots = async (date: moment.Moment) => {
    setIsLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);

    const getSimplifiedTherapyName = () => {
      const isFree = session.charges === '₹0' || session.charges === '0' || session.charges.toLowerCase().includes('free');
      if (isFree) return 'Free Consultation';
      
      if (!session.label) return session.title;
      const category = session.label.split('/')[0].toLowerCase();
      if (category === 'individual') return 'Individual Therapy';
      if (category === 'couple') return 'Couples Therapy';
      if (category === 'adolescent') return 'Adolescent Therapy';
      return session.title;
    };

    const payload = {
      selectedTherapy: getSimplifiedTherapyName(),
      selectedTherapist: session.owner === 'SafeStories' ? 'SafeStories' : session.owner,
      selectedDate: date.format('YYYY-MM-DD'),
      isFreeConsultation: session.charges === '₹0' || session.charges === '0' || session.charges.toLowerCase().includes('free'),
      timezone: 'Asia/Kolkata',
      isDirectBooking: false
    };

    try {
      const response = await fetch('/api/fetch-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0]['Available Slots']) {
          const rawSlots = data[0]['Available Slots'];
          const charges = data[0]['session charges'];
          if (charges) setSessionCharges(`₹${charges}`);

          if (rawSlots.length > 0) {
            const formattedSlots = rawSlots.map((slot: string) => {
              const d = new Date(slot);
              return moment(d).format('HH:mm');
            });
            setAvailableSlots(formattedSlots);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, session.owner, session.title]);

  const handleBookingSubmit = async () => {
    if (!formData.agreedTerms) {
      alert('Please agree to the Terms & Conditions');
      return;
    }

    const getSimplifiedTherapyName = () => {
      const isFree = session.charges === '₹0' || session.charges === '0' || session.charges.toLowerCase().includes('free');
      if (isFree) return 'Free Consultation';
      
      if (!session.label) return session.title;
      const category = session.label.split('/')[0].toLowerCase();
      if (category === 'individual') return 'Individual Therapy';
      if (category === 'couple') return 'Couples Therapy';
      if (category === 'adolescent') return 'Adolescent Therapy';
      return session.title;
    };

    setIsSubmitting(true);
    const payload = {
      therapyName: getSimplifiedTherapyName(),
      therapistName: session.owner,
      isFreeConsultation: session.charges === '₹0' || session.charges === '0' || session.charges.toLowerCase().includes('free'),
      date: selectedDate.format('YYYY-MM-DD'),
      slot: selectedSlot,
      clientName: formData.name,
      clientEmail: formData.email,
      clientWhatsApp: `${formData.whatsappCountryCode}${formData.whatsapp}`,
      partnerName: isCoupleSession ? formData.name2 : undefined,
      partnerEmail: isCoupleSession ? formData.email2 : undefined,
      partnerWhatsApp: isCoupleSession ? `${formData.whatsapp2CountryCode}${formData.whatsapp2}` : undefined,
      emergencyContactName: formData.emergencyName,
      emergencyContactRelation: formData.emergencyRelation,
      emergencyContactNumber: `${formData.emergencyCountryCode}${formData.emergencyNumber}`,
      sessionMode: formData.location === 'google_meet' ? 'online' : 'in-person',
      timezone: 'Asia/Kolkata',
      notes: formData.notes,
      amount: parseFloat(sessionCharges.replace('₹', '').replace(',', '')) || 0
    };

    try {
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setBookedDetails(payload);
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        alert(`Booking failed: ${errorData.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCalendarDays = () => {
    const start = currentMonth.clone().startOf('month');
    const end = currentMonth.clone().endOf('month');
    const days = [];
    for (let i = 0; i < start.day(); i++) {
      days.push(<div key={`e${i}`} className="cal-day empty" />);
    }
    for (let d = 1; d <= end.date(); d++) {
      const date = currentMonth.clone().date(d);
      const isSel = date.isSame(selectedDate, 'day');
      const isToday = date.isSame(moment(), 'day');
      const isPast = date.isBefore(moment(), 'day');
      const isSunday = date.day() === 0;
      const isDisabled = isPast || isSunday;

      days.push(
        <div
          key={d}
          className={`cal-day${isSel ? ' selected' : ''}${isToday ? ' today' : ''}${isDisabled ? ' disabled' : ''}`}
          onClick={() => {
            if (!isDisabled) {
              setSelectedDate(date);
              setSelectedSlot(null);
            }
          }}
        >
          {d}
        </div>
      );
    }
    return days;
  };

  const descLines = session.detailedDescription.split('\n').filter(Boolean);
  const preview = descLines.slice(0, 3);
  const hasMore = descLines.length > 3;
  const visibleLines = showFull ? descLines : preview;

  const isCoupleSession = session.title.toLowerCase().includes('couple');
  const isAdolescentSession = session.title.toLowerCase().includes('adolescent');

  const COUNTRY_CODES = [
    { code: '+91', label: 'IND' },
    { code: '+1', label: 'USA/CAN' },
    { code: '+44', label: 'UK' },
    { code: '+971', label: 'UAE' },
    { code: '+61', label: 'AUS' },
    { code: '+65', label: 'SGP' },
    { code: '+49', label: 'GER' },
    { code: '+33', label: 'FRA' },
    { code: '+81', label: 'JPN' }
  ];

  return (
    <div className="bp-root">
      <div className="bp-container">

        {/* ── LEFT: Session Summary ── */}
        <div className="bp-pane bp-summary">
          {!isPublic && onBack && (
            <button className="bp-back" onClick={onBack}>
              <ChevronLeft size={18} /> Back
            </button>
          )}

          {/* SafeStories Logo — matches dashboard style */}
          <div className="bp-logo">
            <div className="bp-logo-top">
              <span className="bp-safe">Safe</span>
              <svg width="48" height="32" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 6 }}>
                <path d="M15 5 H45 A12 12 0 0 1 57 17 V17 A12 12 0 0 1 45 29 H42 L38 38 L34 29 H15 A12 12 0 0 1 3 17 V17 A12 12 0 0 1 15 5 Z"
                  stroke="#21615D" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="16" cy="17" r="3" fill="#F4A936" />
                <circle cx="26" cy="17" r="3" fill="#F4A936" />
                <circle cx="36" cy="17" r="3" fill="#F4A936" />
                <circle cx="46" cy="17" r="3" fill="#F4A936" />
              </svg>
            </div>
            <span className="bp-stories">Stories</span>
          </div>

          <h1 className="bp-title">{session.title}</h1>

          <div className="bp-desc">
            {session.detailedDescription.split('\n\n').map((paragraph, i) => {
              const parts = paragraph.split('**');
              return (
                <p key={i} className="bp-desc-line" style={i > 0 ? { marginTop: 16 } : {}}>
                  {parts.map((part, index) => 
                    index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                  )}
                </p>
              );
            })}
          </div>
        </div>

        {view === 'selection' ? (
          <>
            {/* ── MIDDLE: Calendar ── */}
            <div className="bp-pane bp-calendar">
              <h2 className="bp-pane-title">Select a Date & Time</h2>

              <div className="bp-controls">
                <div className="bp-control-group">
                  <select className="bp-select"><option>{session.duration.split(' ')[0]}m</option></select>
                </div>
              </div>

              <div className="bp-cal-header">
                <button onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}>
                  <ChevronLeft size={20} />
                </button>
                <span className="bp-month">{currentMonth.format('MMMM YYYY')}</span>
                <button onClick={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}>
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="bp-day-headers">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="bp-cal-grid">
                {generateCalendarDays()}
              </div>
            </div>

            {/* ── RIGHT: Slots ── */}
            <div className="bp-pane bp-slots">
              <div className="bp-slots-top">
                <h2 className="bp-date-label">{selectedDate.format('MMM D, YYYY')}</h2>
                <div className="bp-fmt-toggle">
                  <button className={timeFormat === '12h' ? 'active' : ''} onClick={() => setTimeFormat('12h')}>12h</button>
                  <button className={timeFormat === '24h' ? 'active' : ''} onClick={() => setTimeFormat('24h')}>24h</button>
                </div>
              </div>
              <div className="bp-slots-list">
                {isLoadingSlots ? (
                  <div className="bp-loading-slots">
                    <div className="bp-spinner" />
                    <p>Loading slots...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  availableSlots.map((s, i) => (
                    <div 
                      key={i} 
                      className={`bp-slot available${selectedSlot === s ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedSlot(s);
                        setView('registration');
                      }}
                    >
                      <span className="bp-dot available" />
                      {formatTime(s)}
                    </div>
                  ))
                ) : (
                  <div className="bp-no-slots">
                    <p>No slots available for this date.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ── REGISTRATION FORM ── */
          <div className="bp-pane bp-registration">
            <div className="bp-reg-header">
              <button className="bp-reg-back" onClick={() => setView('selection')}>
                <ChevronLeft size={20} />
              </button>
              <h2 className="bp-reg-title">
                {isCoupleSession ? "Please Enter Your & Your Partner's Details" : "Registration"}
              </h2>
            </div>
            
            <div className="bp-reg-banner">
              <div className="bp-reg-date-box">
                <span className="bp-reg-month">{selectedDate.format('MMM').toUpperCase()}</span>
                <span className="bp-reg-day">{selectedDate.format('DD')}</span>
              </div>
              <div className="bp-reg-info">
                <h3 className="bp-reg-info-date">{selectedDate.format('dddd, D MMMM')}</h3>
                <p className="bp-reg-info-time">
                  {formatTime(selectedSlot!)} - {moment(selectedSlot, 'HH:mm').add(parseInt(session.duration), 'minutes').format(timeFormat === '12h' ? 'h:mm A' : 'HH:mm')} (GMT+5:30)
                </p>
              </div>
            </div>

            <div className="bp-reg-form">
              <div className="bp-form-field">
                <label>Name <span className="req">*</span></label>
                <input type="text" className="bp-input" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="bp-form-field">
                <label>Email address <span className="req">*</span></label>
                <input type="email" className="bp-input" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div className="bp-form-field">
                <label>Whatsapp {isCoupleSession ? 'number' : 'Number'} <span className="req">*</span></label>
                <div className="bp-phone-input">
                  <select 
                    className="bp-country-select"
                    value={formData.whatsappCountryCode}
                    onChange={e => setFormData({...formData, whatsappCountryCode: e.target.value})}
                  >
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label} ({c.code})</option>)}
                  </select>
                  <input type="tel" className="bp-input" 
                    value={formData.whatsapp} 
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
              </div>

              {isCoupleSession && (
                <>
                  <div className="bp-form-field">
                    <label>Partner's Name <span className="req">*</span></label>
                    <input type="text" className="bp-input" 
                      value={formData.name2} 
                      onChange={e => setFormData({...formData, name2: e.target.value})} />
                  </div>

                  <div className="bp-form-field">
                    <label>Partner's Email <span className="req">*</span></label>
                    <input type="email" className="bp-input" 
                      value={formData.email2} 
                      onChange={e => setFormData({...formData, email2: e.target.value})} />
                  </div>

                  <div className="bp-form-field">
                    <label>Partner's Whatsapp number <span className="req">*</span></label>
                    <div className="bp-phone-input">
                      <select 
                        className="bp-country-select"
                        value={formData.whatsapp2CountryCode}
                        onChange={e => setFormData({...formData, whatsapp2CountryCode: e.target.value})}
                      >
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label} ({c.code})</option>)}
                      </select>
                      <input type="tel" className="bp-input" 
                        value={formData.whatsapp2} 
                        onChange={e => setFormData({...formData, whatsapp2: e.target.value})} />
                    </div>
                  </div>
                </>
              )}

              {!isCoupleSession && (
                <>
                  <div className="bp-form-field">
                    <label>Emergency Contact Name</label>
                    <input type="text" className="bp-input" 
                      value={formData.emergencyName} 
                      onChange={e => setFormData({...formData, emergencyName: e.target.value})} />
                  </div>

                  <div className="bp-form-field">
                    <label>Emergency Contact Relation</label>
                    <input type="text" className="bp-input" 
                      value={formData.emergencyRelation} 
                      onChange={e => setFormData({...formData, emergencyRelation: e.target.value})} />
                  </div>

                  <div className="bp-form-field">
                    <label>Emergency Contact Number</label>
                    <div className="bp-phone-input">
                      <select 
                        className="bp-country-select"
                        value={formData.emergencyCountryCode}
                        onChange={e => setFormData({...formData, emergencyCountryCode: e.target.value})}
                      >
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label} ({c.code})</option>)}
                      </select>
                      <input type="tel" className="bp-input" 
                        value={formData.emergencyNumber} 
                        onChange={e => setFormData({...formData, emergencyNumber: e.target.value})} />
                    </div>
                  </div>
                </>
              )}

              <div className="bp-form-field">
                <label>Please share anything that will help prepare for our meeting</label>
                <textarea className="bp-textarea" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>

              <div className="bp-form-field checkbox-field-container">
                <p className="bp-terms-text">Please review the Terms & Conditions before completing your booking. <span className="req">*</span></p>
                <div className="checkbox-field">
                  <label className="bp-checkbox-label">
                    <input type="checkbox" checked={formData.agreedTerms} 
                      onChange={e => setFormData({...formData, agreedTerms: e.target.checked})} />
                    I confirm that I have read and agree to the Terms & Conditions.
                  </label>
                </div>
              </div>

              <div className="bp-reg-section">
                <h3 className="bp-section-title">Select Location</h3>
                <div className="bp-option-grid">
                  <div className={`bp-option-card ${formData.location === 'google_meet' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, location: 'google_meet'})}>
                    <div className="bp-option-header">
                      <div className="bp-option-icon meet">
                        <Video size={18} color="#00897b" /> <strong>Google Meet</strong>
                      </div>
                      {formData.location === 'google_meet' && <Check size={16} className="bp-check-icon" />}
                    </div>
                    <p className="bp-option-desc">Web conference using Google meet</p>
                  </div>
                  <div className={`bp-option-card ${formData.location === 'in_person' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, location: 'in_person'})}>
                    <div className="bp-option-header">
                      <div className="bp-option-icon">
                        <MapPin size={18} color="#21615D" /> <strong>In-person (SafeStories Office - Lullanagar, Pune, Maharashtra 411040)</strong>
                      </div>
                      {formData.location === 'in_person' && <Check size={16} className="bp-check-icon" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bp-reg-section">
                <h3 className="bp-section-title">Select Price</h3>
                <div className="bp-option-card active">
                  <div className="bp-option-header">
                    <div className="bp-option-icon">
                      <strong>₹{parseFloat(session.charges.replace('₹', '')).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <Check size={16} className="bp-check-icon" />
                  </div>
                  <p className="bp-option-desc">Session Charges</p>
                </div>
              </div>

              <div className="bp-reg-section">
                <h3 className="bp-section-title">Select Payment Method</h3>
                <div className={`bp-option-card ${formData.paymentMethod === 'razorpay' ? 'active' : ''}`}>
                  <div className="bp-option-header">
                    <div className="bp-option-icon">
                      <CreditCard size={18} color="#0052cc" /> <strong>Razorpay</strong>
                    </div>
                    <Check size={16} className="bp-check-icon" />
                  </div>
                </div>
              </div>

              {(isAdolescentSession) && (
                <div className="bp-add-guests">
                  <button className="bp-add-guests-btn" onClick={() => alert('Feature coming soon...')}>
                    <span>+</span> Add Guests
                  </button>
                </div>
              )}

              <div className="bp-reg-actions">
                <button 
                  className="bp-pay-btn" 
                  disabled={isSubmitting || !formData.agreedTerms || !formData.name || !formData.email || !formData.whatsapp}
                  onClick={handleBookingSubmit}
                >
                  {isSubmitting ? (
                    <><div className="bp-spinner-small" /> Processing...</>
                  ) : (
                    <><CalendarCheck size={18} /> Pay and Confirm</>
                  )}
                </button>
                <button className="bp-cancel-btn" onClick={() => setView('selection')}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center transform animate-in zoom-in duration-300">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center">
                  <Lottie 
                    animationData={sessionBookedAnimation}
                    loop={false}
                    style={{ width: 120, height: 120 }}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600 mb-6 font-medium">
                Your session with {session.owner} has been successfully scheduled.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left space-y-2 border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Date:</span>
                  <span className="text-gray-900 font-bold">{selectedDate.format('dddd, D MMMM')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Time:</span>
                  <span className="text-gray-900 font-bold">{formatTime(selectedSlot!)} (GMT+5:30)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Mode:</span>
                  <span className="text-gray-900 font-bold">{formData.location === 'google_meet' ? 'Online (Google Meet)' : 'In-person'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onBack) onBack();
                  else window.location.reload();
                }}
                className="w-full bg-teal-700 text-white font-bold py-4 rounded-xl hover:bg-teal-800 transition-colors shadow-lg shadow-teal-700/20"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
