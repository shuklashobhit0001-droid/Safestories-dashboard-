import { convertToIST } from '../lib/timezone';

// Test the conversion with Anjali's booking
const testCases = [
  {
    name: "Anjali Ramaa's booking (GMT-06:00)",
    input: "Wednesday, Jan 21, 2026 at 9:30 PM - 10:20 PM (GMT-06:00)",
    expected: "Thursday, Jan 22, 2026 at 9:00 AM - 9:50 AM IST"
  },
  {
    name: "Anjali Hood's booking (GMT+01:00)",
    input: "Friday, Jan 16, 2026 at 11:30 AM - 12:20 PM (GMT+01:00)",
    expected: "Friday, Jan 16, 2026 at 4:00 PM - 4:50 PM IST"
  },
  {
    name: "IST booking (GMT+05:30)",
    input: "Monday, Jan 20, 2026 at 10:00 AM - 10:50 AM (GMT+05:30)",
    expected: "Monday, Jan 20, 2026 at 10:00 AM - 10:50 AM IST"
  }
];

console.log('Testing convertToIST function:\n');

testCases.forEach(test => {
  console.log(`Test: ${test.name}`);
  console.log(`Input:    ${test.input}`);
  const result = convertToIST(test.input);
  console.log(`Output:   ${result}`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Status:   ${result === test.expected ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
});
