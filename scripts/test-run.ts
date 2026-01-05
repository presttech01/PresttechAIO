(async () => {
  try {
    const base = 'http://localhost:5000';
    const login = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@presttech.local', password: 'presttech123' })
    });
    if (login.status !== 200) {
      console.error('login failed', await login.text());
      process.exit(1);
    }
    const cookie = login.headers.get('set-cookie');
    const cookieOnly = cookie ? cookie.split(';')[0] : '';

    // Use the seeded presetId if exists
    const body = {
      cnaes: '6201500',
      city: 'sao paulo',
      state: 'SP',
      daysBack: 30,
      presetId: null // set to a preset id like 1 to test preset handling
    };

    console.log('Running import with body', body);

    const runRes = await fetch(`${base}/api/lead-generator/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieOnly },
      body: JSON.stringify(body)
    });

    console.log('run status', runRes.status);
    const txt = await runRes.text();
    console.log('run body', txt);
  } catch (err) {
    console.error('error', err);
  }
})();
