import { useState, useEffect, useRef, useCallback } from 'react'
import StageRemarkModal from './StageRemarkModal'
import './PipelineContent.css'
import './MonthFilter.css'
import { Loader } from '../../../components/Loader'
import { Toast } from '../../../components/Toast'
import { SendBookingModal } from '../../../components/SendBookingModal'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  sales_agent_id: string | null
  assignedToSales: string
  assignedTherapist?: string
  created_by: string | null
  date: string
  pipeline_stage?: string
}

interface Stage {
  id: string
  title: string
  leads: Lead[]
}

interface PipelineContentProps {
  currentUser?: any
  setCurrentPage?: (page: string) => void
}

// Defines the fixed forward-only order
const STAGE_ORDER = [
  'lead-inquire',
  'contacted',
  'followup-1',
  'followup-2',
  'followup-3',
  'pretherapy-call',
  'booked-first-session',
  'dropouts',
  'leaks',
]

const STAGE_LABELS: Record<string, string> = {
  'lead-inquire': 'Lead / Inquire',
  'contacted': 'Contacted',
  'followup-1': 'Follow-up 1',
  'followup-2': 'Follow-up 2',
  'followup-3': 'Follow-up 3',
  'pretherapy-call': 'Pre-therapy Call',
  'booked-first-session': 'Booked First Session',
  'dropouts': 'Drop Outs',
  'leaks': 'Leaks',
}

const defaultStages: Stage[] = STAGE_ORDER.map(id => ({
  id,
  title: STAGE_LABELS[id],
  leads: [],
}))

