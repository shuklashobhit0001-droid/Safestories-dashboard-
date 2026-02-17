import React, { useState } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Toast } from './Toast';

interface EditTherapistFormProps {
  therapist: any;
  onSave: (updatedTherapist: any, profilePicture: File | null) => void;
  onCancel: () => void;
  saving: boolean;
}

export const EditTherapistForm: React.FC<EditTherapistFormProps> = ({
  therapist,
  onSave,
  onCancel,
  saving
}) => {
  const [name, setName] = useState(therapist.name || '');
  const [email, setEmail] = useState(therapist.email || therapist.contact_info || '');
  const [phone, setPhone] = useState(therapist.phone_number || '');
  const [specializations, setSpecializations] = useState(therapist.specializations || therapist.specialization || '');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [currentProfilePictureUrl, setCurrentProfilePictureUrl] = useState(therapist.profile_picture_url || '');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setToast({ message: 'Profile picture must be JPG, PNG, or WebP', type: 'error' });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Compressing large image...', type: 'success' });
        
        try {
          const compressedFile = await compressImage(file);
          if (compressedFile.size > 5 * 1024 * 1024) {
            setToast({ message: 'Image is too large even after compression', type: 'error' });
            return;
          }
          setProfilePicture(compressedFile);
          setToast({ message: 'Image compressed successfully', type: 'success' });
        } catch (error) {
          setToast({ message: 'Failed to compress image', type: 'error' });
        }
      } else {
        setProfilePicture(file);
      }
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTherapist = {
      ...therapist,
      name,
      email,
      phone_number: phone,
      specializations,
      profile_picture_url: currentProfilePictureUrl
    };

    onSave(updatedTherapist, profilePicture);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <h1 className="text-3xl font-bold mb-1">Edit Therapist Profile</h1>
      <p className="text-gray-600 mb-8">Update therapist information</p>

      <div className="bg-white rounded-lg border p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Profile Picture
            </label>
            {currentProfilePictureUrl && !profilePicture && (
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={currentProfilePictureUrl} 
                  alt="Current profile" 
                  className="w-16 h-16 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCurrentProfilePictureUrl('')}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload size={18} />
                <span className="text-sm">
                  {profilePicture ? profilePicture.name : 'Choose image'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
              {profilePicture && (
                <>
                  <span className="text-xs text-gray-500">
                    {(profilePicture.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => setProfilePicture(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WebP. Max size: 5MB</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Specializations *
            </label>
            <textarea
              value={specializations}
              onChange={(e) => setSpecializations(e.target.value)}
              required
              rows={3}
              placeholder="Enter specializations separated by commas (e.g., Individual Therapy, Couples Therapy)"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple specializations with commas</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-teal-700 text-white py-3 rounded-lg hover:bg-teal-800 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
