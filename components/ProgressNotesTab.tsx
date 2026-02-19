import React, { useState, useEffect } from 'react';
import { FileText, Search, ChevronRight, ChevronDown } from 'lucide-react';

interface ProgressNotesTabProps {
  clientId: string;
  onViewNote: (noteId: number, isFreeConsultation?: boolean) => void;
  hasFreeConsultation?: boolean;
}

export const ProgressNotesTab: React.FC<ProgressNotesTabProps> = ({ clientId, onViewNote, hasFreeConsultation = false }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [freeConsultNotes, setFreeConsultNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSessionNote, setExpandedSessionNote] = useState<number | null>(null);

  useEffect(() => {
    fetchProgressNotes();
    if (hasFreeConsultation) {
      fetchFreeConsultationNotes();
    }
  }, [clientId, hasFreeConsultation]);

  const fetchProgressNotes = async () => {
    try {
      const response = await fetch(`/api/progress-notes?client_id=${encodeURIComponent(clientId)}`);
      const data = await response.json();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (error) {
      console.error('Error fetching progress notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreeConsultationNotes = async () => {
    try {
      const response = await fetch(`/api/free-consultation-notes?client_id=${clientId}`);
      const data = await response.json();
      if (data.success) {
        setFreeConsultNotes(data.data);
      }
    } catch (error) {
      console.error('Error fetching free consultation notes:', error);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'none': return 'bg-green-100 text-green-700';
      case 'low': return 'bg-yellow-100 text-yellow-700';
      case 'moderate': return 'bg-orange-100 text-orange-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'none': return '🟢';
      case 'low': return '🟡';
      case 'moderate': return '🟠';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  const filteredNotes = notes.filter(note => {
    const searchLower = searchTerm.toLowerCase();
    // For progress notes
    if (note.note_type === 'progress_note') {
      return note.client_report?.toLowerCase().includes(searchLower) ||
             note.techniques_used?.toLowerCase().includes(searchLower);
    }
    // For session notes
    if (note.note_type === 'session_note') {
      return note.concerns_discussed?.toLowerCase().includes(searchLower) ||
             note.interventions_used?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const filteredFreeConsultNotes = freeConsultNotes.filter(note =>
    note.presenting_concerns?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.other_notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allNotes = [...filteredFreeConsultNotes.map(n => ({ ...n, isFreeConsultation: true })), ...filteredNotes];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading progress notes...</div>
      </div>
    );
  }

  if (allNotes.length === 0 && !searchTerm) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-4">No progress notes available yet</p>
        <p className="text-gray-400 text-sm">Progress notes will be added after each session</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {allNotes.map((note) => {
          if (note.isFreeConsultation) {
            // Free Consultation Note
            return (
              <div
                key={`fc-${note.id}`}
                className="bg-purple-50 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => onViewNote(note.id, true)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                          FREE CONSULTATION
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(note.session_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <span>Mode: {note.session_mode || 'N/A'}</span>
                        <span>•</span>
                        <span>Pre-therapy Session</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-purple-400" />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-purple-700">Presenting Concerns:</span>
                      <p className="text-sm text-gray-700 line-clamp-2 mt-0.5">
                        {note.presenting_concerns || 'No concerns recorded'}
                      </p>
                    </div>
                    {note.assigned_therapist_name && (
                      <div>
                        <span className="text-xs font-medium text-purple-700">Assigned Therapist:</span>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {note.assigned_therapist_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          } else if (note.note_type === 'session_note') {
            // Session Note (from client_session_notes table) - Expandable accordion
            const isExpanded = expandedSessionNote === note.id;
            return (
              <div
                key={`sn-${note.id}`}
                className="rounded-lg border-2 transition-all"
                style={{ 
                  backgroundColor: '#21615d1a',
                  borderColor: '#21615D'
                }}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedSessionNote(isExpanded ? null : note.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span 
                          className="px-3 py-1 text-white text-xs font-medium rounded-full"
                          style={{ backgroundColor: '#21615D' }}
                        >
                          SESSION NOTE
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(note.session_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {note.session_timing && (
                        <div className="text-xs text-gray-500 mt-2">
                          {note.session_timing}
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={20} style={{ color: '#21615D' }} />
                    ) : (
                      <ChevronRight size={20} style={{ color: '#21615D' }} />
                    )}
                  </div>

                  {!isExpanded && note.concerns_discussed && (
                    <div>
                      <span className="text-xs font-medium" style={{ color: '#21615D' }}>Concerns Discussed:</span>
                      <p className="text-sm text-gray-700 line-clamp-2 mt-0.5">
                        {note.concerns_discussed}
                      </p>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: '#21615D' }}>
                    {note.concerns_discussed && (
                      <div className="pt-4">
                        <span className="text-xs font-semibold" style={{ color: '#21615D' }}>
                          Concerns or Themes Discussed:
                        </span>
                        <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">
                          {note.concerns_discussed}
                        </p>
                      </div>
                    )}

                    {note.somatic_cues && (
                      <div>
                        <span className="text-xs font-semibold" style={{ color: '#21615D' }}>
                          Somatic Cues (Appearance, Behavior, Energy, Mood):
                        </span>
                        <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">
                          {note.somatic_cues}
                        </p>
                      </div>
                    )}

                    {note.interventions_used && (
                      <div>
                        <span className="text-xs font-semibold" style={{ color: '#21615D' }}>
                          Interventions Used:
                        </span>
                        <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">
                          {note.interventions_used}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          } else {
            // Regular Progress Note (from client_progress_notes table)
            return (
              <div
                key={`pn-${note.id}`}
                className="bg-white rounded-lg border hover:border-teal-500 transition-colors cursor-pointer"
                onClick={() => onViewNote(note.id, false)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          Session #{note.session_number}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(note.session_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Mode: {note.session_mode}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full ${getRiskColor(note.risk_level)}`}>
                          {getRiskIcon(note.risk_level)} Risk: {note.risk_level || 'None'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Subjective:</span>
                      <p className="text-sm text-gray-700 line-clamp-2 mt-0.5">
                        {note.client_report || 'No report available'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Interventions:</span>
                      <p className="text-sm text-gray-700 line-clamp-1 mt-0.5">
                        {note.techniques_used || 'No interventions recorded'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>

      {allNotes.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500">
          No sessions found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};
