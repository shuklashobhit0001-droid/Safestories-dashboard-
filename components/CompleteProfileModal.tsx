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
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  
  // Extract country code and phone number from prefilledData
  const extractPhoneDetails = (fullPhone: string) => {
    if (!fullPhone) {
      return { countryCode: '+91', phone: '' };
    }
    
    // Remove any spaces first
    const cleaned = fullPhone.replace(/\s/g, '');
    
    // Match specific country code patterns (non-greedy)
    // Try +1 first (1 digit), then +91, +44, +61, +971 etc (2-3 digits)
    const patterns = [
      /^(\+1)(\d+)$/,      // USA/Canada
      /^(\+\d{2})(\d+)$/,  // Most countries (2 digits like +91, +44, +61)
      /^(\+\d{3})(\d+)$/,  // Some countries (3 digits like +971)
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match && match[2].length >= 10) { // Ensure phone number is at least 10 digits
        return { countryCode: match[1], phone: match[2] };
      }
    }
    
    // If no country code found, default to +91
    return { countryCode: '+91', phone: cleaned };
  };
  
  const phoneDetails = extractPhoneDetails(prefilledData.phone);
  console.log('📞 Phone extraction:', { 
    original: prefilledData.phone, 
    countryCode: phoneDetails.countryCode, 
    phone: phoneDetails.phone 
  });
  const [countryCode, setCountryCode] = useState(phoneDetails.countryCode);
  const [phone, setPhone] = useState(phoneDetails.phone);
  
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
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
      // Upload profile picture if selected
      let profilePictureUrl = null;
      if (profilePicture) {
        setError('Uploading profile picture...');
        try {
          const formData = new FormData();
          formData.append('file', profilePicture);
          formData.append('folder', 'profile-pictures');

          const uploadResponse = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          });

          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            profilePictureUrl = uploadData.url;
            console.log('✅ Profile picture uploaded:', profilePictureUrl);
            setError(''); // Clear the uploading message
          } else {
            throw new Error(uploadData.error || 'Failed to upload profile picture');
          }
        } catch (uploadError) {
          console.error('❌ Profile picture upload failed:', uploadError);
          setError('Failed to upload profile picture. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Upload qualification PDF if selected
      let qualificationPdfUrl = null;
      if (qualificationFile) {
        setError('Uploading qualification PDF...');
        try {
          const formData = new FormData();
          formData.append('file', qualificationFile);
          formData.append('folder', 'qualification-pdfs');

          const uploadResponse = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          });

          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            qualificationPdfUrl = uploadData.url;
            console.log('✅ Qualification PDF uploaded:', qualificationPdfUrl);
            setError(''); // Clear the uploading message
          } else {
            throw new Error(uploadData.error || 'Failed to upload qualification PDF');
          }
        } catch (uploadError) {
          console.error('❌ Qualification PDF upload failed:', uploadError);
          setError('Failed to upload qualification PDF. Please try again.');
          setLoading(false);
          return;
        }
      }

      const payload = {
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
      };

      console.log('Submitting profile:', payload);

      const response = await fetch('/api/complete-therapist-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        setError('Server error: Unable to process response. Please check server logs.');
        setLoading(false);
        return;
      }
      
      console.log('Profile submission response:', data);

      if (data.success) {
        // Update user object in localStorage to prevent modal from showing again
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userObj = JSON.parse(savedUser);
          userObj.needsProfileCompletion = false;
          userObj.profileStatus = 'pending_review';
          localStorage.setItem('user', JSON.stringify(userObj));
        }
        
        setShowSuccessModal(true);
      } else {
        setError(data.error || 'Failed to submit profile');
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
      {/* Close Warning Modal */}
      {showCloseWarning && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Profile Completion Required
            </h3>
            <p className="text-gray-600 mb-6">
              You need to complete your profile before accessing the dashboard. This is a one-time setup required for all new therapists.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseWarning(false)}
                className="flex-1 bg-teal-700 text-white py-2.5 rounded-lg hover:bg-teal-800 font-medium"
              >
                Continue Setup
              </button>
              <button
                onClick={() => {
                  setShowCloseWarning(false);
                  onClose();
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal ? (
        // Success Modal
        <div className="bg-white rounded-lg w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Profile Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your profile has been submitted and is currently under review by our team.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 font-medium mb-1">
              ⏱️ Review Timeline: 5-10 days
            </p>
            <p className="text-xs text-yellow-700">
              You'll receive an email notification once your profile is approved.
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            In the meantime, you can explore your dashboard and view your profile.
          </p>
          <button
            onClick={() => {
              // Reload the page to refresh with updated user object
              window.location.reload();
            }}
            className="w-full bg-teal-700 text-white py-3 rounded-lg hover:bg-teal-800 font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        // Profile Form
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Complete Your Profile</h2>
          <button 
            onClick={() => setShowCloseWarning(true)} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Profile Picture Upload - AT TOP */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {profilePicture ? (
                <img
                  src={URL.createObjectURL(profilePicture)}
                  alt="Profile preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-teal-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-teal-100 flex items-center justify-center">
                  <Upload size={32} className="text-gray-400" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-teal-700 text-white p-2 rounded-full cursor-pointer hover:bg-teal-800 shadow-lg">
                <Upload size={16} />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG, or WebP. Max 2MB</p>
          </div>

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
      )}
    </div>
  );
};
