-- Create table to track which bookings have been processed for automatic lead movement
CREATE TABLE IF NOT EXISTS booking_lead_movement_log (
    id SERIAL PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL,
    processed BOOLEAN DEFAULT false,
    status VARCHAR(50),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_booking_movement_booking_id ON booking_lead_movement_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_movement_processed ON booking_lead_movement_log(processed);
CREATE INDEX IF NOT EXISTS idx_booking_movement_created_at ON booking_lead_movement_log(created_at DESC);

-- If you want to check current status
-- SELECT * FROM booking_lead_movement_log WHERE status IN ('error', 'skipped') LIMIT 20;
