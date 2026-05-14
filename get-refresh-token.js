/**
 * Run once to get a Google OAuth2 refresh token for Drive uploads.
 * Usage:
 *   node get-refresh-token.js <CLIENT_ID> <CLIENT_SECRET>
 */
const https = require('https');
const http = require('http');

const [,, clientId, clientSecret] = process.argv;

if (!clientId || !clientSecret) {
  console.error('Usage: node get-refresh-token.js <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const REDIRECT = 'http://localhost:3333/callback';

const authUrl =
  `https://accounts.google.com/o/oauth2/auth` +
  `?client_id=${encodeURIComponent(clientId)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

// Start a local server to catch the redirect
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:3333');
  const code = url.searchParams.get('code');

  if (!code) {
    res.end('No code found. Try again.');
    return;
  }

  res.end('<h2>Authorization successful! You can close this tab.</h2>');
  server.close();

  // Exchange code for tokens
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT,
    grant_type: 'authorization_code',
  }).toString();

  const req2 = https.request({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, (res2) => {
    let data = '';
    res2.on('data', (chunk) => data += chunk);
    res2.on('end', () => {
      const json = JSON.parse(data);
      if (json.refresh_token) {
        console.log('\n✅ Add these to your .env.local:\n');
        console.log(`GOOGLE_OAUTH_CLIENT_ID=${clientId}`);
        console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${clientSecret}`);
        console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${json.refresh_token}`);
      } else {
        console.error('\n❌ Error:', JSON.stringify(json, null, 2));
      }
    });
  });

  req2.write(body);
  req2.end();
});

server.listen(3333, () => {
  console.log('\n1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Authorize with the Google account that owns the Drive folder');
  console.log('3. You will be redirected back automatically — check this terminal\n');
});
