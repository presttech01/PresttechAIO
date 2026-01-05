(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@presttech.local', password: 'presttech123' }),
      redirect: 'manual'
    });
    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
    console.log('Set-Cookie:', res.headers.get('set-cookie'));
  } catch (err) {
    console.error('Error:', err);
  }
})();
