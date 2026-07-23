/**
 * Step 2 of the OAuth handshake.
 * GitHub redirects here after the user approves access, with a one-time
 * ?code=... in the URL. This function exchanges that code for an access
 * token, then hands the token back to the Decap CMS popup via
 * window.postMessage, using the exact message format Decap expects.
 *
 * Required environment variables (Netlify: Project configuration →
 * Environment variables):
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 */
exports.handler = async function (event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;

  if (!code) {
    return { statusCode: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: 'Missing ?code from GitHub redirect.' };
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: 'Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variable.'
    };
  }

  let tokenData;
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });
    tokenData = await tokenRes.json();
  } catch (err) {
    return { statusCode: 502, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: 'Failed to reach GitHub: ' + err.message };
  }

  if (!tokenData || tokenData.error || !tokenData.access_token) {
    const reason = (tokenData && (tokenData.error_description || tokenData.error)) || 'unknown error';
    return { statusCode: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: 'GitHub OAuth error: ' + reason };
  }

  const messageData = JSON.stringify({ token: tokenData.access_token, provider: 'github' });

  const html = '<!DOCTYPE html><html><body>' +
    '<p id="status">Completing sign-in...</p>' +
    '<script>' +
    '(function() {' +
    '  var statusEl = document.getElementById("status");' +
    '  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }' +
    '  if (!window.opener) {' +
    '    setStatus("ERROR: window.opener is missing. The browser (or a security header) severed the link back to the admin tab, likely while bouncing through GitHub\\u2019s login page. Try a different browser (or disable strict tracking/privacy protection for this site) and try again.");' +
    '    return;' +
    '  }' +
    '  function receiveMessage(e) {' +
    '    try {' +
    '      window.opener.postMessage(' +
    '        "authorization:github:success:" + JSON.stringify(' + messageData + '),' +
    '        e.origin' +
    '      );' +
    '      setStatus("Signed in - you can close this window.");' +
    '    } catch (err) {' +
    '      setStatus("ERROR completing handshake: " + err.message);' +
    '    }' +
    '    window.removeEventListener("message", receiveMessage, false);' +
    '  }' +
    '  window.addEventListener("message", receiveMessage, false);' +
    '  try {' +
    '    window.opener.postMessage("authorizing:github", "*");' +
    '    setStatus("Waiting for the admin page to respond...");' +
    '  } catch (err) {' +
    '    setStatus("ERROR starting handshake: " + err.message);' +
    '  }' +
    '})();' +
    '</script>' +
    '</body></html>';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html
  };
};
