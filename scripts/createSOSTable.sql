CREATE TABLE IF NOT EXISTS sos_risk_assessments (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(255),
  therapist_id INTEGER,
  therapist_name VARCHAR(255),
  client_name VARCHAR(255),
  session_name VARCHAR(255),
  session_timings TEXT,
  contact_info VARCHAR(255),
  mode VARCHAR(100),
  
  -- Risk Severity
  risk_severity_level INTEGER NOT NULL,
  risk_severity_description TEXT,
  
  -- Risk Indicators (Y/N/U)
  emotional_dysregulation CHAR(1),
  physical_harm_ideas CHAR(1),
  drug_alcohol_abuse CHAR(1),
  suicidal_attempt CHAR(1),
  self_harm CHAR(1),
  delusions_hallucinations CHAR(1),
  impulsiveness CHAR(1),
  severe_stress CHAR(1),
  social_isolation CHAR(1),
  concern_by_others CHAR(1),
  other_risk CHAR(1),
  other_details TEXT,
  
  -- Risk Summary
  risk_summary TEXT NOT NULL,
  
  -- System & Status
  webhook_sent BOOLEAN DEFAULT FALSE,
  webhook_response TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  resolution_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sos_assessments_therapist_id ON sos_risk_assessments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sos_assessments_booking_id ON sos_risk_assessments(booking_id);
CREATE INDEX IF NOT EXISTS idx_sos_assessments_status ON sos_risk_assessments(status);
CREATE INDEX IF NOT EXISTS idx_sos_assessments_severity ON sos_risk_assessments(risk_severity_level);
CREATE INDEX IF NOT EXISTS idx_sos_assessments_created_at ON sos_risk_assessments(created_at);