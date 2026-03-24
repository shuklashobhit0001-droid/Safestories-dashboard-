import { useState, useEffect, useRef } from 'react'
import './LeadProfile.css'
import './MonthFilter.css'
import { Loader } from '../../../components/Loader'
import { Toast } from '../../../components/Toast'
import { SendBookingModal } from '../../../components/SendBookingModal'

interface Lead {
    id: string
    name: string
    phone: string
    email: string
    status: string
    pipeline_stage: string
    remark_lead_inquire?: string
    remark_contacted?: string
    remark_followup_1?: string
    remark_followup_2?: string
    remark_followup_3?: string
    remark_pretherapy_call?: string
    remark_booked_first_session?: string
    remark_dropouts?: string
    remark_leaks?: string
    general_remarks?: string
    stage_lead_inquire_at?: string
    stage_contacted_at?: string
    stage_followup_1_at?: string
    stage_followup_2_at?: string
    stage_followup_3_at?: string
    stage_pretherapy_call_at?: string
    stage_booked_first_session_at?: string
    stage_dropouts_at?: string
    stage_leaks_at?: string
    created_at: string
    source?: string
    sales_agent_id?: number
    therapist_id?: number
    sales_agent_name?: string
    therapist_name?: string
    pre_therapy_notes?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relation?: string
    therapy?: string
    remark_lead_manager?: string
    client_remark?: string
    age?: number
    city?: string
    preferred_mode_of_session?: string
}

interface LeadProfileProps {
    leadId: string
    onBack: () => void
    currentUser?: any
}

const STAGES = [
    { id: 'lead-inquire', label: 'Lead / Inquire', remarkKey: 'remark_lead_inquire', timestampKey: 'stage_lead_inquire_at' },
    { id: 'contacted', label: 'Contacted', remarkKey: 'remark_contacted', timestampKey: 'stage_contacted_at' },
    { id: 'followup-1', label: 'Follow-up 1', remarkKey: 'remark_followup_1', timestampKey: 'stage_followup_1_at' },
    { id: 'followup-2', label: 'Follow-up 2', remarkKey: 'remark_followup_2', timestampKey: 'stage_followup_2_at' },
    { id: 'followup-3', label: 'Follow-up 3', remarkKey: 'remark_followup_3', timestampKey: 'stage_followup_3_at' },
    { id: 'pretherapy-call', label: 'Pre-therapy Call', remarkKey: 'remark_pretherapy_call', timestampKey: 'stage_pretherapy_call_at' },
    { id: 'booked-first-session', label: 'Booked First Session', remarkKey: 'remark_booked_first_session', timestampKey: 'stage_booked_first_session_at' },
    { id: 'dropouts', label: 'Drop Outs', remarkKey: 'remark_dropouts', timestampKey: 'stage_dropouts_at' },
    { id: 'leaks', label: 'Leaks', remarkKey: 'remark_leaks', timestampKey: 'stage_leaks_at' },
]

const SOURCE_OPTIONS = [
    'Chatbot',
    'Website',
    'Direct',
    'Social Media',
    'Other',
]

const THERAPY_OPTIONS = [
    'Individual Therapy',
    'Couples Therapy',
    'Adolescents Therapy',
]

