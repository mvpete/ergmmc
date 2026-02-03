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

  const authorization = req.headers.authorization;
  if (!authorization) {
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
      context.res.status = response.status;
      context.res.body = { error: errorText };
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
