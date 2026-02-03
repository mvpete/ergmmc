const fetch = require('node-fetch');

module.exports = async function (context, req) {
  context.log('API proxy endpoint called');

  // Enable CORS
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  if (req.method !== 'GET') {
    context.res.status = 405;
    context.res.body = { error: 'Method not allowed' };
    return;
  }

  // Azure Functions may lowercase header names
  const authorization = req.headers.authorization || req.headers.Authorization;
  if (!authorization) {
    context.log.error('No authorization header found');
    context.res.status = 401;
    context.res.body = { error: 'Authorization header required' };
    return;
  }

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

    context.log('Concept2 API response status:', response.status);

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
};
