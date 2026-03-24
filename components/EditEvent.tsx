import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Copy, ExternalLink, Code, Save, 
  Settings, Clock, DollarSign, Shield, List, 
  RefreshCw, Share2, MoreHorizontal, Bold, Italic, 
  ListOrdered, Link, MessageCircle, ChevronDown, User as UserIcon,
  Loader2, AlertCircle
} from 'lucide-react';
import './EditEvent.css';

interface EditEventProps {
  event: {
    title: string;
    description: string;
    detailedDescription?: string;
    editViewDescription?: string;
    slug: string;
    owner: string;
    initialTab?: string;
    scheduleId?: number;
  };
  onBack: () => void;
  onSave: (updatedEvent: any) => void;
}

const EditEvent: React.FC<EditEventProps> = ({ event, onBack, onSave }) => {
  const [eventName, setEventName] = useState(event.title);
  const [description, setDescription] = useState(event.editViewDescription || event.detailedDescription || event.description);
  const [slug, setSlug] = useState(event.slug.replace('/', ''));
  const [activeTab, setActiveTab] = useState(event.initialTab || 'Basic');
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // DaySchedule API State
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePicker, setActivePicker] = useState<{ dayIdx: number, tIdx: number, field: 'start' | 'end', type: 'weekly' | 'override' } | null>(null);
  const [modalStartTime, setModalStartTime] = useState("09:00");
  const [modalEndTime, setModalEndTime] = useState("17:00");

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setActivePicker(null);
    if (activePicker) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activePicker]);

  useEffect(() => {
    if (activeTab === 'Schedule' && event.scheduleId && !scheduleData) {
      fetchSchedule();
    }
  }, [activeTab, event.scheduleId]);

  const fetchSchedule = async () => {
    try {
      setLoadingSchedule(true);
      setError(null);
      const response = await fetch(`/api/dayschedule/schedules/${event.scheduleId}`);
      if (!response.ok) throw new Error('Failed to fetch schedule');
      const data = await response.json();
      setScheduleData(data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!event.scheduleId || !scheduleData) return;

    try {
      setSaveLoading(true);
      const dayMap: { [key: string]: string } = {
        'SUN': 'sunday', 'MON': 'monday', 'TUE': 'tuesday', 'WED': 'wednesday', 
        'THU': 'thursday', 'FRI': 'friday', 'SAT': 'saturday'
      };

      // Ensure all 7 days are included in the update, even if missing from API response
      const daysToEnsure = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const finalAvailability = [...daysToEnsure.map(d => {
        const existing = scheduleData.availability.find((a: any) => a.day.toUpperCase() === d);
        return existing || { day: d, is_available: false, times: [{ start: '09:00', end: '17:00' }] };
      }), ...scheduleData.availability.filter((a: any) => /\d{4}-\d{2}-\d{2}/.test(a.day))];

      const cleanAvailability = finalAvailability.map((a: any) => ({
        day: dayMap[a.day] || a.day, 
        is_available: a.is_available,
        times: (a.times || []).map((t: any) => ({
          start: t.start,
          end: t.end
        }))
      }));

      const updateBody: any = {
        name: scheduleData.name,
        time_zone: scheduleData.time_zone,
        availability: cleanAvailability,
        is_default: false // Critical for 200 OK update
      };

      const response = await fetch(`/api/dayschedule/schedules/${event.scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody)
      });
      if (!response.ok) throw new Error('Failed to update schedule');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditingSchedule(false);
      
      // Delay refresh to allow DaySchedule API to process
      setTimeout(() => {
        fetchSchedule();
      }, 2000);
    } catch (err: any) {
      alert(`Error updating schedule: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleDayAvailabilityByName = (dayName: string) => {
    if (!scheduleData) return;
    const existingIndex = scheduleData.availability.findIndex((a: any) => a.day.toUpperCase() === dayName.toUpperCase());
    
    let newAvailability = [...scheduleData.availability];
    if (existingIndex > -1) {
      newAvailability[existingIndex] = { ...newAvailability[existingIndex], is_available: !newAvailability[existingIndex].is_available };
    } else {
      // Add missing day back
      newAvailability.push({ day: dayName.toUpperCase(), is_available: true, times: [{ start: '09:00', end: '17:00' }] });
    }
    setScheduleData({ ...scheduleData, availability: newAvailability });
  };

  const updateTimeRangeByName = (dayName: string, timeIndex: number, field: 'start' | 'end', value: string) => {
    if (!scheduleData) return;
    const existingIndex = scheduleData.availability.findIndex((a: any) => a.day.toUpperCase() === dayName.toUpperCase());
    
    let newAvailability = [...scheduleData.availability];
    if (existingIndex > -1) {
      const newTimes = [...newAvailability[existingIndex].times];
      newTimes[timeIndex] = { ...newTimes[timeIndex], [field]: value };
      newAvailability[existingIndex] = { ...newAvailability[existingIndex], times: newTimes };
    }
    setScheduleData({ ...scheduleData, availability: newAvailability });
  };

  const addOverride = () => {
    if (!scheduleData || !selectedDate) return;
    
    // Format date as YYYY-MM-DD
    const dateObj = new Date(calYear, calMonth, selectedDate);
    const dayStr = dateObj.toISOString().split('T')[0];
    
    const newOverride = {
      day: dayStr,
      is_available: overrideAvailability === 'available',
      times: overrideAvailability === 'available' ? [{ start: modalStartTime, end: modalEndTime }] : []
    };
    
    // Avoid duplicates
    const filtered = scheduleData.availability.filter((a: any) => a.day !== dayStr);
    setScheduleData({ 
      ...scheduleData, 
      availability: [...filtered, newOverride] 
    });
    setShowOverrideModal(false);
  };

  const deleteOverride = (dayStr: string) => {
    if (!scheduleData) return;
    const newAvailability = scheduleData.availability.filter((a: any) => a.day !== dayStr);
    setScheduleData({ ...scheduleData, availability: newAvailability });
  };

  // Calendar state
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());
  const [overrideAvailability, setOverrideAvailability] = useState<'available' | 'unavailable'>('available');

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const navItems = [
    { name: 'Basic', icon: <Settings size={18} /> },
    { name: 'Schedule', icon: <Clock size={18} /> },
  ];

  const handleSave = () => {
    onSave({
      ...event,
      title: eventName,
      description,
      slug: `/${slug}`
    });
  };

  const renderBasicTab = () => (
    <div className="tab-content-area">
      <div className="info-card">
        <div className="info-card-header">
          <h2 className="info-card-title">{eventName}</h2>
        </div>
        <div 
          className="info-card-description"
          dangerouslySetInnerHTML={{ __html: description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }}
        >
        </div>
      </div>
    </div>
  );

  const TimePicker = ({ current, onSelect }: { current: string, onSelect: (val: string) => void }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const [currH, currM] = current.split(':');
    
    const hRef = React.useRef<HTMLDivElement>(null);
    const mRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (hRef.current) hRef.current.scrollIntoView({ block: 'start' });
      if (mRef.current) mRef.current.scrollIntoView({ block: 'start' });
    }, []);

    return (
      <div className="custom-time-picker">
        <div className="picker-column">
          {hours.map(h => (
            <div 
              key={h} 
              ref={h === currH ? hRef : null}
              className={`picker-option ${h === currH ? 'selected' : ''}`}
              onClick={() => onSelect(`${h}:${currM || '00'}`)}
            >
              {h}
            </div>
          ))}
        </div>
        <div className="picker-column">
          {minutes.map(m => (
            <div 
              key={m} 
              ref={m === currM ? mRef : null}
              className={`picker-option ${m === currM ? 'selected' : ''}`}
              onClick={() => onSelect(`${currH || '09'}:${m}`)}
            >
              {m}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderScheduleTab = () => {
    if (isEditingSchedule) {
      return (
        <div className="edit-schedule-view full-width">
          <div className="edit-schedule-header">
            <div className="header-left">
              <button className="back-btn-pill" onClick={() => setIsEditingSchedule(false)}>
                <ArrowLeft size={16} />
              </button>
            </div>
            <div className="header-actions">
              <button className="cancel-btn" onClick={() => setIsEditingSchedule(false)}>Cancel</button>
              <button 
                className="update-btn" 
                onClick={handleUpdateSchedule}
                disabled={saveLoading}
              >
                {saveLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Schedule'}
              </button>
            </div>
          </div>

          <div className="edit-form-grid">
            {/* LEFT COLUMN */}
            <div className="form-column main">
              {/* Schedule Name + Timezone row */}
              <div className="fields-row">
                <div className="field">
                  <label className="field-label">Schedule Name</label>
                  <input className="field-input readonly" type="text" value={scheduleData?.name || "Loading..."} readOnly />
                </div>
                <div className="field">
                  <label className="field-label">Time zone</label>
                  <div className="dropdown-mock readonly">
                    <span>{scheduleData?.time_zone || "Calculating..."}</span>
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Weekly Availability */}
              <div className="availability-grid">
                <span className="section-label">Weekly Availability</span>
                {loadingSchedule ? (
                  <div className="loading-state">
                    <Loader2 className="animate-spin" />
                    <p>Fetching availability from DaySchedule...</p>
                  </div>
                ) : error ? (
                  <div className="error-state">
                    <AlertCircle className="text-red-500" />
                    <p>{error}</p>
                    <button onClick={fetchSchedule} className="retry-btn">Retry</button>
                  </div>
                ) : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((dayName, idx) => {
                  const avail = scheduleData?.availability.find((a: any) => a.day.toUpperCase() === dayName);
                  // Use finding by day name instead of direct index map to handle deleted days from API
                  const isAvailable = avail ? avail.is_available : false;
                  const times = avail ? avail.times : [{ start: '09:00', end: '17:00' }];
                  
                  return (
                  <div key={dayName} className="day-row">
                    <span className="day-label">{dayName}</span>
                    {!isAvailable ? (
                      <>
                        <span className="unavailable-text">Unavailable</span>
                        <div className="spacer" />
                        <div 
                          className="toggle-switch off" 
                          onClick={() => toggleDayAvailabilityByName(dayName)}
                        />
                      </>
                    ) : (
                      <>
                        <div className="time-range">
                          {times.map((time: any, tIdx: number) => (
                            <React.Fragment key={tIdx}>
                              <div className="time-input-wrap" onClick={(e) => {
                                e.stopPropagation();
                                setActivePicker({ dayIdx: idx, tIdx, field: 'start', type: 'weekly' });
                              }}>
                                <input 
                                  className="time-input" 
                                  type="text" 
                                  value={time.start} 
                                  readOnly
                                />
                                <Clock size={13} className="time-icon" />
                                {activePicker?.type === 'weekly' && activePicker.dayIdx === idx && activePicker.tIdx === tIdx && activePicker.field === 'start' && (
                                  <TimePicker 
                                    current={time.start} 
                                    onSelect={(val) => {
                                      updateTimeRangeByName(dayName, tIdx, 'start', val);
                                      setActivePicker(null);
                                    }} 
                                  />
                                )}
                              </div>
                              <span className="to-label">to</span>
                              <div className="time-input-wrap" onClick={(e) => {
                                e.stopPropagation();
                                setActivePicker({ dayIdx: idx, tIdx, field: 'end', type: 'weekly' });
                              }}>
                                <input 
                                  className="time-input" 
                                  type="text" 
                                  value={time.end} 
                                  readOnly
                                />
                                <Clock size={13} className="time-icon" />
                                {activePicker?.type === 'weekly' && activePicker.dayIdx === idx && activePicker.tIdx === tIdx && activePicker.field === 'end' && (
                                  <TimePicker 
                                    current={time.end} 
                                    onSelect={(val) => {
                                      updateTimeRangeByName(dayName, tIdx, 'end', val);
                                      setActivePicker(null);
                                    }} 
                                  />
                                )}
                              </div>
                            </React.Fragment>
                          ))}
                          <button className="icon-btn">+</button>
                          <button className="icon-btn"><Copy size={13} /></button>
                        </div>
                        <div 
                          className="toggle-switch on" 
                          onClick={() => toggleDayAvailabilityByName(dayName)}
                        />
                      </>
                    )}
                  </div>
                )})}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="form-column side">
              {/* Date Overrides */}
              <div className="override-section">
                <div className="override-header">
                  <span className="override-title">Date Overrides</span>
                  <button className="add-override-btn" onClick={() => setShowOverrideModal(true)}>+ Add Override</button>
                </div>
                
                {scheduleData?.availability.filter((a: any) => /\d{4}-\d{2}-\d{2}/.test(a.day)).length === 0 ? (
                  <div className="empty-override-box">
                    <p className="no-override-text">No date overrides</p>
                    <button className="add-override-inner-btn" onClick={() => setShowOverrideModal(true)}>+ Add Override</button>
                  </div>
                ) : (
                  <div className="overrides-edit-list">
                    {scheduleData.availability
                      .filter((a: any) => /\d{4}-\d{2}-\d{2}/.test(a.day))
                      .map((ov: any) => (
                        <div key={ov.day} className="override-edit-item">
                          <div className="override-info">
                            <span className="ov-date-label">
                              {new Date(ov.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="ov-time-label">
                              {ov.is_available ? ov.times.map((t: any) => `${t.start}-${t.end}`).join(', ') : 'Unavailable'}
                            </span>
                          </div>
                          <button className="delete-ov-btn" onClick={() => deleteOverride(ov.day)}>✕</button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Daily Limit */}
              <div className="limit-section">
                <span className="limit-title">Daily Limit</span>
                <p className="limit-hint">
                  Specify the daily limit you want to keep this schedule open for bookings. e.g: if
                  you specify 60 minutes - only two 30 minutes, or a single 1 hour meeting can be
                  accepted in a day.{' '}
                  <a href="#" className="learn-more-link">Learn more ↗</a>
                </p>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="dailyLimit" defaultChecked />
                    <span>No limit</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="dailyLimit" />
                    <span>Set daily limit</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

        {/* Add Date Override Modal */}
        {showOverrideModal && (
          <div className="modal-backdrop" onClick={() => setShowOverrideModal(false)}>
            <div className="override-modal" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Add Date Override</h2>
                  <p className="modal-subtitle">
                    Use date override to customize your schedule by selecting multiple dates for holidays, adjusted work hours, or special exceptions.{' '}
                    <a href="#" className="learn-more-link">Learn more ↗</a>
                  </p>
                </div>
                <button className="modal-close-btn" onClick={() => setShowOverrideModal(false)}>✕</button>
              </div>

              {/* Modal Body */}
              <div className="modal-body">
                {/* Calendar */}
                <div className="modal-calendar">
                  <div className="cal-nav">
                    <button className="cal-arrow" onClick={prevMonth}>‹</button>
                    <span className="cal-month-label">{MONTH_NAMES[calMonth]} {calYear}</span>
                    <button className="cal-arrow" onClick={nextMonth}>›</button>
                  </div>
                  <div className="cal-grid">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} className="cal-day-header">{d}</div>
                    ))}
                    {Array.from({ length: getFirstDayOfMonth(calMonth, calYear) }).map((_, i) => (
                      <div key={`empty-${i}`} className="cal-day empty" />
                    ))}
                    {Array.from({ length: getDaysInMonth(calMonth, calYear) }, (_, i) => i + 1).map(day => {
                      const thisDate  = new Date(calYear, calMonth, day);
                      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const isPast      = thisDate < todayDate;
                      const isSunday    = thisDate.getDay() === 0;
                      const isDisabled  = isPast || isSunday;
                      const isToday   = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                      const isSelected = day === selectedDate;
                      return (
                        <div
                          key={day}
                          className={`cal-day${isSelected ? ' selected' : ''}${isToday && !isSelected ? ' today' : ''}${isDisabled ? ' past' : ''}`}
                          onClick={() => !isDisabled && setSelectedDate(day)}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Panel */}
                <div className="modal-right">
                  {/* Availability */}
                  <div className="modal-section">
                    <span className="modal-section-title">Availability</span>
                    <label className="radio-label mt8">
                      <input type="radio" name="overrideAvail" checked={overrideAvailability === 'available'} onChange={() => setOverrideAvailability('available')} />
                      <span>Available</span>
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="overrideAvail" checked={overrideAvailability === 'unavailable'} onChange={() => setOverrideAvailability('unavailable')} />
                      <span>Unavailable</span>
                    </label>
                  </div>

                  {/* Time Slots */}
                  {overrideAvailability === 'available' && (
                    <div className="modal-section">
                      <span className="modal-section-title">Time Slots</span>
                      <div className="time-slot-row">
                        <div className="time-input-wrap" onClick={(e) => {
                          e.stopPropagation();
                          setActivePicker({ dayIdx: -1, tIdx: 0, field: 'start', type: 'override' });
                        }}>
                          <input className="time-input" type="text" value={modalStartTime} readOnly />
                          <Clock size={13} className="time-icon" />
                          {activePicker?.type === 'override' && activePicker.field === 'start' && (
                            <TimePicker 
                              current={modalStartTime} 
                              onSelect={(val) => {
                                setModalStartTime(val);
                                setActivePicker(null);
                              }} 
                            />
                          )}
                        </div>
                        <span className="to-label">to</span>
                        <div className="time-input-wrap" onClick={(e) => {
                          e.stopPropagation();
                          setActivePicker({ dayIdx: -1, tIdx: 0, field: 'end', type: 'override' });
                        }}>
                          <input className="time-input" type="text" value={modalEndTime} readOnly />
                          <Clock size={13} className="time-icon" />
                          {activePicker?.type === 'override' && activePicker.field === 'end' && (
                            <TimePicker 
                              current={modalEndTime} 
                              onSelect={(val) => {
                                setModalEndTime(val);
                                setActivePicker(null);
                              }} 
                            />
                          )}
                        </div>
                        <div className="time-input-wrap">
                          <input className="time-input label-input" type="text" placeholder="" />
                        </div>
                        <button className="icon-btn" onClick={(e) => e.preventDefault()}>+</button>
                        <button className="icon-btn" onClick={(e) => e.preventDefault()}><Copy size={13} /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowOverrideModal(false)}>Cancel</button>
                <button className="update-btn" onClick={addOverride}>Add Override</button>
              </div>
            </div>
          </div>
        )}
      </div>
      );
    }

    const weeklyDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const getWeeklyAvailability = () => {
      if (!scheduleData) return [];
      return weeklyDays.map(day => {
        const match = scheduleData.availability.find((a: any) => a.day.toUpperCase() === day.toUpperCase());
        return {
          day,
          time: match?.is_available && match.times.length > 0 
            ? match.times.map((t: any) => `${formatTime(t.start)} - ${formatTime(t.end)}`).join(', ')
            : 'Unavailable',
          active: match?.is_available || false
        };
      });
    };

    const getOverrides = () => {
      if (!scheduleData) return [];
      return scheduleData.availability.filter((a: any) => /\d{4}-\d{2}-\d{2}/.test(a.day));
    };

    return (
      <div className="main-schedule-view">
        <div className="schedule-card-header">
          <div className="title-block">
            <h3>Weekly Availability</h3>
            <p>Your default hours and time slot settings</p>
          </div>
          <div className="header-actions">
            <button className="edit-schedule-btn" onClick={() => setIsEditingSchedule(true)}>
              <Clock size={16} />
              Edit Schedule
            </button>
          </div>
        </div>

        {loadingSchedule ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={24} />
            <p>Loading schedule...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button onClick={fetchSchedule} className="retry-btn">Retry</button>
          </div>
        ) : (
          <>
            <div className="availability-visual-grid">
              {getWeeklyAvailability().map((item) => (
                <div key={item.day} className={`day-card ${!item.active ? 'inactive' : ''}`}>
                  <div className="day-header">{item.day}</div>
                  <div className="day-body">
                    {item.active ? (
                      <span className="time-pill">{item.time}</span>
                    ) : (
                      <span className="unavailable-pill">Unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {getOverrides().length > 0 && (
              <div className="overrides-summary-section">
                <h4 className="section-subtitle">Date Overrides</h4>
                <div className="overrides-list">
                  {getOverrides().map((ov: any) => (
                    <div key={ov.day} className="override-item-pill">
                      <span className="override-date">
                        {new Date(ov.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="override-time">
                        {ov.is_available && ov.times.length > 0 
                          ? ov.times.map((t: any) => `${formatTime(t.start)} - ${formatTime(t.end)}`).join(', ')
                          : 'Unavailable'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="schedule-meta">
          <div className="meta-item">
            <UserIcon size={16} />
            <span>Timezone: <strong>{scheduleData?.time_zone || 'Asia/Calcutta'}</strong></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="edit-event-container">
      <header className="edit-event-header">
        <div className="header-left-group">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-group">
            <h1>Event Info</h1>
            <p>Review and manage your therapy session details</p>
          </div>
        </div>
      </header>

      <div className="edit-tabs-nav">
        {navItems.map((item) => (
          <div 
            key={item.name}
            className={`nav-item ${activeTab === item.name ? 'active' : ''}`}
            onClick={() => setActiveTab(item.name)}
          >
            {item.icon}
            {item.name}
          </div>
        ))}
      </div>

      <main className="edit-event-content">
        <section className="main-form-area full-width">
          {activeTab === 'Basic' ? renderBasicTab() : renderScheduleTab()}
        </section>
      </main>

    </div>
  );
};

// Simple helper icon for the list item
const FileTextIcon = ({ size }: { size: number }) => (
  <svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

export default EditEvent;
