// Verify the UTC timestamp conversion
const utcTimestamp = '2026-01-21T16:00:00.000Z';
const date = new Date(utcTimestamp);

console.log('UTC Timestamp:', utcTimestamp);
console.log('UTC Date:', date.toUTCString());
console.log('IST Date (using toLocaleString):', date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

// Manual IST conversion
const istDate = new Date(date.getTime() + (330 * 60000)); // Add 5:30 hours
console.log('IST Date (manual +5:30):', istDate.toUTCString());
console.log('IST Hours:', istDate.getUTCHours(), 'Minutes:', istDate.getUTCMinutes());

// What the booking_invitee_time says
console.log('\nBooking invitee time says: Wednesday, Jan 21, 2026 at 9:30 PM (GMT-06:00)');
console.log('That means: Jan 21, 2026 21:30 in GMT-06:00 timezone');

// Convert GMT-06:00 to UTC
const localTime = new Date('2026-01-21T21:30:00'); // 9:30 PM
const offsetMinutes = -6 * 60; // GMT-06:00
const utcTime = localTime.getTime() - (offsetMinutes * 60000);
const utcDate = new Date(utcTime);
console.log('Converted to UTC:', utcDate.toISOString());

// Then to IST
const istTime = utcTime + (330 * 60000);
const istDateFinal = new Date(istTime);
console.log('Converted to IST:', istDateFinal.toUTCString());
console.log('IST formatted:', istDateFinal.getUTCDate(), istDateFinal.toLocaleString('en-US', { 
  weekday: 'long', 
  month: 'short', 
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC'
}));
