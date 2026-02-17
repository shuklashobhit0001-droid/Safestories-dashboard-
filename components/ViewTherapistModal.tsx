import React from 'react';
import { X, User, Mail, Phone } from 'lucide-react';

interface ViewTherapistModalProps {
  therapist: any;
  onClose: () => void;
}

export const ViewTherapistModal: React.FC<ViewTherapistModalProps> = ({ therapist, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Therapist Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Profile Picture */}
        <div className="flex justify-center mb-6">
          {therapist.profile_picture_url ? (
            <img
              src={therapist.profile_picture_url}
              alt={therapist.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-teal-100"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-teal-100 flex items-center justify-center">
              <User size={48} className="text-teal-700" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Name</label>
            <p className="text-lg font-medium">{therapist.name}</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-gray-500" />
              <p className="text-lg">{therapist.email || therapist.contact_info || 'N/A'}</p>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Phone</label>
            <div className="flex items-center gap-2">
              <Phone size={18} className="text-gray-500" />
              <p className="text-lg">{therapist.phone_number || 'N/A'}</p>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Specializations</label>
            <div className="flex flex-wrap gap-2">
              {therapist.specialization?.split(',').map((spec: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: '#2D757930', color: '#2D7579' }}
                >
                  {spec.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
