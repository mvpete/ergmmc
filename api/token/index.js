const fetch = require('node-fetch');

module.exports = async function (context, req) {
  context.log('Token exchange endpoint called');

  // Enable CORS
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  if (req.method !== 'POST') {
    context.res.status = 405;
    context.res.body = { error: 'Method not allowed' };
    return;
  }

  const { code, refresh_token, grant_type = 'authorization_code' } = req.body;

  if (!code && !refresh_token) {
    context.res.status = 400;
    context.res.body = { error: 'Authorization code or refresh token is required' };
    return;
  }

  try {
    const clientId = process.env.CONCEPT2_CLIENT_ID;
    const clientSecret = process.env.CONCEPT2_CLIENT_SECRET;
    const redirectUri = process.env.CONCEPT2_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      context.log.error('Missing environment variables');
      context.res.status = 500;
      context.res.body = { error: 'Server configuration error' };
      return;
    }

    // Exchange code for token or refresh token
    const tokenUrl = 'https://log.concept2.com/oauth/access_token';
    
    let params;
    if (grant_type === 'refresh_token' && refresh_token) {
      params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh_token
      });
    } else {
      if (!redirectUri) {
        context.log.error('Missing redirect URI');
        context.res.status = 500;
        context.res.body = { error: 'Server configuration error' };
        return;
      }
      params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      });
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      context.log.error('Token exchange failed:', errorText);
      context.res.status = response.status;
      context.res.body = { error: 'Failed to exchange token' };
      return;
    }

    const data = await response.json();
    
    context.res.status = 200;
    context.res.body = data;
  } catch (error) {
    context.log.error('Error exchanging token:', error);
    context.res.status = 500;
    context.res.body = { error: 'Internal server error' };
  }
};
