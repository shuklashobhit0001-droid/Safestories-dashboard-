import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface ProgressNoteDetailProps {
  noteId: number;
  onBack: () => void;
}

export const ProgressNoteDetail: React.FC<ProgressNoteDetailProps> = ({ noteId, onBack }) => {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNoteDetail();
  }, [noteId]);

  const fetchNoteDetail = async () => {
    try {
      const response = await fetch(`/api/progress-notes/${noteId}`);
      const data = await response.json();
      if (data.success) {
        setNote(data.data);
      }
    } catch (error) {
      console.error('Error fetching note detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading session details...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-12 text-gray-500">
        Session note not found
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
    if (!value) return null;
    return (
      <div>
        <span className="text-xs text-gray-500 font-medium">{label}:</span>
        <p className={`text-sm text-gray-800 mt-1 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
          {value}
        </p>
      </div>
    );
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'none': return 'bg-green-100 text-green-700 border-green-200';
      case 'low': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'moderate': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

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
            <h2 className="text-2xl font-bold">Session #{note.session_number}</h2>
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
            <div>Duration: {note.session_duration}</div>
            <div>Mode: {note.session_mode}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Subjective */}
        <Section title="Subjective (Client Report)" icon="🗣️">
          <Field label="What client brought up" value={note.client_report} multiline />
          <Field label="Direct Quotes" value={note.direct_quotes} multiline />
        </Section>

        {/* Objective */}
        <Section title="Objective (Therapist Observation)" icon="👁️">
          <Field label="Client Presentation" value={note.client_presentation} multiline />
          {note.presentation_tags && note.presentation_tags.length > 0 && (
            <div>
              <span className="text-xs text-gray-500 font-medium">Presentation Tags:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {note.presentation_tags.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Interventions */}
        <Section title="Interventions" icon="🛠️">
          <Field label="Techniques Used" value={note.techniques_used} multiline />
          <Field label="Homework Assigned" value={note.homework_assigned} multiline />
        </Section>

        {/* Client Response */}
        <Section title="Client Response" icon="💬">
          <Field label="Client Reaction" value={note.client_reaction} />
          {note.reaction_tags && note.reaction_tags.length > 0 && (
            <div>
              <span className="text-xs text-gray-500 font-medium">Reaction Tags:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {note.reaction_tags.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Field label="Engagement Notes" value={note.engagement_notes} multiline />
        </Section>

        {/* Assessment */}
        <Section title="Assessment (Clinical Impressions)" icon="📊">
          <Field label="Themes & Patterns" value={note.themes_patterns} multiline />
          <Field label="Progress/Regression" value={note.progress_regression} multiline />
          <Field label="Clinical Concerns" value={note.clinical_concerns} multiline />
        </Section>

        {/* Risk Assessment */}
        {(note.self_harm_mention || note.risk_level) && (
          <div className={`border-2 rounded-lg p-4 ${getRiskColor(note.risk_level)}`}>
            <Section title="Risk Assessment" icon="⚠️">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={20} />
                <span className="font-semibold">Risk Level: {note.risk_level || 'None'}</span>
              </div>
              {note.self_harm_mention && (
                <Field label="Self-Harm Details" value={note.self_harm_details} multiline />
              )}
              <Field label="Risk Factors" value={note.risk_factors} multiline />
              <Field label="Protective Factors" value={note.protective_factors} multiline />
              <Field label="Safety Plan" value={note.safety_plan} multiline />
            </Section>
          </div>
        )}

        {/* Plan */}
        <Section title="Plan" icon="📋">
          <Field label="Future Interventions" value={note.future_interventions} multiline />
          <Field label="Session Frequency" value={note.session_frequency} />
        </Section>

        {/* Therapist Declaration */}
        <div className="border-t pt-4 mt-6">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Therapist: {note.therapist_name}</span>
              <span>Date: {new Date(note.signature_date).toLocaleDateString()}</span>
            </div>
            {note.therapist_signature && (
              <div className="mt-2 text-xs text-gray-500">
                Signature: {note.therapist_signature}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
