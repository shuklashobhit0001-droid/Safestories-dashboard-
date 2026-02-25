import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInfo: {
    username: string;
    role: string;
  };
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, userInfo }) => {
  const [subject, setSubject] = useState('');
  const [component, setComponent] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [issueId, setIssueId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const components = [
    'Dashboard',
    'Clients',
    'Therapists',
    'Appointments',
    'Calendar',
    'Session Notes',
    'Reports',
    'Profile',
    'Audit Logs',
    'Other'
  ];

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, screenshot: 'File size must be less than 5MB' });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, screenshot: 'Only image files are allowed' });
        return;
      }

      setScreenshot(file);
      setErrors({ ...errors, screenshot: '' });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!component) {
      newErrors.component = 'Please select a component';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      let screenshotUrl = null;

      // Upload screenshot if provided
      if (screenshot) {
        const formData = new FormData();
        formData.append('file', screenshot);
        formData.append('folder', 'issue-screenshots');

        const uploadResponse = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          screenshotUrl = uploadData.url;
        }
      }

      // Submit issue report
      const response = await fetch('/api/report-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject,
          component,
          description,
          screenshot_url: screenshotUrl,
          reported_by: userInfo.username,
          user_role: userInfo.role
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIssueId(data.issueId);
        setShowSuccess(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        throw new Error('Failed to submit issue');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      setErrors({ submit: 'Failed to submit issue. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setComponent('');
    setDescription('');
    setScreenshot(null);
    setScreenshotPreview(null);
    setErrors({});
    setShowSuccess(false);
    setIssueId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          <div className="p-6 text-center">
            <div className="flex justify-center mb-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Thank You for Reporting!
            </h2>
            <p className="text-gray-600 text-sm mb-3">
              We've received your feedback and will look into it shortly.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 inline-block">
              <p className="text-xs text-gray-500">Issue ID</p>
              <p className="text-xl font-bold text-teal-700">#{issueId}</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              This window will close automatically...
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-teal-700" />
                <h2 className="text-lg font-semibold text-gray-800">Report an Issue</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Brief summary of the issue"
                />
                {errors.subject && (
                  <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
                )}
              </div>

              {/* Component */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Component/Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.component ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a component</option>
                  {components.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
                {errors.component && (
                  <p className="text-red-500 text-xs mt-1">{errors.component}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Please describe the issue in detail (minimum 20 characters)"
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description ? (
                    <p className="text-red-500 text-xs">{errors.description}</p>
                  ) : (
                    <p className="text-gray-500 text-xs">
                      {description.length} / 20 characters minimum
                    </p>
                  )}
                </div>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Screenshot (Optional)
                </label>
                {!screenshotPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-600">
                        Click to upload screenshot
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        PNG, JPG up to 5MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full rounded-lg border border-gray-300 max-h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {errors.screenshot && (
                  <p className="text-red-500 text-xs mt-1">{errors.screenshot}</p>
                )}
              </div>

              {/* Reporter Info */}
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-xs text-gray-600">
                  Reported by: <span className="font-medium">{userInfo.username}</span> ({userInfo.role})
                </p>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                  <p className="text-red-600 text-xs">{errors.submit}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
