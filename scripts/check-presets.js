(async () => {
  try {
    const base = 'http://localhost:5000';
    const login = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@presttech.local', password: 'presttech123' }),
      redirect: 'manual'
    });
    console.log('Login status', login.status);
    const cookie = login.headers.get('set-cookie');
    console.log('Set-Cookie:', cookie);
    if (login.status !== 200) process.exit(1);

    const cookieOnly = cookie ? cookie.split(';')[0] : '';
    const presetsRes = await fetch(`${base}/api/segment-presets`, {
      headers: { 'Cookie': cookieOnly }
    });
    console.log('Presets status', presetsRes.status);
    const body = await presetsRes.text();
    console.log('Body:', body);
  } catch (e) {
    console.error('Error:', e);
  }
})();
