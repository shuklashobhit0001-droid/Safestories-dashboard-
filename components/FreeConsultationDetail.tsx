import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface FreeConsultationDetailProps {
  noteId: number;
  onBack: () => void;
}

export const FreeConsultationDetail: React.FC<FreeConsultationDetailProps> = ({ noteId, onBack }) => {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNoteDetail();
  }, [noteId]);

  const fetchNoteDetail = async () => {
    try {
      const response = await fetch(`/api/free-consultation-notes/${noteId}`);
      const data = await response.json();
      if (data.success) {
        setNote(data.data);
      }
    } catch (error) {
      console.error('Error fetching free consultation note:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading consultation details...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-12 text-gray-500">
        Consultation note not found
      </div>
    );
  }

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, multiline = false }: { label: string; value: any; multiline?: boolean }) => {
    if (!value && value !== false) return null;
    return (
      <div>
        <span className="text-xs text-gray-500 font-medium">{label}:</span>
        <p className={`text-sm text-gray-800 mt-1 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
        </p>
      </div>
    );
  };

  const BooleanField = ({ label, value }: { label: string; value: boolean }) => (
    <div className="flex items-center gap-2">
      {value ? (
        <CheckCircle size={16} className="text-green-600" />
      ) : (
        <XCircle size={16} className="text-gray-400" />
      )}
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to List</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">Free Consultation Session</h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                Pre-therapy
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              {new Date(note.session_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Duration: {note.session_duration || 'N/A'}</div>
            <div>Mode: {note.session_mode || 'N/A'}</div>
            <div>Therapist: {note.therapist_name || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Presenting Concerns */}
        <Section title="Presenting Concerns" icon="💭">
          <Field label="Presenting Concerns" value={note.presenting_concerns} multiline />
          <Field label="Duration & Onset" value={note.duration_onset} multiline />
          <Field label="Triggers & Maintaining Factors" value={note.triggers_factors} multiline />
        </Section>

        {/* Overview Given */}
        <Section title="Therapy Overview" icon="📋">
          <BooleanField label="Therapy overview given to client" value={note.therapy_overview_given} />
          <Field label="Client Questions" value={note.client_questions} multiline />
          <Field label="Answers Given" value={note.answers_given} multiline />
        </Section>

        {/* Next Steps & Preferences */}
        <Section title="Next Steps & Client Preferences" icon="🎯">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preferred Languages" value={note.preferred_languages} />
            <Field label="Preferred Modes" value={note.preferred_modes} />
            <Field label="Preferred Price Range" value={note.preferred_price_range} />
            <Field label="Preferred Time Slots" value={note.preferred_time_slots} />
          </div>
          <Field label="Assigned Therapist" value={note.assigned_therapist_name} />
          <BooleanField label="Chatbot booking process explained" value={note.chatbot_booking_explained} />
        </Section>

        {/* Clinical Concerns */}
        {(note.clinical_concerns_mentioned || note.suicidal_thoughts_mentioned) && (
          <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
            <Section title="Clinical Concerns & Risk Assessment" icon="⚠️">
              {note.clinical_concerns_mentioned && (
                <>
                  <BooleanField label="Clinical concerns mentioned" value={note.clinical_concerns_mentioned} />
                  <Field label="Clinical Concerns Details" value={note.clinical_concerns_details} multiline />
                </>
              )}
              {note.suicidal_thoughts_mentioned && (
                <>
                  <BooleanField label="Suicidal thoughts mentioned" value={note.suicidal_thoughts_mentioned} />
                  <Field label="Suicidal Thoughts Details" value={note.suicidal_thoughts_details} multiline />
                </>
              )}
            </Section>
          </div>
        )}

        {/* Other Notes */}
        {note.other_notes && (
          <Section title="Additional Notes" icon="📝">
            <Field label="Other Notes" value={note.other_notes} multiline />
          </Section>
        )}

        {/* Session Status */}
        <div className="border-t pt-4 mt-6">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500">Session Status: </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                note.session_status === 'Completed' ? 'bg-green-100 text-green-700' :
                note.session_status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {note.session_status || 'N/A'}
              </span>
            </div>
            <div className="text-gray-500">
              Last updated: {new Date(note.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
