// Debug script to check email configuration
console.log('🔍 Checking Email Configuration...\n');

console.log('Environment Variables:');
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***configured***' : 'NOT SET');

if (!process.env.GMAIL_USER) {
  console.log('\n❌ ERROR: GMAIL_USER is not set in .env.local');
}

if (!process.env.GMAIL_APP_PASSWORD) {
  console.log('\n❌ ERROR: GMAIL_APP_PASSWORD is not set in .env.local');
}

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  console.log('\n✅ Email configuration looks good!');
  console.log('\nNow testing email sending...\n');
  
  // Import and test email function
  import('./lib/email').then(async (emailModule) => {
    try {
      const testEmail = process.env.GMAIL_USER || 'test@example.com';
      const testOTP = '123456';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      console.log('📧 Sending test email to:', testEmail);
      console.log('🔐 OTP:', testOTP);
      
      await emailModule.sendPasswordResetOTP(testEmail, 'Test User', testOTP, expiresAt);
      
      console.log('\n✅ Email sent successfully!');
      console.log('📬 Check your inbox at:', testEmail);
    } catch (error) {
      console.error('\n❌ Error sending email:', error);
      console.error('\nFull error details:', JSON.stringify(error, null, 2));
    }
  }).catch(error => {
    console.error('\n❌ Error loading email module:', error);
  });
}
