export const convertToIST = (timeStr: string): string => {
  if (!timeStr) return timeStr;
  
  const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
  if (!match) {
    console.log('No match for timeStr:', timeStr);
    return timeStr;
  }
  
  try {
    const [, dateStr, startTime, endTime, offset] = match;
    
    // Parse the date
    const dateParts = dateStr.match(/(\w+), (\w+) (\d+), (\d+)/);
    if (!dateParts) return timeStr;
    
    const [, , month, day, year] = dateParts;
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    // Parse start time
    const [h, rest] = startTime.split(':');
    const [m, period] = rest.split(' ');
    let hour = parseInt(h);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    // Create date object in the original timezone
    const originalDate = new Date(Date.UTC(parseInt(year), monthMap[month], parseInt(day), hour, parseInt(m)));
    
    // Calculate offset difference
    const [offsetHours, offsetMins] = offset.split(':').map(n => parseInt(n));
    const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
    const istOffset = 330; // IST is GMT+5:30
    const diffMinutes = istOffset - offsetTotal;
    
    // Apply offset to get IST time
    const istDate = new Date(originalDate.getTime() + diffMinutes * 60 * 1000);
    const istEndDate = new Date(istDate.getTime() + 50 * 60 * 1000);
    
    // Format IST date and time
    const formatDate = (d: Date) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    };
    
    const formatTime = (d: Date) => {
      const hours = d.getUTCHours();
      const minutes = d.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };
    
    return `${formatDate(istDate)} at ${formatTime(istDate)} - ${formatTime(istEndDate)} IST`;
  } catch (error) {
    console.error('Error converting time:', error, 'for string:', timeStr);
    return timeStr;
  }
};
