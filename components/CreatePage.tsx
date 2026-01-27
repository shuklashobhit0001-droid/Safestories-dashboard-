import React from 'react';
import { Plus, MessageCircle, UserPlus } from 'lucide-react';

interface CreatePageProps {
  onCreateBooking: () => void;
  onSendBookingLink: () => void;
}

export const CreatePage: React.FC<CreatePageProps> = ({ onCreateBooking, onSendBookingLink }) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Create</h1>
      
      <div className="grid grid-cols-2 gap-6 max-w-4xl">
        {/* Create New Booking Card */}
        {!isProduction && (
          <div 
            onClick={onCreateBooking}
            className="bg-white rounded-lg border-2 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            style={{ borderColor: '#21615D' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#21615D' }}
              >
                <Plus size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: '#21615D' }}>Create New Booking</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Book a therapy session for a client by selecting therapy type, therapist, date, and time slot. 
              Send payment link directly to the client's WhatsApp or email.
            </p>
          </div>
        )}

        {/* Send Booking Link Card */}
        <div 
          onClick={onSendBookingLink}
          className="bg-white rounded-lg border-2 p-6 cursor-pointer hover:shadow-lg transition-shadow"
          style={{ borderColor: '#21615D' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#21615D' }}
            >
              <MessageCircle size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#21615D' }}>Send Booking Link</h2>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Send a personalized booking link directly to clients via WhatsApp when they call or inquire about booking a session.
          </p>
        </div>

        {/* Add New Therapist Card */}
        {!isProduction && (
          <div 
            className="bg-white rounded-lg border-2 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            style={{ borderColor: '#21615D' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#21615D' }}
              >
                <UserPlus size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: '#21615D' }}>Add New Therapist</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Add a new therapist to the platform with their details and availability.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
