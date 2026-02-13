import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

async function testUploadEndpoint() {
  try {
    console.log('🧪 Testing upload endpoint...');
    
    // Create a test image buffer
    const testImageBuffer = Buffer.from('fake-image-data');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('folder', 'profile-pictures');
    
    console.log('📤 Sending request to http://localhost:3002/api/upload-file');
    
    const response = await fetch('http://localhost:3002/api/upload-file', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', response.headers.raw());
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      const text = await response.text();
      console.log('Response text (first 500 chars):', text.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUploadEndpoint();
