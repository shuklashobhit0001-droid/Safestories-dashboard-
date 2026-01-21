import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

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
  const [sessionMode, setSessionMode] = useState<'online' | 'in-person' | ''>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [therapies, setTherapies] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState(2700);

  useEffect(() => {
    fetchTherapies();
    fetchTherapists();
    // Show default slots on load
    setAvailableSlots(['10:00AM', '10:30AM', '12:00PM', '12:30PM', '02:30PM', '04:00PM']);
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

  const fetchTherapists = async () => {
    try {
      const response = await fetch('/api/therapists');
      if (response.ok) {
        const data = await response.json();
        setTherapists(data);
      }
    } catch (error) {
      console.error('Error fetching therapists:', error);
    }
  };

  const handleCheckSlots = () => {
    const mockSlots = ['10:00AM', '10:30AM', '12:00PM', '12:30PM', '02:30PM', '04:00PM'];
    setAvailableSlots(mockSlots);
  };

  const handleSendPaymentLink = () => {
    console.log('Sending payment link...');
    onBack();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-2xl text-gray-600 hover:text-gray-900">
          ←
        </button>
        <h1 className="text-3xl font-bold">Book a Session for Client</h1>
      </div>

      {/* Form Content */}
      <div className="max-w-6xl">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Client Name */}
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

          {/* Client WhatsApp */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Client WhatsApp No.<span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value="+91"
                disabled
                className="w-16 px-3 py-3 border rounded-lg bg-gray-50 text-center"
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
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Client Email */}
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
            <div className="mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFreeConsultation}
                  onChange={(e) => setIsFreeConsultation(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Free Consultation</span>
              </label>
            </div>
          </div>

          {/* Select Therapy & Therapist */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Therapy</label>
              <select
                value={selectedTherapy}
                onChange={(e) => setSelectedTherapy(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
              >
                <option value="">Select</option>
                {therapies.map((therapy, index) => (
                  <option key={index} value={therapy.therapy_name}>
                    {therapy.therapy_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Therapist</label>
              <select
                value={selectedTherapist}
                onChange={(e) => setSelectedTherapist(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
              >
                <option value="">Select</option>
                {therapists.map((therapist) => (
                  <option key={therapist.therapist_id} value={therapist.name}>
                    {therapist.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date Selection & Available Slots */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Date</label>
            <div className="relative">
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                onFocus={(e) => e.target.type = 'date'}
                onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white pr-12"
              />
              <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <button
              onClick={handleCheckSlots}
              className="w-full mt-4 bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-800 flex items-center justify-center gap-2"
            >
              Check Slots →
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium">Available Slots</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sessionMode === 'online'}
                    onChange={(e) => setSessionMode(e.target.checked ? 'online' : '')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Online</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sessionMode === 'in-person'}
                    onChange={(e) => setSessionMode(e.target.checked ? 'in-person' : '')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">In-person</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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
          </div>
        </div>

        {/* Payment Section */}
        <div className="pt-6 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium text-gray-600">Grand Total:</span>
            <span className="text-2xl font-bold">Rs. {grandTotal}/-</span>
          </div>
          <button
            onClick={handleSendPaymentLink}
            className="w-full bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-800 font-medium"
          >
            Send Payment Link
          </button>
        </div>
      </div>
    </div>
  );
};
