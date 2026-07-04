import pool from '../lib/db';

export async function startLeadsBookingSync() {
  console.log('🚀 Leads → Bookings Sync Service Started');

  async function syncLeadsToBookings() {
    try {
      // Find leads marked as "first session booked" with therapist assigned
      const leads = await pool.query(`
        SELECT
          id,
          name,
          phone,
          email,
          therapist_id,
          stage_booked_first_session_at
        FROM leads
        WHERE stage_booked_first_session_at IS NOT NULL
        AND therapist_id IS NOT NULL
        AND email IS NOT NULL
        LIMIT 100
      `);

      console.log(`📌 Found ${leads.rows.length} leads to sync`);

      for (const lead of leads.rows) {
        try {
          // Check if booking already exists (by email or phone)
          const existingBooking = await pool.query(`
            SELECT invitee_email FROM bookings
            WHERE (invitee_email = $1 OR invitee_phone = $2)
            AND booking_host_name = (SELECT name FROM users WHERE id = $3)
            LIMIT 1
          `, [lead.email, lead.phone, lead.therapist_id]);

          if (existingBooking.rows.length > 0) {
            console.log(`⏭️  Booking exists for ${lead.name} (${lead.email})`);
            continue;
          }

          // Get therapist name
          const therapist = await pool.query(`
            SELECT name FROM users WHERE id = $1
          `, [lead.therapist_id]);

          if (therapist.rows.length === 0) {
            console.log(`⚠️  Therapist not found for lead ${lead.name} (ID: ${lead.therapist_id})`);
            continue;
          }

          const therapistName = therapist.rows[0].name;

          // Insert booking
          await pool.query(`
            INSERT INTO bookings (
              invitee_name,
              invitee_phone,
              invitee_email,
              booking_host_name,
              booking_status,
              booking_start_at,
              booking_user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            lead.name,
            lead.phone,
            lead.email,
            therapistName,
            'confirmed',
            lead.stage_booked_first_session_at,
            lead.therapist_id
          ]);

          console.log(`✅ Synced: ${lead.name} → ${therapistName}`);
        } catch (err) {
          console.error(`❌ Error syncing lead ${lead.name}:`, err);
        }
      }

      console.log(`✓ Sync cycle completed at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('❌ Leads sync error:', error);
    }
  }

  // Run immediately on startup
  await syncLeadsToBookings();

  // Run every 15 minutes
  setInterval(syncLeadsToBookings, 15 * 60 * 1000);
}
