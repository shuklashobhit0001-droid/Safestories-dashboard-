import fetch from 'node-fetch';

async function testActualAPIEndpoint() {
  try {
    console.log('\n=== TESTING ACTUAL API ENDPOINT ===\n');

    // Test Dec 2025
    console.log('1. Testing Dec 2025 API call:\n');
    const decUrl = 'http://localhost:3002/api/dashboard/stats?start=2025-12-01&end=2025-12-31';
    console.log(`   URL: ${decUrl}`);
    
    const decResponse = await fetch(decUrl);
    const decData = await decResponse.json();
    
    console.log('   Response:');
    console.log(`   - Revenue: ₹${Number(decData.revenue || 0).toLocaleString()}`);
    console.log(`   - Refunded Amount: ₹${Number(decData.refundedAmount || 0).toLocaleString()}`);
    console.log(`   - Sessions: ${decData.sessions || 0}`);
    console.log(`   - Free Consultations: ${decData.freeConsultations || 0}`);
    console.log(`   - Cancelled: ${decData.cancelled || 0}`);
    console.log(`   - Refunds: ${decData.refunds || 0}`);
    console.log(`   - No-shows: ${decData.noShows || 0}`);

    // Test Jan 2026
    console.log('\n2. Testing Jan 2026 API call:\n');
    const janUrl = 'http://localhost:3002/api/dashboard/stats?start=2026-01-01&end=2026-01-31';
    console.log(`   URL: ${janUrl}`);
    
    const janResponse = await fetch(janUrl);
    const janData = await janResponse.json();
    
    console.log('   Response:');
    console.log(`   - Revenue: ₹${Number(janData.revenue || 0).toLocaleString()}`);
    console.log(`   - Refunded Amount: ₹${Number(janData.refundedAmount || 0).toLocaleString()}`);
    console.log(`   - Sessions: ${janData.sessions || 0}`);
    console.log(`   - Free Consultations: ${janData.freeConsultations || 0}`);
    console.log(`   - Cancelled: ${janData.cancelled || 0}`);
    console.log(`   - Refunds: ${janData.refunds || 0}`);
    console.log(`   - No-shows: ${janData.noShows || 0}`);

    // Test without date filter
    console.log('\n3. Testing without date filter (All Time):\n');
    const allTimeUrl = 'http://localhost:3002/api/dashboard/stats';
    console.log(`   URL: ${allTimeUrl}`);
    
    const allTimeResponse = await fetch(allTimeUrl);
    const allTimeData = await allTimeResponse.json();
    
    console.log('   Response:');
    console.log(`   - Revenue: ₹${Number(allTimeData.revenue || 0).toLocaleString()}`);
    console.log(`   - Refunded Amount: ₹${Number(allTimeData.refundedAmount || 0).toLocaleString()}`);

    console.log('\n=== SUMMARY ===\n');
    console.log('If these values match what you see in the UI, the API is working correctly.');
    console.log('If they DON\'T match, there might be a proxy or different port issue.');

  } catch (error) {
    console.error('Error:', error);
    console.log('\nNote: Make sure your server is running on port 3002');
    console.log('Run: npm run dev');
  }
}

testActualAPIEndpoint();
