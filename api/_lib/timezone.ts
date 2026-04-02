export const convertToIST = (timeStr: string): string => {
  if (!timeStr) return timeStr;
  
  const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
  if (!match) return timeStr;
  
  try {
    const [, dateStr, startTime, endTime, offset] = match;
    
    // Parse date
    const dateParts = dateStr.match(/\w+, (\w+) (\d+), (\d+)/);
    if (!dateParts) return timeStr;
    
    const [, month, day, year] = dateParts;
    const monthMap: {[key: string]: number} = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    
    // Parse start time to 24-hour format
    const parseTime = (time: string) => {
      const [h, rest] = time.split(':');
      const [m, period] = rest.split(' ');
      let hour = parseInt(h);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return { hour, minute: parseInt(m) };
    };
    
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    // Parse timezone offset (e.g., "-06:00" or "+05:30")
    const [offsetH, offsetM] = offset.split(':').map(n => parseInt(n));
    const offsetMinutes = offsetH * 60 + (offsetH < 0 ? -offsetM : offsetM);
    
    // Create a date in the source timezone by treating it as UTC, then adjusting
    // The time given is in the source timezone, so we create it as if it's UTC
    const sourceDate = Date.UTC(parseInt(year), monthMap[month], parseInt(day), start.hour, start.minute);
    const sourceEndDate = Date.UTC(parseInt(year), monthMap[month], parseInt(day), end.hour, end.minute);
    
    // Convert from source timezone to UTC (subtract the source offset)
    const utcDate = sourceDate - (offsetMinutes * 60000);
    const utcEndDate = sourceEndDate - (offsetMinutes * 60000);
    
    // Convert from UTC to IST (add IST offset: +5:30 = 330 minutes)
    const istDate = new Date(utcDate + (330 * 60000));
    const istEndDate = new Date(utcEndDate + (330 * 60000));
    
    // Format output
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formatTime = (date: Date) => {
      const h = date.getUTCHours();
      const m = date.getUTCMinutes();
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    };
    
    const istDateStr = `${weekdays[istDate.getUTCDay()]}, ${months[istDate.getUTCMonth()]} ${istDate.getUTCDate()}, ${istDate.getUTCFullYear()}`;
    const istStartTime = formatTime(istDate);
    const istEndTime = formatTime(istEndDate);
    
    return `${istDateStr} at ${istStartTime} - ${istEndTime} IST`;
  } catch (error) {
    console.error('Error converting time:', error);
    return timeStr;
  }
};

export const formatISOToIST = (dateInput: string | Date | null | undefined, endInput?: string | Date | null | undefined): string => {
  if (!dateInput) return 'N/A';
  try {
    const startDate = new Date(dateInput);
    if (isNaN(startDate.getTime())) return 'N/A';

    let endDate: Date;
    if (endInput) {
      endDate = new Date(endInput);
      if (isNaN(endDate.getTime())) {
        endDate = new Date(startDate.getTime() + (50 * 60 * 1000));
      }
    } else {
      endDate = new Date(startDate.getTime() + (50 * 60 * 1000));
    }

    const dateStr = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    
    const timeStr = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

    const endTimeStr = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

    return `${dateStr} at ${timeStr} - ${endTimeStr} IST`;
  } catch (e) {
    console.error('Error formatting ISO to IST:', e);
    return 'N/A';
  }
};
