(async () => {
  try {
    const base = 'http://localhost:5000';
    const login = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@presttech.local', password: 'presttech123' })
    });
    console.log('login status', login.status);
    const cookie = login.headers.get('set-cookie');
    console.log('set-cookie', cookie);
    if (login.status !== 200) {
      const txt = await login.text();
      console.error('login failed body', txt);
      process.exit(1);
    }

    const cookieOnly = cookie ? cookie.split(';')[0] : '';
    const params = new URLSearchParams({ cnaes: '4721101', city: 'sao paulo', state: 'SP', daysBack: '30' });
    const preview = await fetch(`${base}/api/lead-generator/preview?${params.toString()}`, {
      headers: { 'Cookie': cookieOnly }
    });
    console.log('preview status', preview.status);
    const body = await preview.json().catch(async () => {
      const t = await preview.text();
      return { text: t };
    });
    console.log('preview body', JSON.stringify(body, null, 2).substring(0, 2000));
  } catch (e) {
    console.error('error', e);
  }
})();
