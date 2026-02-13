// Test the API endpoint directly
async function testAPI() {
  try {
    const clientPhone = '+91 9272109799';
    const url = `http://localhost:3002/api/client-session-type?client_id=${encodeURIComponent(clientPhone)}`;
    
    console.log('Testing API:', url);
    console.log('');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    if (data.success) {
      console.log('hasPaidSessions:', data.data.hasPaidSessions);
      console.log('hasFreeConsultation:', data.data.hasFreeConsultation);
      console.log('');
      
      if (data.data.hasPaidSessions) {
        console.log('✅ Should show: All 4 tabs');
      } else if (!data.data.hasPaidSessions && data.data.hasFreeConsultation) {
        console.log('❌ Should show: Pre-therapy Notes only');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
