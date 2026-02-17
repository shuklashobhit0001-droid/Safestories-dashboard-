import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, Target, Calendar, User, Phone, Mail, Clock } from 'lucide-react';
import { Loader } from './Loader';

interface SOSDocumentationData {
  client: {
    name: string;
    email: string;
    phone: string;
    session_count: number;
    emergency_contact: string | null;
  };
  sos_assessment: {
    severity_level: number;
    severity_description: string;
    risk_summary: string;
    created_at: string;
  };
  documentation: {
    case_history: any[];
    progress_notes: any[];
    therapy_goals: any[];
  };
  token_info: {
    created_at: string;
    expires_at: string;
    access_count: number;
  };
}

interface SOSDocumentationViewProps {
  token: string;
}

export const SOSDocumentationView: React.FC<SOSDocumentationViewProps> = ({ token }) => {
  const [data, setData] = useState<SOSDocumentationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchDocumentation();
    }
  }, [token]);

  const fetchDocumentation = async () => {
    try {
      const response = await fetch(`/api/sos-documentation?token=${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load documentation');
        setLoading(false);
        return;
      }

      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching documentation:', err);
      setError('Failed to load documentation');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (level: number) => {
    if (level === 1) return 'bg-green-100 text-green-800 border-green-300';
    if (level === 2) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (level === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (level === 4) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-purple-100 text-purple-800 border-purple-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SOS Alert - Client Documentation</h1>
              <p className="text-sm text-gray-500">Confidential - For Emergency Response Only</p>
            </div>
          </div>

          {/* Risk Assessment Summary */}
          <div className={`border-2 rounded-lg p-4 ${getSeverityColor(data.sos_assessment.severity_level)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Risk Severity Level: {data.sos_assessment.severity_level}/5</span>
              <span className="text-sm">{formatDate(data.sos_assessment.created_at)}</span>
            </div>
            <p className="text-sm font-medium mb-2">{data.sos_assessment.severity_description}</p>
            <p className="text-sm">{data.sos_assessment.risk_summary}</p>
          </div>
        </div>

        {/* Client Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User size={24} />
            Client Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{data.client.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="font-medium">{data.client.session_count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone size={14} />
                Phone
              </p>
              <p className="font-medium">{data.client.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Mail size={14} />
                Email
              </p>
              <p className="font-medium">{data.client.email}</p>
            </div>
            {data.client.emergency_contact && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Emergency Contact</p>
                <p className="font-medium">{data.client.emergency_contact}</p>
              </div>
            )}
          </div>
        </div>

        {/* Case History */}
        {data.documentation.case_history.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={24} />
              Case History
            </h2>
            {data.documentation.case_history.map((history, index) => (
              <div key={index} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">{formatDate(history.session_date)}</span>
                  <span className="text-sm text-gray-500">• Therapist: {history.therapist_name}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {history.presenting_concerns && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Presenting Concerns:</p>
                      <p className="text-sm text-gray-600">{history.presenting_concerns}</p>
                    </div>
                  )}
                  {history.background_history && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Background History:</p>
                      <p className="text-sm text-gray-600">{history.background_history}</p>
                    </div>
                  )}
                  {history.mental_health_history && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Mental Health History:</p>
                      <p className="text-sm text-gray-600">{history.mental_health_history}</p>
                    </div>
                  )}
                  {history.current_stressors && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Current Stressors:</p>
                      <p className="text-sm text-gray-600">{history.current_stressors}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress Notes */}
        {data.documentation.progress_notes.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={24} />
              Progress Notes ({data.documentation.progress_notes.length} Sessions)
            </h2>
            <div className="space-y-4">
              {data.documentation.progress_notes.map((note, index) => (
                <div key={index} className="border-l-4 border-teal-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{formatDate(note.session_date)}</span>
                    <span className="text-sm text-gray-500">• {note.therapist_name}</span>
                  </div>
                  <div className="space-y-2">
                    {note.session_summary && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Session Summary:</p>
                        <p className="text-sm text-gray-700">{note.session_summary}</p>
                      </div>
                    )}
                    {note.interventions_used && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Interventions:</p>
                        <p className="text-sm text-gray-700">{note.interventions_used}</p>
                      </div>
                    )}
                    {note.client_progress && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Progress:</p>
                        <p className="text-sm text-gray-700">{note.client_progress}</p>
                      </div>
                    )}
                    {note.plan_for_next_session && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Plan for Next Session:</p>
                        <p className="text-sm text-gray-700">{note.plan_for_next_session}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Therapy Goals */}
        {data.documentation.therapy_goals.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={24} />
              Therapy Goals
            </h2>
            <div className="space-y-3">
              {data.documentation.therapy_goals.map((goal, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{goal.goal_description}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      goal.status === 'achieved' ? 'bg-green-100 text-green-800' :
                      goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Set by: {goal.therapist_name}</p>
                  <p className="text-xs text-gray-500">{formatDate(goal.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={16} />
            <span>Link expires: {formatDate(data.token_info.expires_at)}</span>
          </div>
          <p>This link has been accessed {data.token_info.access_count} time(s)</p>
          <p className="mt-2 text-xs">Confidential Information - Authorized Access Only</p>
        </div>
      </div>
    </div>
  );
};
