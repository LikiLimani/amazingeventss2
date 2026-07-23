/**
 * Step 1 of the OAuth handshake.
 * Decap CMS opens a popup pointed at this function when someone clicks
 * "Login with GitHub" on /admin. This function just redirects that popup
 * to GitHub's own authorization screen.
 *
 * Required environment variables (set these in Netlify:
 * Project configuration → Environment variables):
 *   GITHUB_CLIENT_ID
 *   SITE_URL   e.g. https://amazingeventss.netlify.app  (no trailing slash)
 */
exports.handler = async function (event) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const siteUrl = process.env.SITE_URL || process.env.URL;

  if (!clientId || !siteUrl) {
    return {
      statusCode: 500,
      body: 'Missing GITHUB_CLIENT_ID or SITE_URL environment variable. Set these in Netlify: Project configuration → Environment variables.'
    };
  }

  const redirectUri = siteUrl.replace(/\/$/, '') + '/.netlify/functions/callback';
  const state = Math.random().toString(36).slice(2);

  const authorizeUrl =
    'https://github.com/login/oauth/authorize' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&scope=' + encodeURIComponent('repo,user') +
    '&state=' + encodeURIComponent(state);

  return {
    statusCode: 302,
    headers: { Location: authorizeUrl },
    body: ''
  };
};
