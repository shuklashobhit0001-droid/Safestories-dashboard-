import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface ClientProfileProps {
  user: any;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    whatsappNo: '',
    email: '',
    emergencyContactName: '',
    emergencyContactNumber: ''
  });
  const [originalData, setOriginalData] = useState({ ...profileData });

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`/api/client-profile?userId=${user.id}`);
      const data = await response.json();
      const profile = {
        fullName: data.full_name || user.full_name || '',
        whatsappNo: data.whatsapp_no || '',
        email: data.email || '',
        emergencyContactName: data.emergency_contact_name || '',
        emergencyContactNumber: data.emergency_contact_number || ''
      };
      setProfileData(profile);
      setOriginalData(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      await fetch('/api/client-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...profileData })
      });
      setOriginalData({ ...profileData });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleCancel = () => {
    setProfileData({ ...originalData });
    setIsEditing(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit or Update your profile' : 'Welcome to Profile!'}</h1>
        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-800"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="border-2 border-red-500 text-red-500 px-6 py-3 rounded-lg hover:bg-red-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-800"
          >
            Edit/Update Profile
          </button>
        )}
      </div>

      <div className="flex gap-8">
        <div className="flex-1">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Full Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profileData.fullName}
              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="Enter full name"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              WhatsApp No.<span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value="+91"
                disabled
                className="w-20 px-4 py-3 border rounded-lg bg-gray-100"
              />
              <input
                type="text"
                value={profileData.whatsappNo}
                onChange={(e) => setProfileData({ ...profileData, whatsappNo: e.target.value })}
                disabled={!isEditing}
                className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${!isEditing ? 'bg-gray-50' : ''}`}
                placeholder="Enter WhatsApp number"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder={isEditing ? 'Enter your email address (optional)' : 'email not updated...'}
            />
          </div>

          <h2 className="text-2xl font-bold mb-6">Emergency Contact</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Contact Person Name</label>
            <input
              type="text"
              value={profileData.emergencyContactName}
              onChange={(e) => setProfileData({ ...profileData, emergencyContactName: e.target.value })}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder={isEditing ? 'Enter contact name' : 'contact name is not provided...'}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Contact Number</label>
            <input
              type="text"
              value={profileData.emergencyContactNumber}
              onChange={(e) => setProfileData({ ...profileData, emergencyContactNumber: e.target.value })}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder={isEditing ? 'Enter contact no.' : 'contact number is not provided...'}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-64 h-64 bg-orange-400 rounded-full flex items-center justify-center">
              <svg className="w-32 h-32 text-teal-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <button className="absolute bottom-2 right-2 w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center hover:bg-teal-800">
              <Camera size={20} className="text-white" />
            </button>
          </div>
          <p className="mt-4 text-sm font-medium">Edit Profile Image</p>
        </div>
      </div>
    </div>
  );
};
