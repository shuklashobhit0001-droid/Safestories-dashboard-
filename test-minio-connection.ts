import { minioClient, bucketName } from './lib/minio';

async function testMinIOConnection() {
  try {
    console.log('🔍 Testing MinIO connection...');
    console.log('Endpoint:', process.env.MINIO_ENDPOINT);
    console.log('Port:', process.env.MINIO_PORT);
    console.log('Bucket:', bucketName);
    
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    console.log('✅ Bucket exists:', bucketExists);
    
    if (!bucketExists) {
      console.log('❌ Bucket does not exist. Creating...');
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log('✅ Bucket created successfully');
    }
    
    // List objects in bucket
    const stream = minioClient.listObjects(bucketName, '', true);
    console.log('\n📁 Objects in bucket:');
    let count = 0;
    
    for await (const obj of stream) {
      console.log(`  - ${obj.name} (${obj.size} bytes)`);
      count++;
    }
    
    console.log(`\nTotal objects: ${count}`);
    
    // Test upload
    console.log('\n🔄 Testing file upload...');
    const testBuffer = Buffer.from('Test file content');
    const testFileName = `test-${Date.now()}.txt`;
    
    await minioClient.putObject(
      bucketName,
      `test/${testFileName}`,
      testBuffer,
      testBuffer.length,
      { 'Content-Type': 'text/plain' }
    );
    
    console.log('✅ Test file uploaded successfully');
    
    // Clean up test file
    await minioClient.removeObject(bucketName, `test/${testFileName}`);
    console.log('✅ Test file removed');
    
    console.log('\n✅ MinIO connection test passed!');
  } catch (error) {
    console.error('❌ MinIO connection test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testMinIOConnection();