const StageRemarkCard = ({ stage, lead, isGeneral = false, canAct = false }: { stage?: any, lead: Lead, isGeneral?: boolean, canAct?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isEditingRemark, setIsEditingRemark] = useState(false)
    const [editRemarkText, setEditRemarkText] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const remarkContent = (isGeneral ? lead.general_remarks : lead[stage.remarkKey as keyof Lead]) as string

    if (!remarkContent && !isEditingRemark) return null

    const isLengthy = remarkContent && remarkContent.length > 80
    const displayText = !isExpanded && isLengthy ? remarkContent.substring(0, 80) + '...' : remarkContent

    const timestamp = isGeneral ? null : (stage ? lead[stage.timestampKey as keyof Lead] : null)

    const formattedDate = timestamp
        ? new Date(timestamp as string).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() + ' IST'
        : ''

    const titleDate = timestamp
        ? new Date(timestamp as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : ''

    const label = isGeneral ? 'GENERAL REMARK' : (stage ? stage.label.toUpperCase() : '')

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setEditRemarkText(remarkContent || '')
        setIsEditingRemark(true)
        setIsExpanded(true)
    }

    const handleSaveRemark = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsSaving(true)
        try {
            const fieldToUpdate = isGeneral ? 'general_remarks' : stage.remarkKey
            const res = await fetch(`/api/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [fieldToUpdate]: editRemarkText })
            })
            if (res.ok) {
                if (isGeneral) lead.general_remarks = editRemarkText
                else (lead as any)[stage.remarkKey] = editRemarkText
                setIsEditingRemark(false)
            }
        } catch (error) {
            console.error('Failed to save remark:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className={`lp-remark-card-new ${isExpanded ? 'expanded' : ''}`}>
            <div className="lp-remark-card-header-new" onClick={() => !isEditingRemark && isLengthy && setIsExpanded(!isExpanded)} style={{ cursor: (!isEditingRemark && isLengthy) ? 'pointer' : 'default' }}>
                <div className="lp-remark-card-title-row-new">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="lp-remark-badge-new">{label}</div>
                        {titleDate && <div className="lp-remark-title-date-new">{titleDate}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {!isEditingRemark && canAct && (
                            <button className="lp-remark-edit-icon" onClick={handleEditClick} title="Edit Remark" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        )}
                        {!isEditingRemark && isLengthy && (
                            <div className="lp-remark-expand-icon-new">
                                {isExpanded ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 15 12 9 18 15"></polyline></svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {formattedDate && <div className="lp-remark-time-full-new">{formattedDate}</div>}
            </div>

            {(isExpanded || isEditingRemark) && <div className="lp-remark-divider-new"></div>}

            <div className="lp-remark-card-body-new" style={{ marginTop: (isExpanded || isEditingRemark) ? '0.75rem' : '1rem' }}>
                <div className="lp-remark-content-title-new">Remarks:</div>
                {isEditingRemark ? (
                    <div style={{ marginTop: '0.5rem' }}>
                        <textarea
                            className="lp-edit-textarea"
                            rows={3}
                            value={editRemarkText}
                            onChange={(e) => setEditRemarkText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={(e) => { e.stopPropagation(); setIsEditingRemark(false); }} disabled={isSaving} className="lp-remark-btn cancel">Cancel</button>
                            <button onClick={handleSaveRemark} disabled={isSaving} className="lp-remark-btn save">{isSaving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                ) : (
                    <div className="lp-remark-text-content-new">{displayText}</div>
                )}
            </div>
        </div>
    )
}

const LeadProfile = ({ leadId, onBack, currentUser }: LeadProfileProps) => {
    const [lead, setLead] = useState<Lead | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)

    const canActOnLead = (leadData: Lead | null): boolean => {
        if (!currentUser || !leadData) return false
        const userId = String(currentUser.id)
        // Can act if you are the assigned manager OR if it's currently unassigned
        if (leadData.sales_agent_id && String(leadData.sales_agent_id) === userId) return true
        if (!leadData.sales_agent_id || String(leadData.sales_agent_id) === 'null') return true
        return false
    }

    const canAct = canActOnLead(lead)

    const [editForm, setEditForm] = useState<Partial<Lead>>({})
    const [leadManagers, setLeadManagers] = useState<{ id: number, name: string }[]>([])
    const [therapists, setTherapists] = useState<{ id: number, name: string }[]>([])
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [prefilledClientData, setPrefilledClientData] = useState<{ name: string, phone: string, email: string } | undefined>()

    // Custom dropdown states
    const [isSourceOpen, setIsSourceOpen] = useState(false)
    const [isManagerOpen, setIsManagerOpen] = useState(false)
    const [isTherapistOpen, setIsTherapistOpen] = useState(false)
    const [isTherapyOpen, setIsTherapyOpen] = useState(false)
    const [isModeOpen, setIsModeOpen] = useState(false)

    // Refs for outside click detection
    const sourceRef = useRef<HTMLDivElement>(null)
    const managerRef = useRef<HTMLDivElement>(null)
    const therapistRef = useRef<HTMLDivElement>(null)
    const therapyRef = useRef<HTMLDivElement>(null)
    const modeRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) setIsSourceOpen(false)
            if (managerRef.current && !managerRef.current.contains(event.target as Node)) setIsManagerOpen(false)
            if (therapistRef.current && !therapistRef.current.contains(event.target as Node)) setIsTherapistOpen(false)
            if (therapyRef.current && !therapyRef.current.contains(event.target as Node)) setIsTherapyOpen(false)
            if (modeRef.current && !modeRef.current.contains(event.target as Node)) setIsModeOpen(false)
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [leadRes, managersRes, therapistsRes] = await Promise.all([
                    fetch(`/api/leads/${leadId}`),
                    fetch(`/api/lead-managers`),
                    fetch(`/api/therapists`)
                ])
                if (leadRes.ok) {
                    const data = await leadRes.json()
                    setLead(data)
                }
                if (managersRes.ok) {
                    setLeadManagers(await managersRes.json())
                }
                if (therapistsRes.ok) {
                    setTherapists(await therapistsRes.json())
                }
            } catch (error) {
                console.error('Failed to fetch data', error)
            } finally {
                setLoading(false)
            }
        }

        fetchAllData()
    }, [leadId])

    const handleEditToggle = () => {
        if (!isEditing && lead) {
            setEditForm({
                created_at: lead.created_at,
                source: lead.source || '',
                sales_agent_id: lead.sales_agent_id ? Number(lead.sales_agent_id) : null,
                therapist_id: lead.therapist_id ? Number(lead.therapist_id) : null,
                emergency_contact_name: lead.emergency_contact_name || '',
                emergency_contact_phone: lead.emergency_contact_phone || '',
                emergency_contact_relation: lead.emergency_contact_relation || '',
                therapy: lead.therapy || '',
                remark_lead_manager: lead.remark_lead_manager || '',
                age: lead.age ?? null,
                city: lead.city || '',
                preferred_mode_of_session: lead.preferred_mode_of_session || ''
            })
            setIsEditing(true)
        }
        setIsEditing(!isEditing)
    }

    const handleSave = async () => {
        if (!lead) return
        // Only include fields that actually changed
        const changes: Partial<Lead> = {}
        if (editForm.created_at !== lead.created_at) changes.created_at = editForm.created_at
        if (editForm.source !== (lead.source || '')) changes.source = editForm.source
        // Use loose equality for IDs to handle string/number mismatches
        if (editForm.sales_agent_id != lead.sales_agent_id) changes.sales_agent_id = editForm.sales_agent_id
        if (editForm.therapist_id != lead.therapist_id) changes.therapist_id = editForm.therapist_id
        if (editForm.emergency_contact_name !== (lead.emergency_contact_name || '')) changes.emergency_contact_name = editForm.emergency_contact_name
        if (editForm.emergency_contact_phone !== (lead.emergency_contact_phone || '')) changes.emergency_contact_phone = editForm.emergency_contact_phone
        if (editForm.emergency_contact_relation !== (lead.emergency_contact_relation || '')) changes.emergency_contact_relation = editForm.emergency_contact_relation
        if (editForm.therapy !== (lead.therapy || '')) changes.therapy = editForm.therapy
        if (editForm.remark_lead_manager !== (lead.remark_lead_manager || '')) changes.remark_lead_manager = editForm.remark_lead_manager
        if (editForm.age != lead.age) changes.age = editForm.age
        if (editForm.city !== (lead.city || '')) changes.city = editForm.city
        if (editForm.preferred_mode_of_session !== (lead.preferred_mode_of_session || '')) changes.preferred_mode_of_session = editForm.preferred_mode_of_session

        // Final safety: remove any undefined keys and check if anything remains
        Object.keys(changes).forEach(key => (changes[key as keyof Lead] === undefined) && delete changes[key as keyof Lead])

        const body = JSON.stringify(changes)
        if (body === '{}') {
            setToast({ message: 'No changes detected to save.', type: 'error' })
            setIsEditing(false)
            return
        }

        setToast({ message: 'Saving changes...', type: 'success' })

        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body
            })
            if (res.ok) {
                setIsEditing(false)
                const updatedRes = await fetch(`/api/leads/${leadId}`)
                if (updatedRes.ok) setLead(await updatedRes.json())
                setToast({ message: 'Lead updated successfully!', type: 'success' })
            } else {
                setToast({ message: 'Failed to update lead.', type: 'error' })
            }
        } catch (error) {
            console.error('Failed to save lead info', error)
            setToast({ message: 'Error saving lead info.', type: 'error' })
        }
    }

    const formatDateObj = (dateString?: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        // Format for datetime-local input
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
    }

    const displayDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
    }

    if (loading) {
        return (
            <div className="lead-profile-container relative min-h-full">
                <Loader />
            </div>
        )
    }

    if (!lead) {
        return (
            <div className="lead-profile-container error">
                <div>Lead not found.</div>
                <button onClick={onBack} className="back-btn-simple">Go Back</button>
            </div>
        )
    }

    return (
        <div className="lead-profile-container">
            <div className="lead-profile-left">
                <div className="lp-header-row">
                    <button className="lp-back-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5" />
                            <path d="M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="lp-name">{lead.name}</h1>
                    <span className="lp-status-badge active">
                        {STAGES.find(s => s.id === lead.pipeline_stage)?.label || (lead.pipeline_stage ? lead.pipeline_stage.toUpperCase() : 'NEW')}
                    </span>
                    <div className="lp-header-actions">
                        {canAct && !isEditing && (
                            <button
                                className="lp-edit-btn action"
                                onClick={() => {
                                    setPrefilledClientData({
                                        name: lead.name,
                                        phone: lead.phone,
                                        email: lead.email || ''
                                    })
                                    setIsModalOpen(true)
                                }}
                            >
                                Send follow up session link
                            </button>
                        )}
                        {!canAct && (
                            <div className="view-only-badge" style={{ position: 'static', margin: 0 }}>View Only</div>
                        )}
                        {canAct && (
                            isEditing ? (
                                <>
                                    <button className="lp-edit-btn save" onClick={handleSave}>Save</button>
                                    <button className="lp-edit-btn cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                                </>
                            ) : (
                                <button className="lp-edit-btn" onClick={handleEditToggle}>Edit</button>
                            )
                        )}
                    </div>
                </div>

                <div className="lp-section">
                    <h3 className="lp-section-title">Contact Info:</h3>
                    <div className="lp-contact-item">
                        <svg className="lp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        <span className="lp-contact-text">{lead.phone || 'N/A'}</span>
                    </div>
                    <div className="lp-contact-item">
                        <svg className="lp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span className="lp-contact-text">{lead.email || 'N/A'}</span>
                    </div>
                </div>

                <div className="lp-section">
                    <h3 className="lp-section-title">Lead Info:</h3>
                    <div className="lp-details-grid">
                        <div className="lp-detail-item">
                            <span className="lp-detail-label">Date Created</span>
                            {isEditing ? (
                                <input type="datetime-local" className="lp-edit-input" value={formatDateObj(editForm.created_at)} onChange={(e) => setEditForm({ ...editForm, created_at: new Date(e.target.value).toISOString() })} />
                            ) : (
                                <span className="lp-detail-value">{displayDate(lead.created_at)}</span>
                            )}
                        </div>
                        <div className="lp-detail-item">
                            <span className="lp-detail-label">Source</span>
                            {isEditing ? (
                                <div className="custom-dropdown w-full" ref={sourceRef}>
                                    <button
                                        type="button"
                                        className="dropdown-trigger w-full"
                                        onClick={() => setIsSourceOpen(!isSourceOpen)}
                                    >
                                        <span>{editForm.source || 'Select Source'}</span>
                                        <svg className={`dropdown-arrow ${isSourceOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isSourceOpen && (
                                        <div className="dropdown-menu w-full">
                                            <div className="dropdown-item" onClick={() => { setEditForm({ ...editForm, source: '' }); setIsSourceOpen(false); }}>-- Select Source --</div>
                                            {SOURCE_OPTIONS.map(opt => (
                                                <div
                                                    key={opt}
                                                    className={`dropdown-item ${editForm.source === opt ? 'selected' : ''}`}
                                                    onClick={() => { setEditForm({ ...editForm, source: opt }); setIsSourceOpen(false); }}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="lp-detail-value" style={{ textTransform: 'capitalize' }}>{lead.source || 'N/A'}</span>
                            )}
                        </div>
                        <div className="lp-detail-item">
                            <span className="lp-detail-label">Lead Manager</span>
                            {isEditing ? (
                                <div className="custom-dropdown w-full" ref={managerRef}>
                                    <button
                                        type="button"
                                        className="dropdown-trigger w-full"
                                        onClick={() => setIsManagerOpen(!isManagerOpen)}
                                    >
                                        <span>{leadManagers.find(m => m.id === editForm.sales_agent_id)?.name || 'Unassigned'}</span>
                                        <svg className={`dropdown-arrow ${isManagerOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isManagerOpen && (
                                        <div className="dropdown-menu w-full">
                                            <div className="dropdown-item" onClick={() => { setEditForm({ ...editForm, sales_agent_id: null }); setIsManagerOpen(false); }}>Unassigned</div>
                                            {leadManagers.map(m => (
                                                <div
                                                    key={m.id}
                                                    className={`dropdown-item ${editForm.sales_agent_id === m.id ? 'selected' : ''}`}
                                                    onClick={() => { setEditForm({ ...editForm, sales_agent_id: m.id }); setIsManagerOpen(false); }}
                                                >
                                                    {m.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="lp-detail-value">{lead.sales_agent_name || 'Unassigned'}</span>
                            )}
                        </div>
                        <div className="lp-detail-item">
                            <span className="lp-detail-label">Assigned Therapist</span>
                            {isEditing ? (
                                <div className="custom-dropdown w-full" ref={therapistRef}>
                                    <button
                                        type="button"
                                        className="dropdown-trigger w-full"
                                        onClick={() => setIsTherapistOpen(!isTherapistOpen)}
                                    >
                                        <span>{therapists.find(t => t.id === editForm.therapist_id)?.name || 'Unassigned'}</span>
                                        <svg className={`dropdown-arrow ${isTherapistOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isTherapistOpen && (
                                        <div className="dropdown-menu w-full">
                                            <div className="dropdown-item" onClick={() => { setEditForm({ ...editForm, therapist_id: null }); setIsTherapistOpen(false); }}>Unassigned</div>
                                            {therapists.map(t => (
                                                <div
                                                    key={t.id}
                                                    className={`dropdown-item ${editForm.therapist_id === t.id ? 'selected' : ''}`}
                                                    onClick={() => { setEditForm({ ...editForm, therapist_id: t.id }); setIsTherapistOpen(false); }}
                                                >
                                                    {t.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="lp-detail-value">{lead.therapist_name || 'Unassigned'}</span>
                            )}
                        </div>
                        <div className="lp-detail-item">
                            <span className="lp-detail-label">Therapy</span>
                            {isEditing ? (
                                <div className="custom-dropdown w-full" ref={therapyRef}>
                                    <button
                                        type="button"
                                        className="dropdown-trigger w-full"
                                        onClick={() => setIsTherapyOpen(!isTherapyOpen)}
                                    >
                                        <span>{editForm.therapy || 'Select Therapy'}</span>
                                        <svg className={`dropdown-arrow ${isTherapyOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isTherapyOpen && (
                                        <div className="dropdown-menu w-full">
                                            <div className="dropdown-item" onClick={() => { setEditForm({ ...editForm, therapy: '' }); setIsTherapyOpen(false); }}>-- Select Therapy --</div>
                                            {THERAPY_OPTIONS.map(opt => (
                                                <div
                                                    key={opt}
                                                    className={`dropdown-item ${editForm.therapy === opt ? 'selected' : ''}`}
                                                    onClick={() => { setEditForm({ ...editForm, therapy: opt }); setIsTherapyOpen(false); }}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="lp-detail-value" style={{ textTransform: 'capitalize' }}>{lead.therapy || 'N/A'}</span>
                            )}
                        </div>
                        <div className="lp-detail-item">
                            <span className="lp-detail-label">Age</span>
                            {isEditing ? (
                                <input type="number" className="lp-edit-input" value={editForm.age || ''} onChange={(e) => setEditForm({ ...editForm, age: e.target.value ? parseInt(e.target.value) : undefined })} />
                            ) : (
                                <span className="lp-detail-value">{lead.age || 'N/A'}</span>
                            )}
                        </div>
                        <div className="lp-detail-item">
                            <span className="lp-detail-label">City</span>
                            {isEditing ? (
                                <input type="text" className="lp-edit-input" value={editForm.city || ''} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                            ) : (
                                <span className="lp-detail-value">{lead.city || 'N/A'}</span>
                            )}
                        </div>
                        <div className="lp-detail-item">
                            <span className="lp-detail-label">Preferred Mode</span>
                            {isEditing ? (
                                <div className="custom-dropdown w-full" ref={modeRef}>
                                    <button
                                        type="button"
                                        className="dropdown-trigger w-full"
                                        onClick={() => setIsModeOpen(!isModeOpen)}
                                    >
                                        <span>{editForm.preferred_mode_of_session || 'Select Mode'}</span>
                                        <svg className={`dropdown-arrow ${isModeOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isModeOpen && (
                                        <div className="dropdown-menu w-full">
                                            <div className="dropdown-item" onClick={() => { setEditForm({ ...editForm, preferred_mode_of_session: '' }); setIsModeOpen(false); }}>-- Select Mode --</div>
                                            <div className={`dropdown-item ${editForm.preferred_mode_of_session === 'Online' ? 'selected' : ''}`} onClick={() => { setEditForm({ ...editForm, preferred_mode_of_session: 'Online' }); setIsModeOpen(false); }}>Online</div>
                                            <div className={`dropdown-item ${editForm.preferred_mode_of_session === 'In-person' ? 'selected' : ''}`} onClick={() => { setEditForm({ ...editForm, preferred_mode_of_session: 'In-person' }); setIsModeOpen(false); }}>In-person</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="lp-detail-value">{lead.preferred_mode_of_session || 'N/A'}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lp-section">
                    <h3 className="lp-section-title">Emergency Contact:</h3>
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label className="lp-detail-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Name</label>
                                <input type="text" className="lp-edit-input" value={editForm.emergency_contact_name || ''} onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })} placeholder="Contact name" />
                            </div>
                            <div>
                                <label className="lp-detail-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Phone</label>
                                <input type="tel" className="lp-edit-input" value={editForm.emergency_contact_phone || ''} onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })} placeholder="Contact phone" />
                            </div>
                            <div>
                                <label className="lp-detail-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Relation</label>
                                <input type="text" className="lp-edit-input" value={editForm.emergency_contact_relation || ''} onChange={(e) => setEditForm({ ...editForm, emergency_contact_relation: e.target.value })} placeholder="e.g. Parent, Spouse" />
                            </div>
                        </div>
                    ) : (lead.emergency_contact_name || lead.emergency_contact_phone) ? (
                        <div className="lp-card-box">
                            {lead.emergency_contact_name && <div><strong>{lead.emergency_contact_name}</strong>{lead.emergency_contact_relation ? ` (${lead.emergency_contact_relation})` : ''}</div>}
                            {lead.emergency_contact_phone && <div style={{ color: '#64748b', marginTop: '0.25rem' }}>{lead.emergency_contact_phone}</div>}
                        </div>
                    ) : (
                        <div className="lp-card-box lp-empty-text">Not provided</div>
                    )}
                </div>

                <div className="lp-section">
                    <h3 className="lp-section-title">Pre-therapy Notes:</h3>
                    <div className={`lp-card-box ${!lead.pre_therapy_notes ? 'lp-empty-text' : ''}`}>
                        {lead.pre_therapy_notes || 'Pre-therapy notes will appear after consultation form is filled'}
                    </div>
                </div>

                <div className="lp-section">
                    <h3 className="lp-section-title">Client's Remarks:</h3>
                    <div className={`lp-card-box ${!lead.client_remark ? 'lp-empty-text' : ''}`}>
                        {lead.client_remark || 'No remarks available'}
                    </div>
                </div>

                <div className="lp-section">
                    <h3 className="lp-section-title">Lead Manager Remarks:</h3>
                    {isEditing ? (
                        <textarea
                            className="lp-edit-textarea"
                            rows={4}
                            value={editForm.remark_lead_manager || ''}
                            onChange={(e) => setEditForm({ ...editForm, remark_lead_manager: e.target.value })}
                            placeholder="Enter Lead Manager remarks..."
                        />
                    ) : (
                        <div className={`lp-card-box ${!lead.remark_lead_manager ? 'lp-empty-text' : ''}`}>
                            {lead.remark_lead_manager || 'No lead manager remarks available'}
                        </div>
                    )}
                </div>
            </div>

            <div className="lead-profile-right">
                <h2 className="lp-right-title">Stage Remarks</h2>
                <div className="lp-remarks-list">
                    {lead.general_remarks && <StageRemarkCard lead={lead} isGeneral={true} canAct={canAct} />}

                    {STAGES.map((stage) => <StageRemarkCard key={stage.id} stage={stage} lead={lead} canAct={canAct} />)}

                    {!STAGES.some(s => lead[s.remarkKey as keyof Lead]) && !lead.general_remarks && (
                        <div className="lp-no-remarks">No stage remarks have been recorded yet.</div>
                    )}
                </div>
            </div>
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
        </div>
    )
}

export default LeadProfile
