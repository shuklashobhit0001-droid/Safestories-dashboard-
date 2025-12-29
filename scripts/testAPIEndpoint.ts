// Test the actual API endpoint
fetch('http://localhost:5000/api/therapist-clients?therapist_id=1')
  .then(res => res.json())
  .then(data => {
    console.log('API returned:', data);
    console.log('Number of clients:', data.clients?.length);
    if (data.clients) {
      data.clients.forEach((client: any, i: number) => {
        console.log(`Client ${i + 1}:`, {
          name: client.client_name,
          email: client.client_email,
          phone: client.client_phone,
          sessions: client.total_sessions,
          therapists: client.therapists?.length
        });
      });
    }
  })
  .catch(err => console.error('Error:', err));