const PipelineContent = ({ currentUser, setCurrentPage }: PipelineContentProps) => {
  const [leadManagers, setLeadManagers] = useState<{ id: number; name: string }[]>([])
  const [stages, setStages] = useState<Stage[]>(defaultStages)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [prefilledClientData, setPrefilledClientData] = useState<{ name: string, phone: string, email: string } | undefined>()

  // Pending drop — held until remark is confirmed
  const [pendingDrop, setPendingDrop] = useState<{
    lead: Lead
    fromStageId: string
    toStageId: string
  } | null>(null)

  const [draggedLead, setDraggedLead] = useState<{ lead: Lead; fromStageId: string } | null>(null)
  const [editingSalesAssignment, setEditingSalesAssignment] = useState<string | null>(null)
  const kanbanRef = useRef<HTMLDivElement>(null)
  const scrollAnimRef = useRef<number | null>(null)

  const stopAutoScroll = useCallback(() => {
    if (scrollAnimRef.current !== null) {
      cancelAnimationFrame(scrollAnimRef.current)
      scrollAnimRef.current = null
    }
  }, [])

  const startAutoScroll = useCallback((direction: 'left' | 'right') => {
    stopAutoScroll()
    const scroll = () => {
      if (kanbanRef.current) {
        kanbanRef.current.scrollLeft += direction === 'right' ? 8 : -8
      }
      scrollAnimRef.current = requestAnimationFrame(scroll)
    }
    scrollAnimRef.current = requestAnimationFrame(scroll)
  }, [stopAutoScroll])

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEditingSalesAssignment(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Fetch lead managers for dropdown
  useEffect(() => {
    fetch('/api/lead-managers')
      .then(r => r.json())
      .then(data => setLeadManagers(data))
      .catch(err => console.error('Failed to fetch lead managers:', err))
  }, [])

  // Fetch leads from DB
  useEffect(() => {
    const fetchPipelineLeads = async () => {
      try {
        const response = await fetch('/api/leads')
        if (response.ok) {
          const data = await response.json()
          const mappedLeads: Lead[] = data.map((d: any) => ({
            id: String(d.id),
            name: d.name,
            email: d.email || '',
            phone: d.phone,
            source: d.source,
            sales_agent_id: d.sales_agent_id != null ? String(d.sales_agent_id) : null,
            assignedToSales: d.sales_agent_name || (d.sales_agent_id != null ? String(d.sales_agent_id) : 'Unassigned'),
            assignedTherapist: d.therapist_name || d.therapist_id || 'Unassigned',
            created_by: d.created_by != null ? String(d.created_by) : null,
            date: d.created_at,
            pipeline_stage: d.pipeline_stage,
          }))

          const newStages = defaultStages.map(stage => ({
            ...stage,
            leads: mappedLeads.filter(lead => lead.pipeline_stage === stage.id),
          }))
          setStages(newStages)
        }
      } catch (error) {
        console.error('Failed to fetch pipeline leads', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPipelineLeads()
  }, [])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const calculateAging = (dateString: string): string => {
    const leadDate = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - leadDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day'
    return `${diffDays} days`
  }

  const canActOnLead = (lead: Lead): boolean => {
    if (!currentUser) return false
    const userId = String(currentUser.id)
    // Can act if you are the assigned manager OR if it's currently unassigned
    if (lead.sales_agent_id && String(lead.sales_agent_id) === userId) return true
    if (!lead.sales_agent_id || lead.sales_agent_id === 'null') return true
    return false
  }

  const isForwardMove = (fromId: string, toId: string): boolean => {
    return STAGE_ORDER.indexOf(toId) > STAGE_ORDER.indexOf(fromId)
  }

  const handleDragStart = (lead: Lead, stageId: string) => {
    if (canActOnLead(lead)) {
      setDraggedLead({ lead, fromStageId: stageId })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!kanbanRef.current) return
    const board = kanbanRef.current.getBoundingClientRect()
    const EDGE = 120 // px from edge to trigger scroll
    if (e.clientX < board.left + EDGE) {
      startAutoScroll('left')
    } else if (e.clientX > board.right - EDGE) {
      startAutoScroll('right')
    } else {
      stopAutoScroll()
    }
  }

  const handleDragEnd = () => {
    stopAutoScroll()
    setDraggedLead(null)
  }

  const handleDrop = (toStageId: string) => {
    stopAutoScroll()
    if (!draggedLead) return
    const { lead, fromStageId } = draggedLead
    setDraggedLead(null)

    if (fromStageId === toStageId) return

    // One-way enforcement: ignore backward drops
    if (!isForwardMove(fromStageId, toStageId)) return

    // Open the remark modal; hold the move until confirmed
    setPendingDrop({ lead, fromStageId, toStageId })
  }

  const handleRemarkConfirm = async (remark: string) => {
    if (!pendingDrop) return
    const { lead, fromStageId, toStageId } = pendingDrop

    // Optimistic UI update
    setStages(prev =>
      prev.map(stage => {
        if (stage.id === fromStageId) return { ...stage, leads: stage.leads.filter(l => l.id !== lead.id) }
        if (stage.id === toStageId) return { ...stage, leads: [...stage.leads, { ...lead, pipeline_stage: toStageId }] }
        return stage
      })
    )

    // Persist to backend
    try {
      const response = await fetch(`/api/leads/${lead.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_stage: toStageId, remark }),
      })
      if (!response.ok) throw new Error('Failed to update stage')
      setToast({ message: 'Stage updated successfully', type: 'success' })
    } catch (err) {
      console.error('Failed to save stage change:', err)
      setToast({ message: 'Failed to update stage', type: 'error' })
      // Optionally could revert optimistic update here
    }

    setPendingDrop(null)
  }

  const handleRemarkCancel = () => {
    setPendingDrop(null)
  }

  const handleSalesAssignment = async (leadId: string, stageId: string, sales_agent_id: number | null, sales_agent_name: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales_agent_id })
      })

      if (res.ok) {
        setStages(prev =>
          prev.map(stage => {
            if (stage.id !== stageId) return stage
            return {
              ...stage,
              leads: stage.leads.map(lead =>
                lead.id === leadId ? {
                  ...lead,
                  sales_agent_id: sales_agent_id ? String(sales_agent_id) : null,
                  assignedToSales: sales_agent_name
                } : lead
              ),
            }
          })
        )
        setToast({ message: 'Lead manager updated successfully', type: 'success' })
      } else {
        setToast({ message: 'Failed to update lead manager', type: 'error' })
      }
    } catch (error) {
      console.error('Error updating lead manager:', error)
      setToast({ message: 'Error updating lead manager', type: 'error' })
    } finally {
      setEditingSalesAssignment(null)
    }
  }

  const isPostPreTherapy = (stageId: string): boolean =>
    ['pretherapy-call', 'booked-first-session', 'dropouts', 'leaks'].includes(stageId)

  return (
    <div className="pipeline-content relative min-h-full">
      {loading ? (
        <Loader />
      ) : (
        <>
          <header className="pipeline-header">
            <div>
              <h1>Pipeline</h1>
              <p className="pipeline-subtitle">Manage your leads through the therapy journey</p>
            </div>
          </header>

          <div className="kanban-board" ref={kanbanRef} onDragOver={handleDragOver} onDragLeave={stopAutoScroll}>
            {stages.map(stage => (
              <div
                key={stage.id}
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className="column-header">
                  <h3 className="column-title">{stage.title}</h3>
                  <span className="column-count">{stage.leads.length}</span>
                </div>

                <div className="column-content">
                  {stage.leads.length === 0 ? (
                    <div className="empty-state"><p>No leads</p></div>
                  ) : (
                    stage.leads.map(lead => {
                      const canAct = canActOnLead(lead)

                      return (
                        <div
                          key={lead.id}
                          className={`lead-card ${!canAct ? 'view-only' : ''} ${editingSalesAssignment === lead.id ? 'active-dropdown' : ''}`}
                          draggable={canAct}
                          onDragStart={(e) => {
                            e.stopPropagation()
                            handleDragStart(lead, stage.id)
                          }}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="lead-card-header">
                            <h4
                              className="lead-name text-teal-700 hover:underline cursor-pointer"
                              onClick={() => setCurrentPage && setCurrentPage(`lead-profile:${lead.id}`)}
                            >
                              {lead.name}
                            </h4>
                            <span className="lead-source">{lead.source}</span>
                          </div>

                          <div className="lead-card-body">
                            <div className="lead-contact-row">
                              <div className="lead-info">
                                <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="lead-contact-text">{lead.email || '—'}</span>
                              </div>
                              <div className="lead-info">
                                <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                                </svg>
                                <span className="lead-contact-text">{lead.phone}</span>
                              </div>
                            </div>

                            <div className="lead-assignment">
                              <div className="assignment-label">Lead Manager:</div>
                              {editingSalesAssignment === lead.id ? (
                                <div className="custom-dropdown w-full compact" ref={dropdownRef}>
                                  <button
                                    type="button"
                                    className="dropdown-trigger w-full compact"
                                  >
                                    <span>{lead.assignedToSales}</span>
                                    <svg className="dropdown-arrow open" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                  <div className="dropdown-menu w-full" style={{ left: 0, top: '100%', position: 'absolute', zIndex: 100 }}>
                                    <div className={`dropdown-item ${!lead.sales_agent_id || lead.sales_agent_id === 'null' ? 'selected' : ''}`} onClick={(e) => {
                                      e.stopPropagation()
                                      handleSalesAssignment(lead.id, stage.id, null, 'Unassigned')
                                    }}>Unassigned</div>
                                    {leadManagers.map(user => (
                                      <div
                                        key={user.id}
                                        className={`dropdown-item ${lead.assignedToSales === user.name ? 'selected' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleSalesAssignment(lead.id, stage.id, user.id, user.name)
                                        }}
                                      >
                                        {user.name}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="assignment-value"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    canAct && setEditingSalesAssignment(lead.id)
                                  }}
                                >
                                  {lead.assignedToSales}
                                  {canAct && (
                                    <svg className="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  )}
                                </div>
                              )}
                            </div>

                            {isPostPreTherapy(stage.id) && lead.assignedTherapist && (
                              <div className="lead-assignment">
                                <div className="assignment-label">Therapist:</div>
                                <div className="assignment-value therapist">{lead.assignedTherapist}</div>
                              </div>
                            )}

                            <div className="lead-footer">
                              <div className="lead-date">
                                <svg className="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                {formatDate(lead.date)}
                              </div>
                              <div className="lead-aging">
                                <svg className="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {calculateAging(lead.date)}
                              </div>
                            </div>

                            {/* Send Booking Link — shown from 'contacted' stage onwards */}
                            {stage.id !== 'lead-inquire' && (
                              <button
                                className="send-booking-btn"
                                onClick={e => {
                                  e.stopPropagation()
                                  setPrefilledClientData({
                                    name: lead.name,
                                    phone: lead.phone,
                                    email: lead.email || ''
                                  })
                                  setIsModalOpen(true)
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                </svg>
                                Send follow up session link
                              </button>
                            )}
                          </div>

                          {!canAct && (
                            <div className="view-only-badge">View Only</div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          <StageRemarkModal
            isOpen={pendingDrop !== null}
            fromStage={pendingDrop?.fromStageId ?? ''}
            toStage={pendingDrop?.toStageId ?? ''}
            leadName={pendingDrop?.lead.name ?? ''}
            onConfirm={handleRemarkConfirm}
            onCancel={handleRemarkCancel}
          />
          <SendBookingModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setPrefilledClientData(undefined);
            }}
            prefilledClient={prefilledClientData}
          />
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

export default PipelineContent
