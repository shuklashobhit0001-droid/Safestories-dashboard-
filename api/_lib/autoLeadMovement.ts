import pool from './db.js';

// Flag to track if a booking has been processed for automatic lead movement
const PROCESSED_BOOKINGS_KEY = 'booking_lead_movement_processed';

export async function startAutoLeadMovementService() {
  console.log('🚀 Auto Lead Movement Service Started');

  async function processNewBookings() {
    try {
      // Get all bookings that haven't been processed yet for lead movement
      const unprocessedBookingsQuery = `
        SELECT DISTINCT 
          b.booking_id,
          b.invitee_name,
          b.invitee_email,
          b.invitee_phone,
          b.booking_resource_name,
          b.booking_host_name,
          b.invitee_payment_amount,
          b.therapist_id,
          b.booking_status,
          b.created_at
        FROM bookings b
        WHERE NOT EXISTS (
          SELECT 1 FROM booking_lead_movement_log 
          WHERE booking_id = b.booking_id AND processed = true
        )
        AND b.booking_status NOT IN ('cancelled', 'canceled', 'no-show')
        AND b.invitee_email IS NOT NULL OR b.invitee_phone IS NOT NULL
        ORDER BY b.created_at DESC
        LIMIT 50;
      `;

      const unprocessedBookings = await pool.query(unprocessedBookingsQuery);

      if (unprocessedBookings.rows.length === 0) {
        console.log('✓ No new bookings to process');
        return;
      }

      console.log(`📊 Found ${unprocessedBookings.rows.length} unprocessed bookings`);

      for (const booking of unprocessedBookings.rows) {
        try {
          await processBookingForLeadMovement(booking);
        } catch (error) {
          console.error(`❌ Error processing booking ${booking.booking_id}:`, error);
          // Log the error but continue processing other bookings
          await logProcessingError(booking.booking_id, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in auto lead movement sync:', error);
    }
  }

  async function processBookingForLeadMovement(booking: any) {
    const inviteePhone = booking.invitee_phone ? booking.invitee_phone.replace(/[\s\-\(\)\+]/g, '') : '';
    const inviteeEmail = booking.invitee_email ? booking.invitee_email.toLowerCase().trim() : '';

    if (!inviteePhone && !inviteeEmail) {
      console.log(`⚠️  Skipping booking ${booking.booking_id} - no phone or email`);
      await markProcessingComplete(booking.booking_id, 'skipped');
      return;
    }

    // Determine if it's a Free Consultation
    const isFreeConsultation = (booking.booking_resource_name || '').toLowerCase().includes('free consultation') || 
                              (booking.booking_resource_name || '').toLowerCase().includes('pre-therapy') ||
                              parseFloat(booking.invitee_payment_amount || '0') === 0;

    // Find matching lead
    const leadResult = await pool.query(
      `SELECT id, name, pipeline_stage, updated_at FROM leads 
       WHERE (RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), 10) = RIGHT($1, 10) 
          OR LOWER(TRIM(email)) = $2)
       ORDER BY created_at DESC LIMIT 1`,
      [inviteePhone, inviteeEmail]
    );

    let leadId = null;
    let targetStage = null;
    let timestampColumn = null;

    if (leadResult.rows.length > 0) {
      const lead = leadResult.rows[0];
      const currentStage = lead.pipeline_stage;
      leadId = lead.id;

      // Check if lead was manually updated recently (within last 10 minutes)
      const lastUpdated = new Date(lead.updated_at);
      const now = new Date();
      const minsSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

      if (minsSinceUpdate < 10) {
        console.log(`⏭️  Skipping auto-move for lead ${lead.name} - manually updated ${Math.round(minsSinceUpdate)} mins ago`);
        await markProcessingComplete(booking.booking_id, 'skipped_recent_manual');
        return;
      }

      if (isFreeConsultation) {
        const earlyStages = ['lead-inquire', 'contacted', 'followup-1', 'followup-2', 'followup-3'];
        if (earlyStages.includes(currentStage)) {
          targetStage = 'pretherapy-call';
          timestampColumn = 'stage_pretherapy_call_at';
        }
      } else {
        const convertStages = ['lead-inquire', 'contacted', 'pretherapy-call', 'followup-1', 'followup-2', 'followup-3', 'dropouts', 'leaks'];
        if (convertStages.includes(currentStage)) {
          targetStage = 'booked-first-session';
          timestampColumn = 'stage_booked_first_session_at';
        }
      }

      // Only update if target stage is different from current
      if (targetStage && currentStage !== targetStage) {
        const dateStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        const remark = `\n[System ${dateStr}]: Auto-moved to ${targetStage} due to booking ${booking.booking_id} (${isFreeConsultation ? 'Free' : 'Paid'})`;

        await pool.query(
          `UPDATE leads 
           SET pipeline_stage = $1, 
               ${timestampColumn} = CURRENT_TIMESTAMP,
               remark_lead_manager = COALESCE(remark_lead_manager, '') || $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [targetStage, remark, lead.id]
        );
        console.log(`✨ [Auto-Move] Lead "${lead.name}" (${lead.id}): ${currentStage} → ${targetStage}`);
        await markProcessingComplete(booking.booking_id, 'moved');
      } else {
        console.log(`⏭️  Skipping auto-move for lead ${lead.name} - already in target stage or no matching stage`);
        await markProcessingComplete(booking.booking_id, 'no_move_needed');
      }
    } else {
      // Auto-create lead for free consultation if not found
      if (isFreeConsultation && inviteePhone) {
        const defaultManager = await pool.query(
          `SELECT id FROM users WHERE role IN ('admin', 'sales') ORDER BY id LIMIT 1`
        );
        const salesAgentId = defaultManager.rows[0]?.id || null;

        const newLeadResult = await pool.query(
          `INSERT INTO leads (name, phone, email, source, sales_agent_id, status, pipeline_stage, stage_pretherapy_call_at, remark_lead_manager, created_at)
           VALUES ($1, $2, $3, $4, $5, 'New', 'pretherapy-call', CURRENT_TIMESTAMP, $6, CURRENT_TIMESTAMP)
           RETURNING id, name`,
          [
            booking.invitee_name,
            booking.invitee_phone,
            booking.invitee_email || null,
            'Free Consultation',
            salesAgentId,
            `Auto-created from Free Consultation booking: ${booking.booking_id}`
          ]
        );
        console.log(`✅ [Auto-Create] New lead: "${newLeadResult.rows[0].name}"`);
        await markProcessingComplete(booking.booking_id, 'created');
      } else {
        console.log(`⏭️  No lead found and not a free consultation - skipping auto-create`);
        await markProcessingComplete(booking.booking_id, 'skipped_no_lead');
      }
    }
  }

  async function markProcessingComplete(bookingId: string, status: string) {
    try {
      await pool.query(
        `INSERT INTO booking_lead_movement_log (booking_id, processed, status, processed_at)
         VALUES ($1, true, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (booking_id) DO UPDATE SET
           processed = true,
           status = $2,
           processed_at = CURRENT_TIMESTAMP`,
        [bookingId, status]
      );
    } catch (error) {
      console.error(`Error logging processing for booking ${bookingId}:`, error);
    }
  }

  async function logProcessingError(bookingId: string, error: any) {
    try {
      await pool.query(
        `INSERT INTO booking_lead_movement_log (booking_id, processed, status, processed_at, error_message)
         VALUES ($1, false, 'error', CURRENT_TIMESTAMP, $2)
         ON CONFLICT (booking_id) DO UPDATE SET
           status = 'error',
           error_message = $2,
           processed_at = CURRENT_TIMESTAMP`,
        [bookingId, error.message]
      );
    } catch (logError) {
      console.error(`Error logging error for booking ${bookingId}:`, logError);
    }
  }

  // Run immediately
  await processNewBookings();

  // Run every 2 minutes
  setInterval(processNewBookings, 2 * 60 * 1000);
}
