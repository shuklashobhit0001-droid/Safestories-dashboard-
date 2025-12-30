export const convertToIST = (timeStr: string): string => {
  if (!timeStr) return timeStr;
  
  const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
  if (!match) {
    console.log('No match for timeStr:', timeStr);
    return timeStr;
  }
  
  try {
    const [, date, startTime, endTime, offset] = match;
    const parseTime = (time: string, tz: string) => {
      const [h, rest] = time.split(':');
      const [m, period] = rest.split(' ');
      let hour = parseInt(h);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      const [offsetHours, offsetMins] = tz.replace('GMT', '').split(':').map(n => parseInt(n));
      const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
      const istOffset = 330;
      const diff = istOffset - offsetTotal;
      
      let totalMins = hour * 60 + parseInt(m) + diff;
      const newHour = Math.floor(totalMins / 60) % 24;
      const newMin = totalMins % 60;
      
      const period12 = newHour >= 12 ? 'PM' : 'AM';
      const hour12 = newHour % 12 || 12;
      return `${hour12}:${newMin.toString().padStart(2, '0')} ${period12}`;
    };
    
    const istStart = parseTime(startTime, `GMT${offset}`);
    const istEnd = parseTime(endTime, `GMT${offset}`);
    
    return `${date} at ${istStart} - ${istEnd} IST`;
  } catch (error) {
    console.error('Error converting time:', error, 'for string:', timeStr);
    return timeStr;
  }
};
