import React, { useState } from 'react';
import { X, Upload, Eye, EyeOff } from 'lucide-react';

interface CompleteProfileModalProps {
  onClose: () => void;
  onComplete: () => void;
  prefilledData: {
    requestId: number;
    name: string;
    email: string;
    phone: string;
    specializations: string;
    specializationDetails: Array<{ name: string; price: string; description: string }>;
  };
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ 
  onClose, 
  onComplete,
  prefilledData 
}) => {
  const [name, setName] = useState(prefilledData.name);
  const [email, setEmail] = useState(prefilledData.email);
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState(prefilledData.phone.replace(/^\+\d+\s*/, ''));
  const [specializations, setSpecializations] = useState<string[]>(
    prefilledData.specializations.split(', ')
  );
  const [specializationDetails, setSpecializationDetails] = useState<{
    [key: string]: { price: string; description: string }
  }>(() => {
    const details: any = {};
    prefilledData.specializationDetails.forEach(spec => {
      details[spec.name] = { price: spec.price, description: spec.description };
    });
    return details;
  });
  const [qualification, setQualification] = useState('');
  const [qualificationFile, setQualificationFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const countryCodes = [
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+971', country: 'UAE' },
  ];

  const specializationOptions = [
    'Individual Therapy',
    'Adolescent Therapy',
    'Couples Therapy'
  ];

  const handleSpecializationToggle = (spec: string) => {
    setSpecializations(prev => {
      if (prev.includes(spec)) {
        const newDetails = { ...specializationDetails };
        delete newDetails[spec];
        setSpecializationDetails(newDetails);
        return prev.filter(s => s !== spec);
      } else {
        setSpecializationDetails(prev => ({
          ...prev,
          [spec]: { price: '', description: '' }
        }));
        return [...prev, spec];
      }
    });
  };

  const handleDetailChange = (spec: string, field: 'price' | 'description', value: string) => {
    setSpecializationDetails(prev => ({
      ...prev,
      [spec]: {
        ...prev[spec],
        [field]: value
      }
    }));
  };

  const handleQualificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Qualification PDF must be less than 5MB');
        return;
      }
      setQualificationFile(file);
      setError('');
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Profile picture must be less than 2MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Profile picture must be JPG, PNG, or WebP');
        return;
      }
      setProfilePicture(file);
      setError('');
    }
  };

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 8) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[a-z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (specializations.length === 0) {
      setError('Please select at least one specialization');
      return;
    }

    const allDetailsComplete = specializations.every(spec => {
      const details = specializationDetails[spec];
      return details && details.price.trim() !== '';
    });

    if (!allDetailsComplete) {
      setError('Please provide price for all selected specializations');
      return;
    }

    setLoading(true);

    try {
      // TODO: Upload files to S3 bucket when bucket link is provided
      const qualificationPdfUrl = qualificationFile ? 'pending-upload' : null;
      const profilePictureUrl = profilePicture ? 'pending-upload' : null;

      const response = await fetch('/api/complete-therapist-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: prefilledData.requestId,
          name,
          email,
          phone: `${countryCode}${phone}`,
          specializations: specializations.join(', '),
          specializationDetails: Object.entries(specializationDetails).map(([name, details]) => ({
            name,
            price: details.price,
            description: details.description
          })),
          qualification,
          qualificationPdfUrl,
          profilePictureUrl,
          password
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Profile created successfully! You can now login with your email and password.');
        onComplete();
      } else {
        setError(data.error || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while creating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Complete Your Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1 italic">
              *Use the Gmail account associated with your Google Calendar.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Phone Number<span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-32 px-2 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
              >
                {countryCodes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} {item.country}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Specializations<span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {specializationOptions.map((spec) => (
                <div key={spec}>
                  <label className="flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={specializations.includes(spec)}
                      onChange={() => handleSpecializationToggle(spec)}
                      className="w-4 h-4 text-teal-700 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm">{spec}</span>
                  </label>
                  
                  {specializations.includes(spec) && (
                    <div className="mt-2 ml-7 p-4 bg-gray-50 border rounded-lg space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Price (₹)<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Enter price"
                          value={specializationDetails[spec]?.price || ''}
                          onChange={(e) => handleDetailChange(spec, 'price', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Description
                        </label>
                        <textarea
                          placeholder="Enter description"
                          value={specializationDetails[spec]?.description || ''}
                          onChange={(e) => handleDetailChange(spec, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Qualification */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Qualification
            </label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g., M.A. Clinical Psychology"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Qualification PDF Upload */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Qualification Certificate (PDF)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload size={18} />
                <span className="text-sm">
                  {qualificationFile ? qualificationFile.name : 'Choose PDF file'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleQualificationFileChange}
                  className="hidden"
                />
              </label>
              {qualificationFile && (
                <span className="text-xs text-gray-500">
                  {(qualificationFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Profile Picture
            </label>
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
                <span className="text-xs text-gray-500">
                  {(profilePicture.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WebP. Max size: 2MB</p>
          </div>

          {/* Create Password */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Create Password<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              At least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Confirm Password<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 text-white py-3 rounded-lg hover:bg-teal-800 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Creating Profile...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
