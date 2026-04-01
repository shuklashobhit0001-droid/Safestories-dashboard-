import React, { useState, useEffect } from 'react';
import './StageRemarkModal.css'; // Reusing some modal styles
import { Loader2 } from 'lucide-react';

interface ToDoItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  follow_up_1_date?: string;
  follow_up_1_notes?: string;
  next_step?: string;
}

interface ToDoData {
  consultationCalls: ToDoItem[];
  followups: ToDoItem[];
}

interface ToDoModalProps {
  onViewLead: (leadId: string) => void;
  isFullPage?: boolean;
  setCurrentPage?: (page: string) => void;
}

const ToDoModal: React.FC<ToDoModalProps> = ({ onViewLead, isFullPage = false, setCurrentPage }) => {
  const [data, setData] = useState<ToDoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/crm/todo')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch todo list:', err);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${isFullPage ? 'h-full flex flex-col' : 'mb-8 overflow-hidden flex flex-col'}`} 
      style={isFullPage ? { width: '100%', height: 'calc(100vh - 100px)', margin: 0, border: 'none' } : { maxHeight: 350 }}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <span>📋</span> To-Do List {isFullPage && <span className="text-sm font-normal text-gray-500 ml-2">(Full View)</span>}
        </h2>
        {isFullPage ? (
          <button 
            onClick={() => setCurrentPage?.('analytics')}
            className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
          >
            ← Back to Analytics
          </button>
        ) : (
          <button 
            onClick={() => setCurrentPage?.('full-todo')}
            className="px-4 py-1.5 bg-teal-50 text-[#21615D] border border-[#21615D] hover:bg-teal-100 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
          >
            <span className="text-base">⤢</span> View Full List
          </button>
        )}
      </div>

      {/* Body with precise scrolling limits */}
      <div className="p-5 overflow-y-auto custom-scrollbar" style={{ flex: 1 }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <span className="ml-2 text-gray-500 font-medium">Loading tasks...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* 1. Actionable Items */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 12, borderBottom: '2px solid #f3f4f6', paddingBottom: 8 }}>
                1. Actionable Items
              </h3>
              
              <div style={{ paddingLeft: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>A. List of consultation calls scheduled</h4>
                {data?.consultationCalls.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginBottom: 12 }}>No calls scheduled</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
                    {data?.consultationCalls.map(item => (
                      <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 6, border: '1px solid #dcfce7' }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.name}</span>
                          <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>{item.phone}</span>
                        </div>
                        <button 
                          onClick={() => onViewLead(item.id)}
                          style={{ 
                            fontSize: 11, padding: '4px 10px', background: '#ffffff', color: '#21615D',
                            borderRadius: 6, border: '1px solid #21615D', cursor: 'pointer', fontWeight: 600,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>B. Follow ups</h4>
                {data?.followups.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No follow-ups pending</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {data?.followups.map(item => (
                      <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 6, border: '1px solid #dcfce7' }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.name}</span>
                          <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>{formatDate(item.follow_up_1_date)}</span>
                        </div>
                        <button 
                          onClick={() => onViewLead(item.id)}
                          style={{ 
                            fontSize: 11, padding: '4px 10px', background: '#ffffff', color: '#21615D',
                            borderRadius: 6, border: '1px solid #21615D', cursor: 'pointer', fontWeight: 600,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* 2. Follow up Details */}
            <section className="mb-4">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 12, borderBottom: '2px solid #f3f4f6', paddingBottom: 8 }}>
                2. Upcoming Follow-up Schedule
              </h3>
              
              {data?.followups.length === 0 ? (
                 <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No detailed follow-ups scheduled</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, width: 120 }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Details</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Next step</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.followups.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '10px 12px', color: '#4b5563' }}>{formatDate(item.follow_up_1_date)}</td>
                          <td style={{ padding: '10px 12px', color: '#6b7280' }}>{item.follow_up_1_notes || 'No notes'}</td>
                          <td style={{ padding: '10px 12px', color: '#21615D', fontWeight: 500 }}>{item.next_step || 'Consultation call'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  );
};

export default ToDoModal;
