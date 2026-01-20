// Simulate frontend timestamp processing

const mockNotifications = [
  {
    notification_id: 152,
    created_at: "2026-01-20T05:32:26.596Z",
    title: "New Booking Request"
  },
  {
    notification_id: 150,
    created_at: "2026-01-20T05:26:56.185Z",
    title: "New Booking Request"
  }
];

const formatTime = (timestamp: string) => {
  console.log('\n--- Processing timestamp:', timestamp);
  
  const date = new Date(timestamp);
  console.log('Parsed date:', date);
  console.log('Date valid:', !isNaN(date.getTime()));
  
  const now = new Date();
  console.log('Current time:', now);
  
  const diff = now.getTime() - date.getTime();
  console.log('Difference (ms):', diff);
  
  const minutes = Math.floor(diff / 60000);
  console.log('Minutes:', minutes);
  
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    console.log('Result: Just now');
    return 'Just now';
  }
  if (minutes < 60) {
    console.log(`Result: ${minutes}m ago`);
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    console.log(`Result: ${hours}h ago`);
    return `${hours}h ago`;
  }
  if (days < 7) {
    console.log(`Result: ${days}d ago`);
    return `${days}d ago`;
  }
  const result = date.toLocaleDateString();
  console.log(`Result: ${result}`);
  return result;
};

console.log('=== FRONTEND TIMESTAMP SIMULATION ===\n');
console.log('Current system time:', new Date().toString());
console.log('Current UTC time:', new Date().toISOString());

mockNotifications.forEach(notif => {
  const result = formatTime(notif.created_at);
  console.log(`\n✓ Notification ${notif.notification_id}: "${result}"`);
});
