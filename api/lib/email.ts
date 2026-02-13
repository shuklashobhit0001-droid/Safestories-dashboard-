import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send OTP email to therapist
 * @param email - Therapist email address
 * @param therapistName - Therapist name
 * @param otp - 6-digit OTP code
 * @param expiresAt - OTP expiry date
 */
export async function sendOTPEmail(
  email: string,
  therapistName: string,
  otp: string,
  expiresAt: Date
): Promise<void> {
  try {
    const expiryTime = expiresAt.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      timeZoneName: 'short'
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your SafeStories Profile</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #21615D 0%, #2d7a75 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to SafeStories</h1>
              <p style="margin: 10px 0 0 0; color: #e0f2f1; font-size: 16px;">Complete Your Therapist Profile</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${therapistName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                Welcome to the SafeStories team! We're excited to have you join our community of mental health professionals.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                To complete your profile setup and gain access to your therapist dashboard, please use the One-Time Password (OTP) below:
              </p>
              
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="background-color: #f0f9f8; border: 2px dashed #21615D; border-radius: 8px; padding: 30px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                    <p style="margin: 0; color: #21615D; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Instructions -->
              <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px; font-weight: 600;">
                  📋 Next Steps:
                </p>
                <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.8;">
                  <li>Go to the SafeStories login page</li>
                  <li>Click on "First Time Login?"</li>
                  <li>Enter your email and the OTP code above</li>
                  <li>Complete your profile with your details</li>
                  <li>Set up your password for future logins</li>
                </ol>
              </div>
              
              <!-- Expiry Warning -->
              <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 0 0 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #c62828; font-size: 14px;">
                  ⏰ <strong>Important:</strong> This OTP will expire on <strong>${expiryTime}</strong>
                </p>
              </div>
              
              <p style="margin: 0 0 20px 0; color: #555555; font-size: 14px; line-height: 1.6;">
                If you didn't request this email or have any questions, please contact our support team immediately.
              </p>
              
              <p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6;">
                Best regards,<br>
                <strong>The SafeStories Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="margin: 0; color: #999999; font-size: 13px;">
                © ${new Date().getFullYear()} SafeStories. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: `"SafeStories" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 Your SafeStories Profile Setup OTP',
      html: htmlContent,
      text: `Hello ${therapistName},

Welcome to SafeStories! Your One-Time Password (OTP) for profile setup is: ${otp}

This OTP will expire on ${expiryTime}.

Next Steps:
1. Go to the SafeStories login page
2. Click on "First Time Login?"
3. Enter your email and the OTP code
4. Complete your profile with your details
5. Set up your password for future logins

If you didn't request this email, please contact our support team.

Best regards,
The SafeStories Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send OTP email');
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}
