import fs from 'fs';
import path from 'path';

(async () => {
  console.log('Starting lead generator test...');
  try {
    // Login
    console.log('Attempting login...');
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@presttech.local', password: 'presttech123' })
    });
    console.log('Login status', loginRes.status);
    const setCookie = loginRes.headers.get('set-cookie');
    console.log('set-cookie header:', setCookie);
    const bodyText = await loginRes.text();
    console.log('Login body:', bodyText);

    if (loginRes.status !== 200) {
      console.error('Login failed');
      process.exit(1);
    }

    // Use cookie to call preview
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    console.log('Using cookie:', cookie);

    const params = new URLSearchParams({ cnaes: '6201500', city: 'sao paulo', state: 'SP', daysBack: '30' });
    console.log('Requesting preview...');
    const previewRes = await fetch(`http://localhost:5000/api/lead-generator/preview?${params.toString()}`, {
      headers: { 'Cookie': cookie }
    });
    console.log('Preview status', previewRes.status);
    const previewJson = await previewRes.json();
    console.log('Preview body:', JSON.stringify(previewJson, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
})();
