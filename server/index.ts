import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import multer from 'multer';
import { randomUUID } from 'crypto';
import pool from '../lib/db';
import { convertToIST } from '../lib/timezone';
import { startDashboardApiBookingSync } from './dashboardApiBookingSync';
import { uploadFile } from '../lib/minio';

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (reasonable for profile pictures)
  }
});

// Helper function to get current IST timestamp as formatted string
const getCurrentISTTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' IST';
};

const app = express();
app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      // Log therapist login
      if (user.role === 'therapist') {
        try {
          await pool.query(
            `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, timestamp, is_visible)
             VALUES ($1, $2, $3, $4, $5, true)`,
            [user.therapist_id, username, 'login', `${username} logged into dashboard`, getCurrentISTTimestamp()]
          );
        } catch (auditError) {
          console.error('❌ Failed to create audit log for login:', auditError);
        }
      }
      
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Verify password endpoint (for case history access)
app.post('/api/verify-password', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Change password endpoint
app.post('/api/change-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username',
      [newPassword, userId]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, message: 'Password changed successfully' });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// Save new therapist request with OTP
app.post('/api/new-therapist-requests', async (req, res) => {
  try {
    const { therapistName, whatsappNumber, email, specializations, specializationDetails } = req.body;

    // Generate 6-digit OTP
    const otpToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 24 hours from now
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + 24);

    const result = await pool.query(
      `INSERT INTO new_therapist_requests (therapist_name, whatsapp_number, email, specializations, specialization_details, otp_token, otp_expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [therapistName, whatsappNumber, email, specializations, JSON.stringify(specializationDetails), otpToken, otpExpiresAt]
    );

    // TODO: Send email with OTP to therapist
    // OTP: ${otpToken} (expires at ${otpExpiresAt})

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error saving new therapist request:', error);
    res.status(500).json({ success: false, error: 'Failed to save new therapist request' });
  }
});

// Verify therapist OTP
app.post('/api/verify-therapist-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const result = await pool.query(
      `SELECT * FROM new_therapist_requests 
       WHERE LOWER(email) = LOWER($1) AND otp_token = $2 AND status = 'pending'`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or OTP' });
    }

    const request = result.rows[0];

    // Check if OTP is expired
    const now = new Date();
    const expiresAt = new Date(request.otp_expires_at);
    
    if (now > expiresAt) {
      await pool.query(
        `UPDATE new_therapist_requests SET status = 'expired' WHERE request_id = $1`,
        [request.request_id]
      );
      return res.status(401).json({ success: false, error: 'OTP has expired' });
    }

    // Return therapist request data for pre-filling
    res.json({ 
      success: true, 
      data: {
        requestId: request.request_id,
        name: request.therapist_name,
        email: request.email,
        phone: request.whatsapp_number,
        specializations: request.specializations,
        specializationDetails: JSON.parse(request.specialization_details || '[]')
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

// Complete therapist profile
app.post('/api/complete-therapist-profile', async (req, res) => {
  try {
    const { 
      requestId,
      name, 
      email, 
      phone, 
      specializations, 
      specializationDetails,
      qualification,
      qualificationPdfUrl,
      profilePictureUrl,
      password 
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'All required fields must be provided' });
    }

    // Check if therapist already exists
    const existingTherapist = await pool.query(
      `SELECT * FROM therapists WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (existingTherapist.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Therapist with this email already exists' });
    }

    // Create therapist entry
    const therapistResult = await pool.query(
      `INSERT INTO therapists (
        name, email, phone_number, specializations, 
        qualification_pdf_url, profile_picture_url, is_profile_complete
      )
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [name, email, phone, specializations, qualificationPdfUrl || null, profilePictureUrl || null]
    );

    const therapist = therapistResult.rows[0];

    // Create user entry for login
    const username = email.split('@')[0]; // Use email prefix as username
    await pool.query(
      `INSERT INTO users (username, password, role, therapist_id, full_name)
       VALUES ($1, $2, 'therapist', $3, $4)`,
      [username, password, therapist.therapist_id, name]
    );

    // Update new_therapist_requests status
    await pool.query(
      `UPDATE new_therapist_requests SET status = 'completed' WHERE request_id = $1`,
      [requestId]
    );

    res.json({ success: true, message: 'Profile created successfully', therapistId: therapist.therapist_id });
  } catch (error) {
    console.error('Error completing therapist profile:', error);
    res.status(500).json({ success: false, error: 'Failed to complete profile' });
  }
});

// Get therapist profile
app.get('/api/therapist-profile', async (req, res) => {
  try {
    const { therapist_id } = req.query;

    if (!therapist_id) {
      return res.status(400).json({ error: 'Therapist ID is required' });
    }

    const result = await pool.query(
      `SELECT * FROM therapists WHERE therapist_id = $1`,
      [therapist_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching therapist profile:', error);
    res.status(500).json({ error: 'Failed to fetch therapist profile' });
  }
});

// Upload file endpoint (profile picture or qualification PDF)
app.post('/api/upload-file', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer error:', err);
      return res.status(400).json({ 
        success: false, 
        error: `File upload error: ${err.message}` 
      });
    } else if (err) {
      console.error('❌ Unknown upload error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'File upload failed' 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { folder } = req.body; // 'profile-pictures' or 'qualification-pdfs'
    
    if (!folder || !['profile-pictures', 'qualification-pdfs'].includes(folder)) {
      return res.status(400).json({ success: false, error: 'Invalid folder specified' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${originalName}`;

    // Upload to MinIO
    const fileUrl = await uploadFile(
      req.file.buffer,
      fileName,
      folder as 'profile-pictures' | 'qualification-pdfs',
      req.file.mimetype
    );

    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Update therapist profile
app.put('/api/therapist-profile', async (req, res) => {
  try {
    const { 
      therapist_id,
      name, 
      email, 
      phone, 
      specializations,
      qualificationPdfUrl,
      profilePictureUrl
    } = req.body;

    if (!therapist_id) {
      return res.status(400).json({ error: 'Therapist ID is required' });
    }

    const result = await pool.query(
      `UPDATE therapists 
       SET name = $1, contact_info = $2, phone_number = $3, specialization = $4,
           qualification_pdf_url = $5, profile_picture_url = $6
       WHERE therapist_id = $7
       RETURNING *`,
      [name, email, phone, specializations, qualificationPdfUrl, profilePictureUrl, therapist_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating therapist profile:', error);
    res.status(500).json({ error: 'Failed to update therapist profile' });
  }
});

// Update password
app.post('/api/update-password', async (req, res) => {
  try {
    const { user_id, new_password } = req.body;

    if (!user_id || !new_password) {
      return res.status(400).json({ success: false, error: 'User ID and new password are required' });
    }

    const result = await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2 RETURNING id`,
      [new_password, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});

// ==================== FORGOT PASSWORD ENDPOINTS ====================

// Import email function at top of file (add this import)
import { sendPasswordResetOTP } from '../lib/email';
import crypto from 'crypto';

// Helper function to generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate secure token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 1. Send OTP for password reset
app.post('/api/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }

    // Check if user exists
    const userResult = await pool.query(
      `SELECT id, username, full_name, email FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists (security)
      return res.json({ 
        success: true, 
        message: 'If this email exists, an OTP has been sent',
        expiresIn: 600 
      });
    }

    const user = userResult.rows[0];

    // Check rate limiting (max 3 requests per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const attemptsResult = await pool.query(
      `SELECT COUNT(*) as count FROM password_reset_attempts 
       WHERE LOWER(email) = LOWER($1) AND attempted_at > $2`,
      [email, oneHourAgo]
    );

    const attemptCount = parseInt(attemptsResult.rows[0].count);
    if (attemptCount >= 3) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too many requests. Please try again in an hour.' 
      });
    }

    // Generate OTP and token
    const otp = generateOTP();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in database
    await pool.query(
      `INSERT INTO password_reset_tokens 
       (user_id, email, otp, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, email, otp, token, expiresAt, ipAddress, req.headers['user-agent']]
    );

    // Log attempt
    await pool.query(
      `INSERT INTO password_reset_attempts (email, ip_address, success)
       VALUES ($1, $2, true)`,
      [email, ipAddress]
    );

    // Send email
    try {
      await sendPasswordResetOTP(email, user.full_name || user.username, otp, expiresAt);
      
      res.json({ 
        success: true, 
        message: 'OTP sent to your email',
        expiresIn: 600 // 10 minutes in seconds
      });
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send OTP email. Please try again.' 
      });
    }

  } catch (error) {
    console.error('❌ Error in send-otp:', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
});

// 2. Verify OTP
app.post('/api/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    // Find OTP record
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE LOWER(email) = LOWER($1) AND otp = $2 AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    const resetRecord = result.rows[0];

    // Check if expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      console.log('❌ Expired OTP for:', email);
      return res.status(410).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    // Mark as verified (but not used yet)
    await pool.query(
      `UPDATE password_reset_tokens SET verified = true WHERE id = $1`,
      [resetRecord.id]
    );

    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      resetToken: resetRecord.token 
    });

  } catch (error) {
    console.error('❌ Error in verify-otp:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

// 3. Reset password
app.post('/api/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, error: 'Password must contain at least one number' });
    }

    // Find verified OTP record
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE LOWER(email) = LOWER($1) AND otp = $2 AND verified = true AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or unverified OTP' });
    }

    const resetRecord = result.rows[0];

    // Check if expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      console.log('❌ Expired OTP for:', email);
      return res.status(410).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    // Update password
    const updateResult = await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2 RETURNING id, username`,
      [newPassword, resetRecord.user_id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Mark token as used
    await pool.query(
      `UPDATE password_reset_tokens SET used = true WHERE id = $1`,
      [resetRecord.id]
    );

    // Invalidate all other reset tokens for this user
    await pool.query(
      `UPDATE password_reset_tokens SET used = true 
       WHERE user_id = $1 AND id != $2 AND used = false`,
      [resetRecord.user_id, resetRecord.id]
    );

    res.json({ 
      success: true, 
      message: 'Password reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('❌ Error in reset password:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// ==================== END FORGOT PASSWORD ENDPOINTS ====================

// Get admin profile
app.get('/api/admin-profile', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await pool.query(
      `SELECT id, username, full_name, email, phone, profile_picture_url FROM users WHERE id = $1 AND role = 'admin'`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
});

// Update admin profile
app.put('/api/admin-profile', async (req, res) => {
  try {
    const { 
      user_id,
      name, 
      email, 
      phone, 
      profilePictureUrl
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, email = $2, phone = $3, profile_picture_url = $4
       WHERE id = $5 AND role = 'admin'
       RETURNING id, username, full_name, email, phone, profile_picture_url`,
      [name, email, phone, profilePictureUrl, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ error: 'Failed to update admin profile' });
  }
});

// Get live sessions count
app.get('/api/live-sessions-count', async (req, res) => {
  try {
    // Prevent caching of live session data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const result = await pool.query(`
      SELECT booking_invitee_time
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND therapist_id IS NOT NULL
        AND booking_resource_name NOT ILIKE '%free consultation%'
    `);

    let liveCount = 0;

    result.rows.forEach(row => {
      const timeMatch = row.booking_invitee_time.match(/at\s+(\d+:\d+\s+[AP]M)\s+-\s+(\d+:\d+\s+[AP]M)/);
      
      if (timeMatch) {
        const dateStr = row.booking_invitee_time.match(/(\w+,\s+\w+\s+\d+,\s+\d+)/)?.[1];
        const startTimeStr = timeMatch[1];
        const endTimeStr = timeMatch[2];
        
        if (dateStr) {
          const startIST = new Date(`${dateStr} ${startTimeStr} GMT+0530`);
          const endIST = new Date(`${dateStr} ${endTimeStr} GMT+0530`);
          const nowUTC = new Date();
          
          if (nowUTC >= startIST && nowUTC <= endIST) {
            liveCount++;
          }
        }
      }
    });

    res.json({ liveCount });
  } catch (error) {
    console.error('Error fetching live sessions count:', error);
    res.status(500).json({ error: 'Failed to fetch live sessions count' });
  }
});

// Get dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { start, end } = req.query;
    const hasDateFilter = start && end;
    
    // Calculate last month date range
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    const revenue = hasDateFilter
      ? await pool.query(
          'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['cancelled', 'canceled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2)',
          ['cancelled', 'canceled']
        );

    // NEW: Bookings - count everything
    const bookings = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings'
        );

    // NEW: Sessions Completed - count ALL completed sessions (paid + free) where session date has passed
    const sessionsCompleted = hasDateFilter
      ? await pool.query(
          `SELECT COUNT(*) as total FROM bookings b
           WHERE b.booking_start_at < NOW()
           AND b.booking_status NOT IN ($1, $2, $3, $4)
           AND b.booking_start_at BETWEEN $5 AND $6`,
          ['cancelled', 'canceled', 'no_show', 'no show', start, `${end} 23:59:59`]
        )
      : await pool.query(
          `SELECT COUNT(*) as total FROM bookings b
           WHERE b.booking_start_at < NOW()
           AND b.booking_status NOT IN ($1, $2, $3, $4)`,
          ['cancelled', 'canceled', 'no_show', 'no show']
        );

    const freeConsultations = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) AND booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL)'
        );

    const cancelled = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['cancelled', 'canceled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2)',
          ['cancelled', 'canceled']
        );

    const refunds = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL'
        );

    const refundedAmount = hasDateFilter
      ? await pool.query(
          'SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL'
        );

    const noShows = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['no_show', 'no show', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2)',
          ['no_show', 'no show']
        );

    // Last month stats
    const lastMonthBookings = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_start_at BETWEEN $1 AND $2',
      [lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthSessionsCompleted = await pool.query(
      `SELECT COUNT(*) as total FROM bookings b
       WHERE b.booking_start_at < NOW()
       AND b.booking_status NOT IN ($1, $2, $3, $4)
       AND b.booking_start_at BETWEEN $5 AND $6`,
      ['cancelled', 'canceled', 'no_show', 'no show', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthFreeConsultations = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) AND booking_start_at BETWEEN $1 AND $2',
      [lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthCancelled = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['cancelled', 'canceled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthRefunds = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE refund_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['completed', 'processed', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthNoShows = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['no_show', 'no show', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const responseData = {
      revenue: revenue.rows[0].total,
      refundedAmount: refundedAmount.rows[0].total,
      bookings: bookings.rows[0].total,
      lastMonthBookings: lastMonthBookings.rows[0].total,
      sessionsCompleted: sessionsCompleted.rows[0].total,
      lastMonthSessionsCompleted: lastMonthSessionsCompleted.rows[0].total,
      freeConsultations: freeConsultations.rows[0].total,
      lastMonthFreeConsultations: lastMonthFreeConsultations.rows[0].total,
      cancelled: cancelled.rows[0].total,
      lastMonthCancelled: lastMonthCancelled.rows[0].total,
      refunds: refunds.rows[0].total,
      lastMonthRefunds: lastMonthRefunds.rows[0].total,
      noShows: noShows.rows[0].total,
      lastMonthNoShows: lastMonthNoShows.rows[0].total,
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get upcoming bookings
app.get('/api/dashboard/bookings', async (req, res) => {
  try {
    // Prevent caching of booking data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const { start, end, limit = '3' } = req.query;
    const limitNum = parseInt(limit as string) || 3;
    
    const result = start && end
      ? await pool.query(
          `SELECT 
            invitee_name as client_name,
            invitee_email as client_email,
            invitee_phone as client_phone,
            booking_resource_name as therapy_type,
            booking_mode as mode,
            booking_host_name as therapist_name,
            booking_invitee_time
          FROM bookings
          WHERE booking_status NOT IN ($1, $2)
            AND booking_start_at BETWEEN $3 AND $4
          ORDER BY booking_start_at ASC
          LIMIT $5`,
          ['cancelled', 'canceled', start, `${end} 23:59:59`, limitNum]
        )
      : await pool.query(
          `SELECT 
            invitee_name as client_name,
            invitee_email as client_email,
            invitee_phone as client_phone,
            booking_resource_name as therapy_type,
            booking_mode as mode,
            booking_host_name as therapist_name,
            booking_invitee_time
          FROM bookings
          WHERE booking_status NOT IN ($1, $2, $3, $4)
          ORDER BY booking_start_at ASC`,
          ['cancelled', 'canceled', 'no_show', 'no show']
        );

    // Filter upcoming sessions based on booking_invitee_time
    const nowUTC = new Date();
    const upcomingBookings = result.rows.filter(row => {
      try {
        const timeMatch = row.booking_invitee_time.match(/at\s+(\d+):(\d+)\s+([AP]M)\s+-\s+(\d+):(\d+)\s+([AP]M)/);
        
        if (!timeMatch) {
          console.log('No time match for:', row.booking_invitee_time);
          return false;
        }
        
        const dateStr = row.booking_invitee_time.match(/(\w+),\s+(\w+)\s+(\d+),\s+(\d+)/);
        
        if (!dateStr) {
          console.log('No date match for:', row.booking_invitee_time);
          return false;
        }
        
        const month = dateStr[2];
        const day = parseInt(dateStr[3]);
        const year = parseInt(dateStr[4]);
        
        // Parse end time
        let endHour = parseInt(timeMatch[4]);
        const endMinute = parseInt(timeMatch[5]);
        const endPeriod = timeMatch[6];
        
        // Convert to 24-hour format
        if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
        if (endPeriod === 'AM' && endHour === 12) endHour = 0;
        
        // Parse timezone offset
        const timezoneMatch = row.booking_invitee_time.match(/GMT([+-])(\d+):(\d+)/);
        let timezoneOffset = 330; // Default to IST (+5:30)
        
        if (timezoneMatch) {
          const sign = timezoneMatch[1] === '+' ? 1 : -1;
          const hours = parseInt(timezoneMatch[2]);
          const minutes = parseInt(timezoneMatch[3]);
          timezoneOffset = sign * (hours * 60 + minutes);
        }
        
        // Create date in UTC
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        const endDate = new Date(Date.UTC(year, monthMap[month], day, endHour, endMinute));
        // Adjust for timezone offset (subtract because we want UTC)
        endDate.setMinutes(endDate.getMinutes() - timezoneOffset);
        
        const isUpcoming = endDate > nowUTC;
        
        // Debug log for Aarohi
        if (row.client_name && row.client_name.includes('Aarohi')) {
          console.log('Aarohi debug:', {
            raw: row.booking_invitee_time,
            endHour, endMinute, endPeriod,
            timezoneOffset,
            endDate: endDate.toISOString(),
            nowUTC: nowUTC.toISOString(),
            isUpcoming
          });
        }
        
        // Session is upcoming if end time hasn't passed
        return isUpcoming;
      } catch (error) {
        console.error('Error parsing booking time:', error, row.booking_invitee_time);
        return false;
      }
    }).slice(0, limitNum);

    const bookings = upcomingBookings.map(row => ({
      ...row,
      booking_start_at: convertToIST(row.booking_invitee_time) || 'N/A',
      mode: row.mode ? row.mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet'
    }));

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get all clients
app.get('/api/clients', async (req, res) => {
  try {
    // Prevent caching of client data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_status,
        1 as session_count,
        invitee_created_at as created_at,
        booking_start_at as latest_booking_date
      FROM bookings
      
      UNION ALL
      
      SELECT 
        client_name as invitee_name,
        client_whatsapp as invitee_phone,
        client_email as invitee_email,
        therapist_name as booking_host_name,
        NULL as booking_status,
        0 as session_count,
        created_at,
        created_at as latest_booking_date
      FROM booking_requests
    `);

    // Group by email (primary) or phone (fallback)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    result.rows.forEach(row => {
      const email = row.invitee_email ? row.invitee_email.toLowerCase().trim() : null;
      const phone = row.invitee_phone ? row.invitee_phone.replace(/[\s\-\(\)\+]/g, '') : null;
      
      let key = null;
      
      // Find existing key by email or phone
      if (email && emailToKey.has(email)) {
        key = emailToKey.get(email);
      } else if (phone && phoneToKey.has(phone)) {
        key = phoneToKey.get(phone);
        // If we now have an email for this phone-based entry, upgrade the key
        if (email) {
          const oldData = clientMap.get(key);
          clientMap.delete(key);
          key = email;
          clientMap.set(key, oldData);
          emailToKey.set(email, key);
        }
      } else {
        // New client
        key = email || phone;
      }
      
      if (!key) return;
      
      // Track mappings
      if (email) emailToKey.set(email, key);
      if (phone) phoneToKey.set(phone, key);
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          invitee_name: row.invitee_name,
          invitee_phone: row.invitee_phone,
          invitee_email: row.invitee_email,
          session_count: 0,
          booking_host_name: row.booking_host_name,
          created_at: row.created_at,
          latest_booking_date: null,
          booking_link_sent_at: null,
          therapists: []
        });
      }
      
      const client = clientMap.get(key);
      client.session_count += parseInt(row.session_count) || 0;
      
      // Track most recent booking_request created_at (only for leads with session_count = 0)
      if (parseInt(row.session_count) === 0 && row.created_at) {
        if (!client.booking_link_sent_at || new Date(row.created_at) > new Date(client.booking_link_sent_at)) {
          client.booking_link_sent_at = row.created_at;
        }
      }
      
      // Update latest_booking_date only from active bookings
      const isActiveBooking = row.booking_status && !['cancelled', 'canceled', 'no_show', 'no show'].includes(row.booking_status);
      if (isActiveBooking || !row.booking_status) {
        if (!client.latest_booking_date || new Date(row.latest_booking_date) > new Date(client.latest_booking_date)) {
          client.latest_booking_date = row.latest_booking_date;
        }
      }
      
      // Update to most recent phone number and therapist
      if (new Date(row.latest_booking_date) > new Date(client.created_at)) {
        client.invitee_phone = row.invitee_phone;
        if (parseInt(row.session_count) > 0) {
          client.booking_host_name = row.booking_host_name;
        }
      }
      
      // Fill in missing email if found
      if (row.invitee_email && !client.invitee_email) {
        client.invitee_email = row.invitee_email;
      }
      
      // Add to therapists array only if different therapist
      if (parseInt(row.session_count) > 0) {
        const existing = client.therapists.find((t: any) => 
          t.booking_host_name === row.booking_host_name
        );
        
        if (existing) {
          existing.session_count += parseInt(row.session_count) || 0;
        } else {
          client.therapists.push({
            invitee_name: row.invitee_name,
            invitee_phone: row.invitee_phone,
            booking_host_name: row.booking_host_name,
            session_count: parseInt(row.session_count) || 0
          });
        }
      }
    });

    const clients = Array.from(clientMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.booking_invitee_time,
        b.booking_resource_name,
        b.invitee_name,
        b.invitee_phone,
        b.invitee_email,
        b.booking_host_name,
        b.booking_mode,
        b.booking_start_at,
        b.booking_joining_link,
        b.booking_checkin_url,
        b.therapist_id,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes,
        (b.booking_start_at < NOW()) as is_past
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      ORDER BY b.booking_start_at DESC
    `);

    const appointments = result.rows.map(row => {
      let status = row.booking_status;
      
      if (row.booking_status !== 'cancelled' && row.booking_status !== 'canceled' && row.booking_status !== 'no_show' && row.booking_status !== 'no show') {
        if (row.has_session_notes) {
          status = 'completed';
        } else if (row.is_past) {
          status = 'pending_notes';
        }
      }
      
      return {
        booking_id: row.booking_id,
        booking_start_at: convertToIST(row.booking_invitee_time) || 'N/A',
        booking_resource_name: row.booking_resource_name,
        invitee_name: row.invitee_name,
        invitee_phone: row.invitee_phone,
        invitee_email: row.invitee_email,
        booking_host_name: row.booking_host_name,
        booking_mode: row.booking_mode ? row.booking_mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet',
        booking_joining_link: row.booking_joining_link,
        booking_checkin_url: row.booking_checkin_url,
        therapist_id: row.therapist_id,
        has_session_notes: row.has_session_notes,
        booking_status: status,
        booking_start_at_raw: row.booking_start_at
      };
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get therapists by therapy
app.get('/api/therapists-by-therapy', async (req, res) => {
  try {
    const { therapy_name } = req.query;
    
    if (!therapy_name) {
      return res.status(400).json({ error: 'Therapy name is required' });
    }

    const result = await pool.query(`
      SELECT therapist_id, name as therapist_name
      FROM therapists
      WHERE specialization ILIKE $1
      ORDER BY name ASC
    `, [`%${therapy_name}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching therapists by therapy:', error);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// Get all therapies
app.get('/api/therapies', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT specialization FROM therapists WHERE specialization IS NOT NULL');
    const therapySet = new Set<string>();
    result.rows.forEach(row => {
      const specializations = row.specialization.split(',').map((s: string) => s.trim());
      specializations.forEach((spec: string) => therapySet.add(spec));
    });
    const therapies = Array.from(therapySet).sort().map(therapy => ({ therapy_name: therapy }));
    res.json(therapies);
  } catch (error) {
    console.error('Error fetching therapies:', error);
    res.status(500).json({ error: 'Failed to fetch therapies' });
  }
});

// Save booking request
app.post('/api/booking-requests', async (req, res) => {
  try {
    const { clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink, isFreeConsultation, adminId } = req.body;

    const result = await pool.query(
      `INSERT INTO booking_requests (client_name, client_whatsapp, client_email, therapy_type, therapist_name, booking_link, status, is_free_consultation)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7)
       RETURNING *`,
      [clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink, isFreeConsultation || false]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error saving booking request:', error);
    res.status(500).json({ success: false, error: 'Failed to save booking request' });
  }
});

// Get therapists live status
app.get('/api/therapists-live-status', async (req, res) => {
  try {
    // Prevent caching of live status data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const result = await pool.query(`
      SELECT DISTINCT booking_host_name, booking_invitee_time
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND therapist_id IS NOT NULL
        AND booking_resource_name NOT ILIKE '%free consultation%'
    `);

    const liveStatus: { [key: string]: boolean } = {};

    result.rows.forEach(row => {
      const timeMatch = row.booking_invitee_time.match(/at\s+(\d+:\d+\s+[AP]M)\s+-\s+(\d+:\d+\s+[AP]M)/);
      
      if (timeMatch) {
        const dateStr = row.booking_invitee_time.match(/(\w+,\s+\w+\s+\d+,\s+\d+)/)?.[1];
        const startTimeStr = timeMatch[1];
        const endTimeStr = timeMatch[2];
        
        if (dateStr) {
          const startIST = new Date(`${dateStr} ${startTimeStr} GMT+0530`);
          const endIST = new Date(`${dateStr} ${endTimeStr} GMT+0530`);
          const nowUTC = new Date();
          
          if (nowUTC >= startIST && nowUTC <= endIST) {
            const firstName = row.booking_host_name.split(' ')[0];
            liveStatus[firstName] = true;
          }
        }
      }
    });

    res.json(liveStatus);
  } catch (error) {
    console.error('Error fetching therapists live status:', error);
    res.status(500).json({ error: 'Failed to fetch therapists live status' });
  }
});

// Get all therapists
app.get('/api/therapists', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.therapist_id,
        t.name,
        t.specialization,
        t.contact_info,
        t.profile_picture_url,
        t.phone_number,
        COUNT(DISTINCT b.booking_id) as total_sessions_lifetime,
        COUNT(DISTINCT CASE 
          WHEN EXTRACT(MONTH FROM b.booking_start_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM b.booking_start_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          THEN b.booking_id 
        END) as sessions_this_month,
        COALESCE(SUM(b.invitee_payment_amount), 0) as total_revenue,
        COALESCE(SUM(CASE 
          WHEN EXTRACT(MONTH FROM b.booking_start_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM b.booking_start_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          THEN b.invitee_payment_amount 
          ELSE 0 
        END), 0) as revenue_this_month
      FROM therapists t
      LEFT JOIN bookings b ON (
        TRIM(b.booking_host_name) ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
        OR TRIM(b.booking_host_name) ILIKE t.name
      )
      GROUP BY t.therapist_id, t.name, t.specialization, t.contact_info, t.profile_picture_url, t.phone_number
      ORDER BY t.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// Get therapist details
app.get('/api/therapist-details', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Therapist name is required' });
    }

    // Get unique clients for this therapist
    const clientsResult = await pool.query(`
      SELECT DISTINCT 
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_start_at
      FROM bookings
      WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
      ORDER BY booking_start_at DESC
    `, [name]);

    // Group by email (primary) or phone (fallback)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    clientsResult.rows.forEach(row => {
      const email = row.invitee_email ? row.invitee_email.toLowerCase().trim() : null;
      const phone = row.invitee_phone ? row.invitee_phone.replace(/[\s\-\(\)\+]/g, '') : null;
      
      let key = null;
      
      if (email && emailToKey.has(email)) {
        key = emailToKey.get(email);
      } else if (phone && phoneToKey.has(phone)) {
        key = phoneToKey.get(phone);
        if (email) {
          const oldData = clientMap.get(key);
          clientMap.delete(key);
          key = email;
          clientMap.set(key, oldData);
          emailToKey.set(email, key);
        }
      } else {
        key = email || phone;
      }
      
      if (!key) return;
      
      if (email) emailToKey.set(email, key);
      if (phone) phoneToKey.set(phone, key);
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          invitee_name: row.invitee_name,
          invitee_email: row.invitee_email,
          invitee_phone: row.invitee_phone,
          latest_booking_date: row.booking_start_at
        });
      } else {
        const client = clientMap.get(key);
        // Update to most recent phone number
        if (new Date(row.booking_start_at) > new Date(client.latest_booking_date)) {
          client.latest_booking_date = row.booking_start_at;
          client.invitee_phone = row.invitee_phone;
        }
        // Fill in missing email
        if (row.invitee_email && !client.invitee_email) {
          client.invitee_email = row.invitee_email;
        }
      }
    });

    const clients = Array.from(clientMap.values()).map(({ latest_booking_date, ...client }) => client);

    // Get recent appointments for this therapist
    const appointmentsResult = await pool.query(`
      SELECT 
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_resource_name,
        booking_start_at,
        booking_start_at as booking_start_at_raw,
        booking_invitee_time,
        booking_status
      FROM bookings
      WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
      ORDER BY booking_start_at DESC
    `, [name]);

    const appointments = appointmentsResult.rows.map(apt => ({
      ...apt,
      booking_invitee_time: convertToIST(apt.booking_invitee_time)
    }));

    res.json({
      clients,
      appointments
    });
  } catch (error) {
    console.error('Error fetching therapist details:', error);
    res.status(500).json({ error: 'Failed to fetch therapist details' });
  }
});

// Get client details
app.get('/api/client-details', async (req, res) => {
  try {
    const phones = req.query.phone;
    const email = req.query.email;

    if (!email && !phones) {
      return res.status(400).json({ error: 'Client email or phone is required' });
    }

    // Get all emails and phones for this client
    let allEmails: string[] = [];
    let allPhones: string[] = [];

    if (email) {
      allEmails.push(email as string);
      // Get all phones for this email
      const phonesResult = await pool.query(
        'SELECT DISTINCT invitee_phone FROM bookings WHERE invitee_email = $1 AND invitee_phone IS NOT NULL',
        [email]
      );
      allPhones = phonesResult.rows.map(r => r.invitee_phone);
    }

    if (phones) {
      const phoneArray = Array.isArray(phones) ? phones : [phones];
      allPhones.push(...phoneArray.filter(p => !allPhones.includes(p as string)));
      
      // Get email for these phones if not already provided
      if (!email) {
        for (const phone of phoneArray) {
          const emailResult = await pool.query(
            'SELECT DISTINCT invitee_email FROM bookings WHERE invitee_phone = $1 AND invitee_email IS NOT NULL LIMIT 1',
            [phone]
          );
          if (emailResult.rows.length > 0 && !allEmails.includes(emailResult.rows[0].invitee_email)) {
            allEmails.push(emailResult.rows[0].invitee_email);
          }
        }
        
        // Get all phones for found emails
        for (const foundEmail of allEmails) {
          const phonesResult = await pool.query(
            'SELECT DISTINCT invitee_phone FROM bookings WHERE invitee_email = $1 AND invitee_phone IS NOT NULL',
            [foundEmail]
          );
          phonesResult.rows.forEach(r => {
            if (!allPhones.includes(r.invitee_phone)) {
              allPhones.push(r.invitee_phone);
            }
          });
        }
      }
    }

    // Build query to get all appointments for all emails and phones
    let query = `
      SELECT 
        b.invitee_name,
        b.invitee_email,
        b.invitee_phone,
        b.booking_resource_name,
        b.booking_start_at,
        b.booking_end_at,
        b.booking_invitee_time,
        b.booking_host_name,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes,
        (b.booking_end_at < NOW()) as is_past
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (allEmails.length > 0) {
      const emailPlaceholders = allEmails.map((_, i) => `$${params.length + i + 1}`).join(', ');
      query += ` AND (b.invitee_email IN (${emailPlaceholders})`;
      params.push(...allEmails);
      
      if (allPhones.length > 0) {
        const phonePlaceholders = allPhones.map((_, i) => `$${params.length + i + 1}`).join(', ');
        query += ` OR b.invitee_phone IN (${phonePlaceholders}))`;
        params.push(...allPhones);
      } else {
        query += ')';
      }
    } else if (allPhones.length > 0) {
      const phonePlaceholders = allPhones.map((_, i) => `$${params.length + i + 1}`).join(', ');
      query += ` AND b.invitee_phone IN (${phonePlaceholders})`;
      params.push(...allPhones);
    }
    
    query += ' ORDER BY b.booking_start_at DESC';

    const appointmentsResult = await pool.query(query, params);

    const appointments = appointmentsResult.rows.map(apt => {
      return {
        ...apt,
        booking_invitee_time: convertToIST(apt.booking_invitee_time),
        booking_start_at_raw: apt.booking_start_at,
        booking_end_at_raw: apt.booking_end_at,
        is_past: apt.is_past
      };
    });

    res.json({
      appointments
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});

// Get therapist stats
app.get('/api/therapist-stats', async (req, res) => {
  try {
    // Prevent caching of stats data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const { therapist_id, start, end } = req.query;

    if (!therapist_id) {
      return res.status(400).json({ error: 'Therapist ID is required' });
    }

    // Get user info to find therapist_id
    const userResult = await pool.query(
      'SELECT therapist_id, username FROM users WHERE id = $1 AND role = $2',
      [therapist_id, 'therapist']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist user not found' });
    }

    const therapistUserId = userResult.rows[0].therapist_id;
    const therapistUsername = userResult.rows[0].username;

    // Get therapist info
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [therapistUserId]
    );

    const therapist = therapistResult.rows[0] || { name: 'Ishika Mahajan', specialization: 'Individual Therapy' };
    const therapistFirstName = therapist.name.split(' ')[0];

    const hasDateFilter = start && end;

    // Calculate last month date range
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get stats from bookings table with date filter using therapist name
    // Bookings - count everything for this therapist
    const bookings = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_start_at BETWEEN $2 AND $3',
          [`%${therapistFirstName}%`, start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1',
          [`%${therapistFirstName}%`]
        );

    // Sessions Completed - count ALL completed sessions where session date has passed
    const sessionsCompleted = hasDateFilter
      ? await pool.query(
          `SELECT COUNT(*) as total FROM bookings 
           WHERE booking_host_name ILIKE $1
           AND booking_start_at < NOW()
           AND booking_status NOT IN ($2, $3, $4, $5)
           AND booking_start_at BETWEEN $6 AND $7`,
          [`%${therapistFirstName}%`, 'cancelled', 'canceled', 'no_show', 'no show', start, `${end} 23:59:59`]
        )
      : await pool.query(
          `SELECT COUNT(*) as total FROM bookings 
           WHERE booking_host_name ILIKE $1
           AND booking_start_at < NOW()
           AND booking_status NOT IN ($2, $3, $4, $5)`,
          [`%${therapistFirstName}%`, 'cancelled', 'canceled', 'no_show', 'no show']
        );

    const noShows = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
          [`%${therapistFirstName}%`, 'no_show', 'no show', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3)',
          [`%${therapistFirstName}%`, 'no_show', 'no show']
        );

    const cancelled = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
          [`%${therapistFirstName}%`, 'cancelled', 'canceled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3)',
          [`%${therapistFirstName}%`, 'cancelled', 'canceled']
        );

    const lastMonthSessions = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
      [`%${therapistFirstName}%`, 'confirmed', 'rescheduled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthNoShows = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
      [`%${therapistFirstName}%`, 'no_show', 'no show', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthCancelled = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
      [`%${therapistFirstName}%`, 'cancelled', 'canceled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    // Get upcoming bookings directly from bookings table
    const upcomingResult = await pool.query(`
      SELECT 
        booking_id,
        invitee_name as client_name,
        booking_resource_name as session_name,
        booking_mode as mode,
        booking_invitee_time as session_timings,
        booking_start_at as booking_date
      FROM bookings
      WHERE booking_host_name ILIKE $1
        AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
      ORDER BY booking_start_at ASC
    `, [`%${therapistFirstName}%`]);

    // Filter upcoming sessions based on booking_invitee_time
    const nowUTC = new Date();
    const upcomingBookings = upcomingResult.rows.filter(row => {
      const timeMatch = row.session_timings.match(/at\s+(\d+):(\d+)\s+([AP]M)\s+-\s+(\d+):(\d+)\s+([AP]M)/);
      
      if (timeMatch) {
        const dateStr = row.session_timings.match(/(\w+),\s+(\w+)\s+(\d+),\s+(\d+)/);
        
        if (dateStr) {
          const month = dateStr[2];
          const day = parseInt(dateStr[3]);
          const year = parseInt(dateStr[4]);
          
          // Parse end time
          let endHour = parseInt(timeMatch[4]);
          const endMinute = parseInt(timeMatch[5]);
          const endPeriod = timeMatch[6];
          
          // Convert to 24-hour format
          if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
          if (endPeriod === 'AM' && endHour === 12) endHour = 0;
          
          // Parse timezone offset
          const timezoneMatch = row.session_timings.match(/GMT([+-])(\d+):(\d+)/);
          let timezoneOffset = 330; // Default to IST (+5:30)
          
          if (timezoneMatch) {
            const sign = timezoneMatch[1] === '+' ? 1 : -1;
            const hours = parseInt(timezoneMatch[2]);
            const minutes = parseInt(timezoneMatch[3]);
            timezoneOffset = sign * (hours * 60 + minutes);
          }
          
          // Create date in UTC
          const monthMap: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };
          
          const endDate = new Date(Date.UTC(year, monthMap[month], day, endHour, endMinute));
          // Adjust for timezone offset (subtract because we want UTC)
          endDate.setMinutes(endDate.getMinutes() - timezoneOffset);
          
          // Session is upcoming if end time hasn't passed
          return endDate > nowUTC;
        }
      }
      return false;
    }).slice(0, 10);

    res.json({
      therapist: {
        name: therapist.name,
        specialization: therapist.specialization
      },
      stats: {
        bookings: parseInt(bookings.rows[0].total) || 0,
        sessionsCompleted: parseInt(sessionsCompleted.rows[0].total) || 0,
        noShows: parseInt(noShows.rows[0].total) || 0,
        cancelled: parseInt(cancelled.rows[0].total) || 0,
        lastMonthSessions: parseInt(lastMonthSessions.rows[0].total) || 0,
        lastMonthNoShows: parseInt(lastMonthNoShows.rows[0].total) || 0,
        lastMonthCancelled: parseInt(lastMonthCancelled.rows[0].total) || 0
      },
      upcomingBookings: upcomingBookings.map(booking => ({
        booking_id: booking.booking_id,
        client_name: booking.client_name,
        therapy_type: booking.session_name,
        mode: booking.mode?.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Google Meet',
        session_timings: convertToIST(booking.session_timings)
      }))
    });

  } catch (error) {
    console.error('Therapist stats error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist stats' });
  }
});

// Get therapist appointments
app.get('/api/therapist-appointments', async (req, res) => {
  try {
    const { therapist_id } = req.query;

    if (!therapist_id) {
      return res.status(400).json({ error: 'Therapist ID is required' });
    }

    const userResult = await pool.query(
      'SELECT therapist_id FROM users WHERE id = $1 AND role = $2',
      [therapist_id, 'therapist']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist user not found' });
    }

    const therapistUserId = userResult.rows[0].therapist_id;
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [therapistUserId]
    );

    const therapist = therapistResult.rows[0];
    const therapistFirstName = therapist ? therapist.name.split(' ')[0] : '';

    const appointmentsResult = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name as client_name,
        b.invitee_phone as contact_info,
        b.invitee_email,
        b.booking_resource_name as session_name,
        b.booking_invitee_time as session_timings,
        b.booking_mode as mode,
        b.booking_start_at as booking_date,
        b.booking_start_at,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      WHERE b.booking_host_name ILIKE $1
      ORDER BY b.booking_start_at DESC
    `, [`%${therapistFirstName}%`]);

    const appointments = appointmentsResult.rows.map(apt => ({
      ...apt,
      invitee_phone: apt.contact_info, // Add this for compatibility with getClientStatus
      session_timings: convertToIST(apt.session_timings),
      mode: apt.mode?.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Google Meet'
    }));

    res.json({ appointments });
  } catch (error) {
    console.error('Therapist appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist appointments' });
  }
});

// Get therapist clients
app.get('/api/therapist-clients', async (req, res) => {
  try {
    const { therapist_id } = req.query;

    if (!therapist_id) {
      return res.status(400).json({ error: 'Therapist ID is required' });
    }

    // Get user info to find therapist_id
    const userResult = await pool.query(
      'SELECT therapist_id FROM users WHERE id = $1 AND role = $2',
      [therapist_id, 'therapist']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist user not found' });
    }

    const therapistUserId = userResult.rows[0].therapist_id;

    // Get therapist info to get the name
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [therapistUserId]
    );

    const therapist = therapistResult.rows[0];
    const therapistFirstName = therapist ? therapist.name.split(' ')[0] : '';

    // Get clients for this therapist directly from bookings table
    const clientsResult = await pool.query(`
      SELECT 
        invitee_name as client_name,
        invitee_email as client_email,
        invitee_phone as client_phone,
        booking_start_at,
        COUNT(*) as total_sessions
      FROM bookings
      WHERE booking_host_name ILIKE $1
      GROUP BY invitee_name, invitee_email, invitee_phone, booking_start_at
      ORDER BY booking_start_at DESC
    `, [`%${therapistFirstName}%`]);

    // Group by email (primary) or phone (fallback)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    clientsResult.rows.forEach(row => {
      const email = row.client_email ? row.client_email.toLowerCase().trim() : null;
      const phone = row.client_phone ? row.client_phone.replace(/[\s\-\(\)\+]/g, '') : null;
      
      let key = null;
      
      // Check if email already exists
      if (email && emailToKey.has(email)) {
        key = emailToKey.get(email);
      }
      // Check if phone already exists
      else if (phone && phoneToKey.has(phone)) {
        key = phoneToKey.get(phone);
      }
      // New client
      else {
        key = email || phone;
      }
      
      if (!key) return; // Skip if both are missing
      
      // Map both email and phone to this key
      if (email) emailToKey.set(email, key);
      if (phone) phoneToKey.set(phone, key);
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          client_name: row.client_name,
          client_phone: row.client_phone,
          client_email: row.client_email,
          total_sessions: 0,
          latest_booking_date: row.booking_start_at
        });
      }
      
      const client = clientMap.get(key);
      client.total_sessions += parseInt(row.total_sessions) || 0;
      
      // Update to most recent phone number
      if (new Date(row.booking_start_at) > new Date(client.latest_booking_date)) {
        client.latest_booking_date = row.booking_start_at;
        client.client_phone = row.client_phone;
      }
      
      // Fill in missing email if found
      if (row.client_email && !client.client_email) {
        client.client_email = row.client_email;
        // Update emailToKey mapping
        emailToKey.set(email!, key);
      }
    });

    const clients = Array.from(clientMap.values()).map(({ latest_booking_date, ...client }) => client);

    res.json({ clients });

  } catch (error) {
    console.error('Therapist clients error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist clients' });
  }
});

// Get client appointments
app.get('/api/client-appointments', async (req, res) => {
  try {
    const { client_phone, therapist_id } = req.query;

    if (!client_phone) {
      return res.status(400).json({ error: 'Client phone is required' });
    }

    // Get therapist info
    let therapistFirstName = '';
    if (therapist_id) {
      const userResult = await pool.query(
        'SELECT therapist_id FROM users WHERE id = $1 AND role = $2',
        [therapist_id, 'therapist']
      );

      if (userResult.rows.length > 0) {
        const therapistUserId = userResult.rows[0].therapist_id;
        const therapistResult = await pool.query(
          'SELECT * FROM therapists WHERE therapist_id = $1',
          [therapistUserId]
        );

        const therapist = therapistResult.rows[0];
        therapistFirstName = therapist ? therapist.name.split(' ')[0] : '';
      }
    }

    // First, find all emails and phones for this client
    const clientEmailResult = await pool.query(
      'SELECT DISTINCT invitee_email FROM bookings WHERE invitee_phone = $1 AND invitee_email IS NOT NULL LIMIT 1',
      [client_phone]
    );

    const clientEmail = clientEmailResult.rows.length > 0 ? clientEmailResult.rows[0].invitee_email : null;

    // Get all phone numbers associated with this email
    let allPhones = [client_phone];
    if (clientEmail) {
      const phonesResult = await pool.query(
        'SELECT DISTINCT invitee_phone FROM bookings WHERE invitee_email = $1 AND invitee_phone IS NOT NULL',
        [clientEmail]
      );
      allPhones = phonesResult.rows.map(r => r.invitee_phone);
    }

    // Query with or without therapist filter, matching by email (primary) or any phone
    const phoneConditions = allPhones.map((_, i) => `b.invitee_phone = $${clientEmail ? i + 2 : i + 1}`).join(' OR ');
    
    const query = therapistFirstName
      ? `SELECT 
          b.booking_id,
          b.booking_invitee_time as session_timings,
          b.booking_mode as mode,
          b.booking_start_at as booking_date,
          b.booking_status,
          b.invitee_payment_amount,
          b.emergency_contact_name,
          b.emergency_contact_relation,
          b.emergency_contact_number,
          b.invitee_age,
          b.invitee_gender,
          b.invitee_occupation,
          b.invitee_marital_status,
          b.clinical_profile,
          CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
        FROM bookings b
        LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
        WHERE (${clientEmail ? 'b.invitee_email = $1 OR' : ''} ${phoneConditions})
          AND b.booking_host_name ILIKE $${clientEmail ? allPhones.length + 2 : allPhones.length + 1}
        ORDER BY b.booking_start_at DESC`
      : `SELECT 
          b.booking_id,
          b.booking_invitee_time as session_timings,
          b.booking_mode as mode,
          b.booking_start_at as booking_date,
          b.booking_status,
          b.invitee_payment_amount,
          b.emergency_contact_name,
          b.emergency_contact_relation,
          b.emergency_contact_number,
          b.invitee_age,
          b.invitee_gender,
          b.invitee_occupation,
          b.invitee_marital_status,
          b.clinical_profile,
          CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
        FROM bookings b
        LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
        WHERE ${clientEmail ? 'b.invitee_email = $1 OR' : ''} ${phoneConditions}
        ORDER BY b.booking_start_at DESC`;

    const params = clientEmail
      ? (therapistFirstName ? [clientEmail, ...allPhones, `%${therapistFirstName}%`] : [clientEmail, ...allPhones])
      : (therapistFirstName ? [...allPhones, `%${therapistFirstName}%`] : allPhones);
    
    const appointmentsResult = await pool.query(query, params);

    const appointments = appointmentsResult.rows.map(row => ({
      booking_id: row.booking_id,
      session_timings: row.session_timings || 'N/A',
      mode: row.mode ? row.mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet',
      has_session_notes: row.has_session_notes,
      booking_status: row.booking_status,
      booking_date: row.booking_date,
      invitee_payment_amount: row.invitee_payment_amount,
      emergency_contact_name: row.emergency_contact_name,
      emergency_contact_relation: row.emergency_contact_relation,
      emergency_contact_number: row.emergency_contact_number,
      invitee_age: row.invitee_age,
      invitee_gender: row.invitee_gender,
      invitee_occupation: row.invitee_occupation,
      invitee_marital_status: row.invitee_marital_status,
      clinical_profile: row.clinical_profile
    }));

    res.json({ appointments });
  } catch (error) {
    console.error('Client appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch client appointments' });
  }
});

// Transfer client endpoint
app.post('/api/transfer-client', async (req, res) => {
  
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      fromTherapistName,
      toTherapistId,
      transferredByAdminId,
      transferredByAdminName,
      reason
    } = req.body;

    // Get new therapist details
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [toTherapistId]
    );

    if (therapistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }

    const newTherapist = therapistResult.rows[0];

    // Get old therapist ID
    const oldTherapistResult = await pool.query(
      'SELECT therapist_id FROM therapists WHERE name = $1',
      [fromTherapistName]
    );

    const fromTherapistId = oldTherapistResult.rows[0]?.therapist_id || null;

    // Update all bookings to new therapist
    const updateResult = await pool.query(
      `UPDATE bookings 
       SET booking_host_name = $1, therapist_id = $2
       WHERE ((invitee_email IS NOT NULL AND invitee_email = $3) 
              OR (invitee_phone IS NOT NULL AND invitee_phone = $4))
       AND booking_host_name = $5`,
      [newTherapist.name, toTherapistId, clientEmail || '', clientPhone || '', fromTherapistName]
    );
    
    // Insert transfer record
    await pool.query(
      `INSERT INTO client_transfer_history 
       (client_name, client_email, client_phone, from_therapist_id, from_therapist_name, 
        to_therapist_id, to_therapist_name, transferred_by_admin_id, transferred_by_admin_name, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        clientName,
        clientEmail,
        clientPhone,
        fromTherapistId,
        fromTherapistName,
        toTherapistId,
        newTherapist.name,
        transferredByAdminId,
        transferredByAdminName,
        reason
      ]
    );

    // Log client transfer
    await pool.query(
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [transferredByAdminId, transferredByAdminName, 'client_transfer', 
       `Transferred ${clientName} from ${fromTherapistName} to ${newTherapist.name}`, clientName, getCurrentISTTimestamp()]
    );

    // Trigger n8n webhook
    const webhookData = {
      clientName,
      clientEmail,
      clientPhone,
      fromTherapist: fromTherapistName,
      fromTherapistId: fromTherapistId || 'N/A',
      toTherapist: newTherapist.name,
      toTherapistId: toTherapistId,
      transferredBy: transferredByAdminName,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    };
    const webhookUrl = `https://n8n.srv1169280.hstgr.cloud/webhook/efc4396f-401b-4d46-bfdb-e990a3ac3846?${new URLSearchParams(webhookData as any).toString()}`;
    
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'GET'
      });
      const webhookResponseData = await webhookResponse.text();
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
    }

    // Notify new therapist
    const newTherapistUser = await pool.query(
      "SELECT id FROM users WHERE therapist_id = $1 AND role = 'therapist'",
      [toTherapistId]
    );
    if (newTherapistUser.rows.length > 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [newTherapistUser.rows[0].id, 'therapist', 'client_transfer', 'New Client Assigned',
         `Client ${clientName} has been transferred to you from ${fromTherapistName}`]
      );
    }

    // Notify old therapist
    if (fromTherapistId) {
      const oldTherapistUser = await pool.query(
        "SELECT id FROM users WHERE therapist_id = $1 AND role = 'therapist'",
        [fromTherapistId]
      );
      if (oldTherapistUser.rows.length > 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, user_role, notification_type, title, message)
           VALUES ($1, $2, $3, $4, $5)`,
          [oldTherapistUser.rows[0].id, 'therapist', 'client_transfer', 'Client Transferred',
           `Client ${clientName} has been transferred to ${newTherapist.name}`]
        );
      }
    }



    res.json({ success: true, message: 'Client transferred successfully' });
  } catch (error) {
    console.error('Error transferring client:', error);
    res.status(500).json({ success: false, error: 'Failed to transfer client' });
  }
});

// Get audit logs (last 30 days only for frontend)
app.get('/api/audit-logs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE is_visible = true 
       ORDER BY log_id DESC 
       LIMIT 500`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Clear audit logs (soft delete)
app.post('/api/audit-logs/clear', async (req, res) => {
  try {
    await pool.query('UPDATE audit_logs SET is_visible = false WHERE is_visible = true');
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing audit logs:', error);
    res.status(500).json({ error: 'Failed to clear audit logs' });
  }
});

// Create audit log
app.post('/api/audit-logs', async (req, res) => {
  try {
    const { therapist_id, therapist_name, action_type, action_description, client_name, ip_address } = req.body;
    await pool.query(
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, ip_address, timestamp, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [therapist_id, therapist_name, action_type, action_description, client_name, ip_address, getCurrentISTTimestamp()]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// Logout endpoint
app.post('/api/logout', async (req, res) => {
  try {
    const { user } = req.body;
    
    if (user?.role === 'therapist') {
      try {
        await pool.query(
          `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, timestamp, is_visible)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [user.therapist_id, user.username, 'logout', `${user.username} logged out`, getCurrentISTTimestamp()]
        );
      } catch (auditError) {
        console.error('❌ Failed to create audit log for logout:', auditError);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// Get additional notes for a booking
app.get('/api/additional-notes', async (req, res) => {
  try {
    const { booking_id } = req.query;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const result = await pool.query(
      'SELECT * FROM client_additional_notes WHERE booking_id = $1 ORDER BY created_at DESC',
      [booking_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching additional notes:', error);
    res.status(500).json({ error: 'Failed to fetch additional notes' });
  }
});

// Save/Update additional note
app.post('/api/additional-notes', async (req, res) => {
  try {
    const { note_id, booking_id, therapist_id, therapist_name, note_text } = req.body;
    
    if (!booking_id || !therapist_id || !note_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (note_id) {
      // Update existing note
      await pool.query(
        'UPDATE client_additional_notes SET note_text = $1, updated_at = CURRENT_TIMESTAMP WHERE note_id = $2',
        [note_text, note_id]
      );
    } else {
      // Insert new note
      await pool.query(
        'INSERT INTO client_additional_notes (booking_id, therapist_id, therapist_name, note_text) VALUES ($1, $2, $3, $4)',
        [booking_id, therapist_id, therapist_name, note_text]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving additional note:', error);
    res.status(500).json({ error: 'Failed to save additional note' });
  }
});

// Get session notes
app.get('/api/session-notes', async (req, res) => {
  try {
    const { booking_id } = req.query;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const result = await pool.query(
      `SELECT csn.*, b.booking_invitee_time as session_timing
       FROM client_session_notes csn
       LEFT JOIN bookings b ON csn.booking_id = b.booking_id
       WHERE csn.booking_id = $1`,
      [booking_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session notes not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching session notes:', error);
    res.status(500).json({ error: 'Failed to fetch session notes' });
  }
});

// Get paperform link
app.get('/api/paperform-link', async (req, res) => {
  try {
    const { booking_id } = req.query;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const result = await pool.query(
      'SELECT paperform_link FROM client_doc_form WHERE booking_id = $1',
      [booking_id]
    );

    if (result.rows.length > 0) {
      res.json({ paperform_link: result.rows[0].paperform_link });
    } else {
      res.json({ paperform_link: null });
    }
  } catch (error) {
    console.error('Error fetching paperform link:', error);
    res.status(500).json({ error: 'Failed to fetch paperform link' });
  }
});

// Save/Update session notes
app.post('/api/session-notes', async (req, res) => {
  try {
    const { booking_id, therapist_id, therapist_name, client_name, notes } = req.body;
    
    if (!booking_id || !therapist_id || !notes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if notes exist
    const existing = await pool.query(
      'SELECT note_id FROM client_session_notes WHERE booking_id = $1',
      [booking_id]
    );

    if (existing.rows.length > 0) {
      // Update existing notes
      await pool.query(
        'UPDATE client_session_notes SET notes = $1, updated_at = CURRENT_TIMESTAMP WHERE booking_id = $2',
        [notes, booking_id]
      );
    } else {
      // Insert new notes
      await pool.query(
        'INSERT INTO client_session_notes (booking_id, therapist_id, notes) VALUES ($1, $2, $3)',
        [booking_id, therapist_id, notes]
      );
    }

    // Log session note update
    await pool.query(
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [therapist_id, therapist_name, 'session_notes', 
       `${existing.rows.length > 0 ? 'Updated' : 'Added'} session notes for ${client_name}`, client_name, getCurrentISTTimestamp()]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving session notes:', error);
    res.status(500).json({ error: 'Failed to save session notes' });
  }
});

// Cancel booking
app.post('/api/bookings/cancel', async (req, res) => {
  try {
    const { booking_id, therapist_id, therapist_name, client_name, reason } = req.body;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Update booking status
    await pool.query(
      'UPDATE bookings SET booking_status = $1 WHERE booking_id = $2',
      ['cancelled', booking_id]
    );

    // Log cancellation
    await pool.query(
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [therapist_id, therapist_name, 'booking_cancel', 
       `Cancelled booking for ${client_name}${reason ? ': ' + reason : ''}`, client_name, getCurrentISTTimestamp()]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get refunds and cancellations
app.get('/api/refunds', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        r.client_name,
        r.session_name,
        r.session_timings,
        b.refund_status,
        COALESCE(b.invitee_phone, '') as invitee_phone,
        COALESCE(b.invitee_email, '') as invitee_email,
        COALESCE(b.refund_amount, 0) as refund_amount,
        COALESCE(b.invitee_payment_gateway, '') as payment_gateway
      FROM refund_cancellation_table r
      LEFT JOIN bookings b ON r.session_id = b.booking_id
      WHERE b.booking_status IN ('cancelled', 'canceled')
        AND b.refund_status IS NOT NULL
        AND LOWER(b.refund_status) IN ('initiated', 'failed')
    `;
    
    const params: any[] = [];
    
    if (status && status !== 'all') {
      if (status.toLowerCase() === 'pending') {
        query += " AND LOWER(b.refund_status) = 'initiated'";
      } else {
        query += ' AND LOWER(b.refund_status) = LOWER($1)';
        params.push(status);
      }
    }
    
    query += ' ORDER BY r.session_timings DESC';
    
    const result = await pool.query(query, params);
    
    const refunds = result.rows.map(row => {
      let formattedTimings = 'N/A';
      if (row.session_timings) {
        const date = new Date(row.session_timings);
        const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
        const endDate = new Date(istDate.getTime() + (50 * 60 * 1000));
        
        const formatTime = (d: Date) => {
          const hours = d.getHours();
          const minutes = d.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const hour12 = hours % 12 || 12;
          return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        };
        
        const weekday = istDate.toLocaleDateString('en-US', { weekday: 'long' });
        const month = istDate.toLocaleDateString('en-US', { month: 'short' });
        const day = istDate.getDate();
        const year = istDate.getFullYear();
        
        formattedTimings = `${weekday}, ${month} ${day}, ${year} at ${formatTime(istDate)} - ${formatTime(endDate)} IST`;
      }
      
      return {
        ...row,
        session_timings: formattedTimings,
        refund_status: row.refund_status
      };
    });
    
    res.json(refunds);
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

// Get payments
app.get('/api/payments', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM dashboard_api_booking WHERE payment_amount IS NOT NULL AND payment_amount > 0';
    
    if (status && status !== 'all_payments') {
      if (status === 'completed') {
        query += " AND payment_status = 'Completed'";
      } else if (status === 'pending') {
        query += " AND payment_status = 'Pending'";
      } else if (status === 'expired') {
        query += " AND payment_status = 'Failed'";
      }
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query);
    
    const payments = result.rows.map(row => {
      let formattedTimings = 'N/A';
      if (row.start_at) {
        const date = new Date(row.start_at);
        const endDate = new Date(row.end_at || date.getTime() + (50 * 60 * 1000));
        
        const formatTime = (d: Date) => {
          const hours = d.getHours();
          const minutes = d.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const hour12 = hours % 12 || 12;
          return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        };
        
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        const year = date.getFullYear();
        
        formattedTimings = `${weekday}, ${month} ${day}, ${year} at ${formatTime(date)} - ${formatTime(endDate)} IST`;
      }
      
      return {
        client_name: row.invitee_name,
        session_name: row.booking_resource_name,
        session_timings: formattedTimings,
        payment_status: row.payment_status,
        invitee_phone: row.invitee_phone || '',
        invitee_email: row.invitee_email || '',
        payment_amount: row.payment_amount || 0
      };
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const { user_id, user_role } = req.query;
    
    if (!user_id || !user_role) {
      return res.status(400).json({ error: 'User ID and role required' });
    }

    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 AND user_role = $2 ORDER BY created_at DESC LIMIT 50',
      [user_id, user_role]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get client profile
app.get('/api/client-profile', async (req, res) => {
  try {
    const { userId } = req.query;

    const userResult = await pool.query(
      'SELECT id, username, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const bookingResult = await pool.query(
      `SELECT invitee_phone, invitee_email, emergency_contact_name, emergency_contact_number 
       FROM bookings 
       WHERE invitee_name ILIKE $1 
       ORDER BY invitee_created_at DESC 
       LIMIT 1`,
      [`%${user.full_name}%`]
    );

    const booking = bookingResult.rows[0] || {};

    res.json({
      full_name: user.full_name,
      whatsapp_no: booking.invitee_phone?.replace('+91 ', '') || '',
      email: booking.invitee_email || '',
      emergency_contact_name: booking.emergency_contact_name || '',
      emergency_contact_number: booking.emergency_contact_number || ''
    });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update client profile
app.post('/api/client-profile', async (req, res) => {
  try {
    const { userId, fullName } = req.body;

    await pool.query(
      'UPDATE users SET full_name = $1 WHERE id = $2',
      [fullName, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating client profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = true WHERE notification_id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { user_id, user_role } = req.body;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND user_role = $2',
      [user_id, user_role]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM notifications WHERE notification_id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create notification for all admins
app.post('/api/notifications/create-admin', async (req, res) => {
  try {
    const { notification_type, title, message, related_id } = req.body;
    const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    
    for (const admin of admins.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [admin.id, 'admin', notification_type, title, message, related_id]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating admin notifications:', error);
    res.status(500).json({ error: 'Failed to create notifications' });
  }
});

// Webhook to notify new bookings
app.post('/api/webhooks/new-booking', async (req, res) => {
  try {
    const { booking_id } = req.body;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    const bookingResult = await pool.query(
      `SELECT b.booking_id, b.invitee_name, b.booking_resource_name, 
              b.booking_host_name, t.therapist_id, u.id as user_id
       FROM bookings b
       LEFT JOIN therapists t ON b.booking_host_name ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
       LEFT JOIN users u ON u.therapist_id = t.therapist_id AND u.role = 'therapist'
       WHERE b.booking_id = $1`,
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Notify therapist
    if (booking.user_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [booking.user_id, 'therapist', 'new_booking', 'New Booking Assigned',
         `New session "${booking.booking_resource_name}" booked with ${booking.invitee_name}`, booking.booking_id]
      );
    }

    // Notify all admins
    const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [admin.id, 'admin', 'new_booking', 'New Booking Created',
         `${booking.invitee_name} booked "${booking.booking_resource_name}" with ${booking.booking_host_name}`, booking.booking_id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error notifying new booking:', error);
    res.status(500).json({ error: 'Failed to notify new booking' });
  }
});

// Send booking link webhook
app.post('/api/send-booking-link', async (req, res) => {
  try {
    const { clientName, email, phone, therapistName, therapy } = req.body;

    // Validate required fields
    if (!clientName || !therapistName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const webhookData = {
      clientName,
      email,
      phone,
      therapistName,
      therapy
    };

    try {
      // Send to n8n webhook
      const webhookUrl = 'https://n8n.srv1169280.hstgr.cloud/webhook/f1ee71f4-65e3-4246-baea-372e822faed7';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'SafeStories-Backend/1.0'
        },
        body: JSON.stringify(webhookData)
      });

      const responseText = await response.text();

      if (response.ok) {
        res.status(200).json({ success: true, message: 'Booking link sent successfully' });
      } else {
        console.error('❌ Webhook failed:', response.status, response.statusText);
        console.error('❌ Error response:', responseText);
        
        // Return success to frontend but log the webhook issue
        res.status(200).json({ 
          success: true, 
          message: 'Request processed (webhook service unavailable)',
          warning: 'n8n webhook returned error - check n8n dashboard'
        });
      }
    } catch (fetchError) {
      console.error('❌ Network error calling webhook:', fetchError);
      
      // Return success to frontend but log the network issue
      res.status(200).json({ 
        success: true, 
        message: 'Request processed (webhook service unavailable)',
        warning: 'Could not reach n8n webhook service'
      });
    }
  } catch (error) {
    console.error('❌ Error in booking link endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SOS Risk Assessments endpoints
app.post('/api/sos-assessments', async (req, res) => {
  try {
    const {
      booking_id,
      therapist_id,
      therapist_name,
      client_name,
      session_name,
      session_timings,
      contact_info,
      mode,
      risk_assessment
    } = req.body;

    // Validate required fields
    if (!risk_assessment || !risk_assessment.severity_level || !risk_assessment.risk_summary) {
      return res.status(400).json({ error: 'Missing required risk assessment data' });
    }

    const insertQuery = `
      INSERT INTO sos_risk_assessments (
        booking_id, therapist_id, therapist_name, client_name, session_name,
        session_timings, contact_info, mode,
        risk_severity_level, risk_severity_description,
        emotional_dysregulation, physical_harm_ideas, drug_alcohol_abuse,
        suicidal_attempt, self_harm, delusions_hallucinations, impulsiveness,
        severe_stress, social_isolation, concern_by_others, other_risk,
        other_details, risk_summary
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING id, created_at
    `;

    const values = [
      booking_id,
      therapist_id,
      therapist_name,
      client_name,
      session_name,
      session_timings,
      contact_info,
      mode,
      risk_assessment.severity_level,
      risk_assessment.severity_description,
      risk_assessment.risk_indicators?.emotionalDysregulation || null,
      risk_assessment.risk_indicators?.physicalHarmIdeas || null,
      risk_assessment.risk_indicators?.drugAlcoholAbuse || null,
      risk_assessment.risk_indicators?.suicidalAttempt || null,
      risk_assessment.risk_indicators?.selfHarm || null,
      risk_assessment.risk_indicators?.delusionsHallucinations || null,
      risk_assessment.risk_indicators?.impulsiveness || null,
      risk_assessment.risk_indicators?.severeStress || null,
      risk_assessment.risk_indicators?.socialIsolation || null,
      risk_assessment.risk_indicators?.concernByOthers || null,
      risk_assessment.risk_indicators?.other || null,
      risk_assessment.other_details || null,
      risk_assessment.risk_summary
    ];

    const result = await pool.query(insertQuery, values);
    const assessmentId = result.rows[0].id;
    const createdAt = result.rows[0].created_at;

    res.status(201).json({
      success: true,
      assessment_id: assessmentId,
      created_at: createdAt,
      message: 'SOS Risk Assessment saved successfully'
    });

  } catch (error) {
    console.error('Error saving SOS Risk Assessment:', error);
    res.status(500).json({ 
      error: 'Failed to save SOS Risk Assessment',
      details: error.message 
    });
  }
});

// Update SOS Risk Assessment
app.put('/api/sos-assessments', async (req, res) => {
  try {
    const { id } = req.query;
    const { webhook_sent, webhook_response, status, reviewed_by, resolution_notes } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Assessment ID is required' });
    }

    const updateQuery = `
      UPDATE sos_risk_assessments 
      SET 
        webhook_sent = COALESCE($2, webhook_sent),
        webhook_response = COALESCE($3, webhook_response),
        status = COALESCE($4, status),
        reviewed_by = COALESCE($5, reviewed_by),
        resolution_notes = COALESCE($6, resolution_notes),
        updated_at = CURRENT_TIMESTAMP,
        reviewed_at = CASE WHEN $5 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE reviewed_at END
      WHERE id = $1
      RETURNING *
    `;

    const values = [id, webhook_sent, webhook_response, status, reviewed_by, resolution_notes];
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'SOS Risk Assessment not found' });
    }

    res.status(200).json({
      success: true,
      assessment: result.rows[0],
      message: 'SOS Risk Assessment updated successfully'
    });

  } catch (error) {
    console.error('Error updating SOS Risk Assessment:', error);
    res.status(500).json({ 
      error: 'Failed to update SOS Risk Assessment',
      details: error.message 
    });
  }
});

// Generate SOS Access Token
app.post('/api/generate-sos-token', async (req, res) => {
  try {
    const { sos_assessment_id, client_email, client_phone, client_name, expires_in_days = 7 } = req.body;

    if (!sos_assessment_id) {
      return res.status(400).json({ error: 'Missing sos_assessment_id', received: req.body });
    }
    
    if (!client_email) {
      return res.status(400).json({ error: 'Missing client_email', received: req.body });
    }
    
    if (!client_phone) {
      return res.status(400).json({ error: 'Missing client_phone', received: req.body });
    }

    // Generate unique token (UUID)
    const token = randomUUID();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Insert token into database
    const insertQuery = `
      INSERT INTO sos_access_tokens (
        token, sos_assessment_id, client_email, client_phone, client_name, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      token,
      sos_assessment_id,
      client_email,
      client_phone,
      client_name,
      expiresAt
    ]);

    res.status(201).json({
      success: true,
      token: token,
      expires_at: expiresAt,
      message: 'SOS access token generated successfully'
    });

  } catch (error) {
    console.error('Error generating SOS token:', error);
    res.status(500).json({ 
      error: 'Failed to generate SOS token',
      details: error.message 
    });
  }
});

// Get SOS Documentation by Token (Public endpoint - no auth required)
app.get('/api/sos-documentation', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // 1. Validate token
    const tokenQuery = `
      SELECT 
        sat.*,
        sra.risk_severity_level,
        sra.risk_severity_description,
        sra.risk_summary,
        sra.created_at as sos_created_at
      FROM sos_access_tokens sat
      LEFT JOIN sos_risk_assessments sra ON sat.sos_assessment_id = sra.id
      WHERE sat.token = $1
    `;
    
    const tokenResult = await pool.query(tokenQuery, [token]);

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    const tokenData = tokenResult.rows[0];

    // Check if token is active
    if (!tokenData.is_active) {
      return res.status(403).json({ error: 'This link has been revoked' });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(403).json({ error: 'This link has expired' });
    }

    // 2. Fetch client documentation
    const clientEmail = tokenData.client_email;
    const clientPhone = tokenData.client_phone;
    const clientName = tokenData.client_name;

    // Get client_id from bookings table
    const clientIdQuery = `
      SELECT DISTINCT invitee_email || '_' || invitee_phone as client_id
      FROM bookings
      WHERE invitee_email = $1 AND invitee_phone = $2
      LIMIT 1
    `;
    const clientIdResult = await pool.query(clientIdQuery, [clientEmail, clientPhone]);
    const clientId = clientIdResult.rows[0]?.client_id || `${clientEmail}_${clientPhone}`;

    // Get case history
    const caseHistoryQuery = `
      SELECT * FROM client_case_history
      WHERE client_name = $1 OR client_id = $2
      ORDER BY created_at DESC
    `;
    const caseHistory = await pool.query(caseHistoryQuery, [clientName, clientId]);

    // Get all progress notes
    const progressNotesQuery = `
      SELECT * FROM client_progress_notes
      WHERE client_name = $1 OR client_id = $2
      ORDER BY session_date DESC
    `;
    const progressNotes = await pool.query(progressNotesQuery, [clientName, clientId]);

    // Get therapy goals
    const goalsQuery = `
      SELECT * FROM client_therapy_goals
      WHERE client_name = $1 OR client_id = $2
      ORDER BY created_at DESC
    `;
    const goals = await pool.query(goalsQuery, [clientName, clientId]);

    // Get session count
    const sessionCountQuery = `
      SELECT COUNT(*) as session_count
      FROM bookings
      WHERE invitee_email = $1 AND invitee_phone = $2
      AND booking_status != 'cancelled'
    `;
    const sessionCount = await pool.query(sessionCountQuery, [clientEmail, clientPhone]);

    // Get emergency contact from bookings
    const emergencyContactQuery = `
      SELECT invitee_question
      FROM bookings
      WHERE invitee_email = $1 AND invitee_phone = $2
      AND invitee_question IS NOT NULL
      ORDER BY booking_start_at DESC
      LIMIT 1
    `;
    const emergencyContact = await pool.query(emergencyContactQuery, [clientEmail, clientPhone]);

    // 3. Update access tracking
    const updateAccessQuery = `
      UPDATE sos_access_tokens
      SET 
        accessed_at = CASE WHEN accessed_at IS NULL THEN CURRENT_TIMESTAMP ELSE accessed_at END,
        access_count = access_count + 1
      WHERE token = $1
    `;
    await pool.query(updateAccessQuery, [token]);

    // 4. Return all documentation
    res.status(200).json({
      success: true,
      client: {
        name: tokenData.client_name,
        email: clientEmail,
        phone: clientPhone,
        session_count: sessionCount.rows[0]?.session_count || 0,
        emergency_contact: emergencyContact.rows[0]?.invitee_question || null
      },
      sos_assessment: {
        severity_level: tokenData.risk_severity_level,
        severity_description: tokenData.risk_severity_description,
        risk_summary: tokenData.risk_summary,
        created_at: tokenData.sos_created_at
      },
      documentation: {
        case_history: caseHistory.rows,
        progress_notes: progressNotes.rows,
        therapy_goals: goals.rows
      },
      token_info: {
        created_at: tokenData.created_at,
        expires_at: tokenData.expires_at,
        access_count: tokenData.access_count + 1
      }
    });

  } catch (error) {
    console.error('Error fetching SOS documentation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch documentation',
      details: error.message 
    });
  }
});

// ==================== THERAPY DOCUMENTATION ENDPOINTS ====================

// 1. Receive session documentation from N8N
app.post('/api/session-documentation', async (req, res) => {
  try {
    const { session_type, client_id, client_name, booking_id, case_history, progress_notes, therapy_goals } = req.body;

    // If First Session - store case history
    if (session_type === 'First Session' && case_history) {
      await pool.query(`
        INSERT INTO client_case_history (
          client_id, client_name, booking_id,
          age, gender_identity, education, occupation, primary_income,
          marital_status, children, religion, socio_economic_status, city_state,
          presenting_concerns, duration_onset, triggers_factors,
          sleep, appetite, energy_levels, weight_changes, libido, menstrual_history,
          family_history, genogram_url, developmental_history,
          medical_history, medications, previous_mental_health, insight_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        ON CONFLICT (client_id) DO UPDATE SET
          age = EXCLUDED.age,
          gender_identity = EXCLUDED.gender_identity,
          education = EXCLUDED.education,
          occupation = EXCLUDED.occupation,
          updated_at = NOW()
      `, [
        client_id, client_name, booking_id,
        case_history.age, case_history.gender_identity, case_history.education,
        case_history.occupation, case_history.primary_income,
        case_history.marital_status, case_history.children, case_history.religion,
        case_history.socio_economic_status, case_history.city_state,
        case_history.presenting_concerns, case_history.duration_onset, case_history.triggers_factors,
        case_history.sleep, case_history.appetite, case_history.energy_levels,
        case_history.weight_changes, case_history.libido, case_history.menstrual_history,
        case_history.family_history, case_history.genogram_url, case_history.developmental_history,
        case_history.medical_history, case_history.medications,
        case_history.previous_mental_health, case_history.insight_level
      ]);
    }

    // If Follow-up Session - store progress notes
    if (session_type === 'Follow-up Session' && progress_notes) {
      await pool.query(`
        INSERT INTO client_progress_notes (
          client_id, client_name, booking_id, session_number, session_date,
          session_duration, session_mode,
          client_report, direct_quotes,
          client_presentation, presentation_tags,
          techniques_used, homework_assigned,
          client_reaction, reaction_tags, engagement_notes,
          themes_patterns, progress_regression, clinical_concerns,
          self_harm_mention, self_harm_details, risk_level,
          risk_factors, protective_factors, safety_plan,
          future_interventions, session_frequency,
          therapist_name, therapist_signature, signature_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
      `, [
        client_id, client_name, booking_id,
        progress_notes.session_number, progress_notes.session_date,
        progress_notes.session_duration, progress_notes.session_mode,
        progress_notes.client_report, progress_notes.direct_quotes,
        progress_notes.client_presentation, progress_notes.presentation_tags,
        progress_notes.techniques_used, progress_notes.homework_assigned,
        progress_notes.client_reaction, progress_notes.reaction_tags, progress_notes.engagement_notes,
        progress_notes.themes_patterns, progress_notes.progress_regression, progress_notes.clinical_concerns,
        progress_notes.self_harm_mention, progress_notes.self_harm_details, progress_notes.risk_level,
        progress_notes.risk_factors, progress_notes.protective_factors, progress_notes.safety_plan,
        progress_notes.future_interventions, progress_notes.session_frequency,
        progress_notes.therapist_name, progress_notes.therapist_signature, progress_notes.signature_date
      ]);
    }

    // Always store/update therapy goals
    if (therapy_goals) {
      await pool.query(`
        INSERT INTO client_therapy_goals (
          client_id, client_name, goal_description, current_stage, initiation_date
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        client_id, client_name,
        therapy_goals.goal_description,
        therapy_goals.current_stage || 'Initiation',
        new Date()
      ]);
      console.log('✅ Therapy goals stored');
    }

    res.json({ success: true, message: 'Session documentation stored successfully' });
  } catch (error) {
    console.error('❌ Error storing session documentation:', error);
    res.status(500).json({ success: false, error: 'Failed to store session documentation' });
  }
});

// 2. Get case history
app.get('/api/case-history', async (req, res) => {
  try {
    const { client_id } = req.query;
    
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const result = await pool.query(
      'SELECT * FROM client_case_history WHERE client_id = $1',
      [client_id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching case history:', error);
    res.status(500).json({ error: 'Failed to fetch case history' });
  }
});

// 3. Update case history
app.put('/api/case-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await pool.query(`
      UPDATE client_case_history 
      SET ${Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ')},
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, ...Object.values(updates)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case history not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating case history:', error);
    res.status(500).json({ error: 'Failed to update case history' });
  }
});

// 4. Get progress notes list
app.get('/api/progress-notes', async (req, res) => {
  try {
    const { client_id } = req.query;
    
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    // Fetch from client_progress_notes (new system)
    const progressNotesResult = await pool.query(
      `SELECT id, session_number, session_date, session_mode, risk_level,
              client_report, techniques_used, created_at, 'progress_note' as note_type
       FROM client_progress_notes 
       WHERE client_id = $1 
       ORDER BY session_date DESC`,
      [client_id]
    );

    // Fetch from client_session_notes (old system)
    // client_id is actually the phone number, so use it directly to match bookings
    const sessionNotesResult = await pool.query(
      `SELECT DISTINCT csn.note_id as id, csn.session_timing, csn.created_at, 
              csn.client_name, csn.concerns_discussed, csn.somatic_cues, csn.interventions_used,
              'session_note' as note_type, csn.booking_id
       FROM client_session_notes csn
       INNER JOIN bookings b ON csn.booking_id::text = b.booking_id::text
       WHERE b.invitee_phone = $1 OR b.invitee_email = $1
       ORDER BY csn.created_at DESC`,
      [client_id]
    );

    // Merge both results
    const allNotes = [
      ...progressNotesResult.rows.map(note => ({
        ...note,
        session_date: note.session_date || note.created_at,
        note_type: 'progress_note'
      })),
      ...sessionNotesResult.rows.map(note => ({
        ...note,
        session_date: note.created_at, // Use created_at as session_date for old notes
        note_type: 'session_note'
      }))
    ];

    // Sort by date descending
    allNotes.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

    res.json({ success: true, data: allNotes });
  } catch (error) {
    console.error('Error fetching progress notes:', error);
    res.status(500).json({ error: 'Failed to fetch progress notes' });
  }
});

// 5. Get single progress note
app.get('/api/progress-notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM client_progress_notes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Progress note not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching progress note:', error);
    res.status(500).json({ error: 'Failed to fetch progress note' });
  }
});

// 6. Get therapy goals
app.get('/api/therapy-goals', async (req, res) => {
  try {
    const { client_id } = req.query;
    
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const result = await pool.query(
      `SELECT * FROM client_therapy_goals 
       WHERE client_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [client_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching therapy goals:', error);
    res.status(500).json({ error: 'Failed to fetch therapy goals' });
  }
});

// 6a. Get free consultation notes list
app.get('/api/free-consultation-notes', async (req, res) => {
  try {
    const { client_id } = req.query;
    
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const result = await pool.query(
      `SELECT id, session_date, session_mode, presenting_concerns,
              assigned_therapist_name, created_at
       FROM free_consultation_pretherapy_notes 
       WHERE client_id = $1 
       ORDER BY session_date DESC`,
      [client_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching free consultation notes:', error);
    res.status(500).json({ error: 'Failed to fetch free consultation notes' });
  }
});

// 6b. Get single free consultation note
app.get('/api/free-consultation-notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM free_consultation_pretherapy_notes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Free consultation note not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching free consultation note:', error);
    res.status(500).json({ error: 'Failed to fetch free consultation note' });
  }
});

// 7. Create therapy goal
app.post('/api/therapy-goals', async (req, res) => {
  try {
    const { client_id, client_name, goal_description, current_stage } = req.body;

    const result = await pool.query(`
      INSERT INTO client_therapy_goals (
        client_id, client_name, goal_description, current_stage, initiation_date
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [client_id, client_name, goal_description, current_stage || 'Initiation', new Date()]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating therapy goal:', error);
    res.status(500).json({ error: 'Failed to create therapy goal' });
  }
});

// 8. Update therapy goal
app.put('/api/therapy-goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { current_stage } = req.body;

    const stageField = `${current_stage.toLowerCase().replace('-', '_')}_date`;
    
    const result = await pool.query(`
      UPDATE client_therapy_goals 
      SET current_stage = $1,
          ${stageField} = COALESCE(${stageField}, NOW()),
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [current_stage, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Therapy goal not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating therapy goal:', error);
    res.status(500).json({ error: 'Failed to update therapy goal' });
  }
});

// 9. Paperform Webhook - Free Consultation
app.post('/api/paperform-webhook/free-consultation', async (req, res) => {
  try {
    const { submission_id, booking_id, data } = req.body;

    // Verify booking_id exists and get session_type
    const docForm = await pool.query(
      'SELECT session_type FROM client_doc_form WHERE booking_id = $1',
      [booking_id]
    );

    if (docForm.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found in client_doc_form' });
    }

    const sessionType = docForm.rows[0].session_type;

    // Verify it's a free consultation
    if (sessionType !== 'Free Consultation - SafeStories') {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid session type: ${sessionType}. Expected: Free Consultation - SafeStories` 
      });
    }

    // Insert into free_consultation_pretherapy_notes
    await pool.query(`
      INSERT INTO free_consultation_pretherapy_notes (
        client_name, client_id, booking_id,
        session_date, session_timing, session_duration,
        therapist_name, session_mode,
        presenting_concerns, duration_onset, triggers_factors,
        therapy_overview_given, client_questions, answers_given,
        preferred_languages, preferred_modes, preferred_price_range,
        preferred_time_slots, assigned_therapist_name,
        chatbot_booking_explained,
        clinical_concerns_mentioned, clinical_concerns_details,
        suicidal_thoughts_mentioned, suicidal_thoughts_details,
        other_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
    `, [
      data.client_name,
      data.client_id,
      booking_id,
      data.session_date,
      data.session_timing,
      data.session_duration,
      data.therapist_name,
      data.session_mode,
      data.presenting_concerns,
      data.duration_onset,
      data.triggers_factors,
      data.therapy_overview_given || false,
      data.client_questions,
      data.answers_given,
      data.preferred_languages,
      data.preferred_modes,
      data.preferred_price_range,
      data.preferred_time_slots,
      data.assigned_therapist_name,
      data.chatbot_booking_explained || false,
      data.clinical_concerns_mentioned || false,
      data.clinical_concerns_details,
      data.suicidal_thoughts_mentioned || false,
      data.suicidal_thoughts_details,
      data.other_notes
    ]);

    // Update client_doc_form status
    await pool.query(`
      UPDATE client_doc_form 
      SET status = 'completed',
          paperform_submission_id = $1
      WHERE booking_id = $2
    `, [submission_id, booking_id]);

    console.log('✅ client_doc_form updated to completed');

    res.json({ success: true, message: 'Free consultation notes stored successfully' });
  } catch (error) {
    console.error('❌ Error storing free consultation notes:', error);
    res.status(500).json({ success: false, error: 'Failed to store free consultation notes' });
  }
});

// 10. Paperform Webhook - Therapy Documentation
app.post('/api/paperform-webhook/therapy-documentation', async (req, res) => {
  try {
    const { submission_id, booking_id, data } = req.body;

    console.log('📝 Received therapy documentation form submission:', { submission_id, booking_id });

    // Verify booking_id exists and get session_type
    const docForm = await pool.query(
      'SELECT session_type FROM client_doc_form WHERE booking_id = $1',
      [booking_id]
    );

    if (docForm.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found in client_doc_form' });
    }

    const sessionType = docForm.rows[0].session_type;

    // Verify it's NOT a free consultation
    if (sessionType === 'Free Consultation - SafeStories') {
      return res.status(400).json({ 
        success: false, 
        error: 'This is a free consultation. Use /api/paperform-webhook/free-consultation endpoint' 
      });
    }

    const sessionNumber = data.session_number || 1;
    const isFirstSession = sessionNumber === 1;

    console.log(`📊 Session type: ${sessionType}, Session number: ${sessionNumber}, First session: ${isFirstSession}`);

    // If First Session - store case history
    if (isFirstSession && data.case_history) {
      await pool.query(`
        INSERT INTO client_case_history (
          client_id, client_name, booking_id,
          age, gender_identity, education, occupation, primary_income,
          marital_status, children, religion, socio_economic_status, city_state,
          presenting_concerns, duration_onset, triggers_factors,
          sleep, appetite, energy_levels, weight_changes, libido, menstrual_history,
          family_history, genogram_url, developmental_history,
          medical_history, medications, previous_mental_health, insight_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        ON CONFLICT (client_id) DO UPDATE SET
          age = EXCLUDED.age,
          gender_identity = EXCLUDED.gender_identity,
          education = EXCLUDED.education,
          occupation = EXCLUDED.occupation,
          primary_income = EXCLUDED.primary_income,
          marital_status = EXCLUDED.marital_status,
          children = EXCLUDED.children,
          religion = EXCLUDED.religion,
          socio_economic_status = EXCLUDED.socio_economic_status,
          city_state = EXCLUDED.city_state,
          presenting_concerns = EXCLUDED.presenting_concerns,
          duration_onset = EXCLUDED.duration_onset,
          triggers_factors = EXCLUDED.triggers_factors,
          sleep = EXCLUDED.sleep,
          appetite = EXCLUDED.appetite,
          energy_levels = EXCLUDED.energy_levels,
          weight_changes = EXCLUDED.weight_changes,
          libido = EXCLUDED.libido,
          menstrual_history = EXCLUDED.menstrual_history,
          family_history = EXCLUDED.family_history,
          genogram_url = EXCLUDED.genogram_url,
          developmental_history = EXCLUDED.developmental_history,
          medical_history = EXCLUDED.medical_history,
          medications = EXCLUDED.medications,
          previous_mental_health = EXCLUDED.previous_mental_health,
          insight_level = EXCLUDED.insight_level,
          updated_at = NOW()
      `, [
        data.client_id,
        data.client_name,
        booking_id,
        data.case_history.age,
        data.case_history.gender_identity,
        data.case_history.education,
        data.case_history.occupation,
        data.case_history.primary_income,
        data.case_history.marital_status,
        data.case_history.children,
        data.case_history.religion,
        data.case_history.socio_economic_status,
        data.case_history.city_state,
        data.case_history.presenting_concerns,
        data.case_history.duration_onset,
        data.case_history.triggers_factors,
        data.case_history.sleep,
        data.case_history.appetite,
        data.case_history.energy_levels,
        data.case_history.weight_changes,
        data.case_history.libido,
        data.case_history.menstrual_history,
        data.case_history.family_history,
        data.case_history.genogram_url,
        data.case_history.developmental_history,
        data.case_history.medical_history,
        data.case_history.medications,
        data.case_history.previous_mental_health,
        data.case_history.insight_level
      ]);
      console.log('✅ Case history stored');
    }

    // Always store progress notes
    if (data.progress_notes) {
      await pool.query(`
        INSERT INTO client_progress_notes (
          client_id, client_name, booking_id, session_number, session_date,
          session_duration, session_mode,
          client_report, direct_quotes,
          client_presentation, presentation_tags,
          techniques_used, homework_assigned,
          client_reaction, reaction_tags, engagement_notes,
          themes_patterns, progress_regression, clinical_concerns,
          self_harm_mention, self_harm_details, risk_level,
          risk_factors, protective_factors, safety_plan,
          future_interventions, session_frequency,
          therapist_name, therapist_signature, signature_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
      `, [
        data.client_id,
        data.client_name,
        booking_id,
        sessionNumber,
        data.session_date,
        data.session_duration,
        data.session_mode,
        data.progress_notes.client_report,
        data.progress_notes.direct_quotes,
        data.progress_notes.client_presentation,
        data.progress_notes.presentation_tags,
        data.progress_notes.techniques_used,
        data.progress_notes.homework_assigned,
        data.progress_notes.client_reaction,
        data.progress_notes.reaction_tags,
        data.progress_notes.engagement_notes,
        data.progress_notes.themes_patterns,
        data.progress_notes.progress_regression,
        data.progress_notes.clinical_concerns,
        data.progress_notes.self_harm_mention || false,
        data.progress_notes.self_harm_details,
        data.progress_notes.risk_level || 'None',
        data.progress_notes.risk_factors,
        data.progress_notes.protective_factors,
        data.progress_notes.safety_plan,
        data.progress_notes.future_interventions,
        data.progress_notes.session_frequency,
        data.therapist_name,
        data.therapist_signature,
        data.signature_date
      ]);
      console.log('✅ Progress notes stored');
    }

    // Store/update therapy goals
    if (data.therapy_goals) {
      await pool.query(`
        INSERT INTO client_therapy_goals (
          client_id, client_name, goal_description, current_stage, initiation_date
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (client_id) DO UPDATE SET
          goal_description = EXCLUDED.goal_description,
          current_stage = EXCLUDED.current_stage,
          updated_at = NOW()
      `, [
        data.client_id,
        data.client_name,
        data.therapy_goals.goal_description,
        data.therapy_goals.current_stage || 'Initiation',
        new Date()
      ]);
      console.log('✅ Therapy goals stored');
    }

    // Update client_doc_form status
    await pool.query(`
      UPDATE client_doc_form 
      SET status = 'completed',
          paperform_submission_id = $1
      WHERE booking_id = $2
    `, [submission_id, booking_id]);

    console.log('✅ client_doc_form updated to completed');

    res.json({ success: true, message: 'Therapy documentation stored successfully' });
  } catch (error) {
    console.error('❌ Error storing therapy documentation:', error);
    res.status(500).json({ success: false, error: 'Failed to store therapy documentation' });
  }
});

// ==================== END THERAPY DOCUMENTATION ENDPOINTS ====================

// ==================== FREE CONSULTATION ENDPOINTS ====================

// 9. Check client session type (free consultation vs paid sessions)
app.get('/api/client-session-type', async (req, res) => {
  try {
    const { client_id } = req.query;
    
    console.log('🔍 [API] client-session-type called with client_id:', client_id);
    
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    // Check if client has any PAID session bookings (non-free-consultation)
    const paidBookingsResult = await pool.query(
      `SELECT booking_id FROM bookings 
       WHERE invitee_phone = $1 
       AND booking_resource_name NOT ILIKE '%free consultation%'
       LIMIT 1`,
      [client_id]
    );
    const hasPaidSessions = paidBookingsResult.rows.length > 0;
    console.log('💰 [API] Paid sessions found:', hasPaidSessions, '(', paidBookingsResult.rows.length, 'rows)');

    // Check if client has free consultation bookings
    const freeConsultBookingResult = await pool.query(
      `SELECT booking_id FROM bookings 
       WHERE invitee_phone = $1 
       AND booking_resource_name ILIKE '%free consultation%'
       LIMIT 1`,
      [client_id]
    );
    const hasFreeConsultation = freeConsultBookingResult.rows.length > 0;
    console.log('🆓 [API] Free consultations found:', hasFreeConsultation, '(', freeConsultBookingResult.rows.length, 'rows)');

    const response = { 
      success: true, 
      data: { 
        hasPaidSessions, 
        hasFreeConsultation 
      } 
    };
    console.log('📤 [API] Returning:', response);
    res.json(response);
  } catch (error) {
    console.error('Error checking client session type:', error);
    res.status(500).json({ error: 'Failed to check client session type' });
  }
});

// 10. Get free consultation notes
app.get('/api/free-consultation-notes', async (req, res) => {
  try {
    const { client_id } = req.query;
    
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const result = await pool.query(
      'SELECT * FROM free_consultation_pretherapy_notes WHERE client_name = $1 ORDER BY session_date DESC',
      [client_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching free consultation notes:', error);
    res.status(500).json({ error: 'Failed to fetch free consultation notes' });
  }
});

// 11. Get single free consultation note
app.get('/api/free-consultation-notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM free_consultation_pretherapy_notes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Free consultation note not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching free consultation note:', error);
    res.status(500).json({ error: 'Failed to fetch free consultation note' });
  }
});

// ==================== END FREE CONSULTATION ENDPOINTS ====================

// Global error handler - must be after all routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  
  // Always return JSON
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`\n✓ API server running on http://localhost:${PORT}`);
  startDashboardApiBookingSync();
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n✗ Port ${PORT} is already in use. Please stop other processes or change the port.`);
  } else {
    console.error('\n✗ Server error:', err);
  }
  process.exit(1);
});
