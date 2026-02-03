const fetch = require('node-fetch');

module.exports = async function (context, req) {
  context.log(`Token/Proxy endpoint called: ${req.method} ${req.url}`);

  // Enable CORS
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  // GET requests are for API proxying
  if (req.method === 'GET') {
    return handleApiProxy(context, req);
  }

  // POST requests are for token exchange
  if (req.method === 'POST') {
    return handleTokenExchange(context, req);
  }

  context.res.status = 405;
  context.res.body = { error: 'Method not allowed' };
};

// Handle API proxy requests (GET)
async function handleApiProxy(context, req) {
  context.log('Headers received:', JSON.stringify(req.headers));
  
  const authorization = req.headers.authorization;
  if (!authorization) {
    context.log.error('No authorization header found');
    context.res.status = 401;
    context.res.body = { error: 'Authorization header required' };
    return;
  }

  context.log('Authorization header:', authorization.substring(0, 20) + '...');

  const path = req.query.path;
  if (!path) {
    context.res.status = 400;
    context.res.body = { error: 'Path parameter required' };
    return;
  }

  // Security: Validate path to prevent malicious requests
  // Only allow paths starting with /users/me
  if (!path.startsWith('/users/me')) {
    context.log.warn('Blocked potentially malicious API call:', path);
    context.res.status = 403;
    context.res.body = { error: 'Forbidden: Invalid API path' };
    return;
  }

  // Security: Prevent path traversal attacks
  if (path.includes('..') || path.includes('//')) {
    context.log.warn('Blocked path traversal attempt:', path);
    context.res.status = 403;
    context.res.body = { error: 'Forbidden: Invalid path format' };
    return;
  }

  try {
    const apiUrl = `https://log.concept2.com/api${path}`;
    context.log('Proxying request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      context.log.error('Concept2 API error:', response.status, errorText);
      
      // Try to parse error as JSON, otherwise return as text
      let errorBody;
      try {
        errorBody = JSON.parse(errorText);
      } catch {
        errorBody = { error: errorText };
      }
      
      context.res.status = response.status;
      context.res.body = errorBody;
      return;
    }

    const data = await response.json();
    context.res.status = 200;
    context.res.body = data;
  } catch (error) {
    context.log.error('Error proxying request:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
  }
}

// Handle token exchange (POST)
async function handleTokenExchange(context, req) {
  context.log('Token exchange request body:', JSON.stringify(req.body));
  
  const { code, refresh_token, grant_type = 'authorization_code' } = req.body;

  if (!code && !refresh_token) {
    context.log.error('Missing both code and refresh_token');
    context.res.status = 400;
    context.res.body = { error: 'Authorization code or refresh token is required' };
    return;
  }

  context.log(`Grant type: ${grant_type}, has code: ${!!code}, has refresh_token: ${!!refresh_token}`);

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
}
