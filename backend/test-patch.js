const axios = require('axios');

async function testPatch() {
  try {
    const token = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with a valid admin token
    const response = await axios.patch('http://localhost:3001/api/treks/test', 
      { test: true },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testPatch(); 