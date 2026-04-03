const fetch = require('node-fetch');
const { exchangeToken } = require('../shared/tokenExchange');

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

  context.log('Token request - grant_type:', grant_type, 'has code:', !!code, 'has refresh_token:', !!refresh_token);

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

    const data = await exchangeToken(fetch, {
      code,
      refresh_token,
      grant_type,
      clientId,
      clientSecret,
      redirectUri
    });

    context.res.status = 200;
    context.res.body = data;
  } catch (error) {
    if (error.statusCode) {
      // Error from exchangeToken
      context.log.error('Token exchange failed:', error.body);
      context.res.status = error.statusCode;
      context.res.body = error.body;
    } else {
      // Unexpected error
      context.log.error('Error exchanging token:', error);
      context.res.status = 500;
      context.res.body = { error: 'Internal server error' };
    }
  }
};
