const fetch = require('node-fetch');

module.exports = async function (context, req) {
  context.log('API proxy endpoint called:', req.method, req.url);
  context.log('Headers:', JSON.stringify(req.headers));
  context.log('Query:', JSON.stringify(req.query));

  // Enable CORS
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Concept2-Token'
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
  // Note: Azure Static Web Apps overwrites the Authorization header with its own auth token
  // So we use a custom header X-Concept2-Token instead
  const token = req.headers['x-concept2-token'] || req.headers['X-Concept2-Token'];
  if (!token) {
    context.log.error('No X-Concept2-Token header found. Headers:', JSON.stringify(req.headers));
    context.res.status = 401;
    context.res.body = { error: 'X-Concept2-Token header required' };
    return;
  }

  context.log('Concept2 token header present:', token.substring(0, 20) + '...');

  const path = req.query.path;
  context.log('Requested path:', path);
  
  if (!path) {
    context.log.error('Missing path parameter');
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
    context.log('Concept2 token (first 30 chars):', token.substring(0, 30) + '...');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,  // Send to Concept2 API with Bearer prefix
        'Accept': 'application/json'
      }
    });

    context.log('Concept2 API response status:', response.status);
    
    // Log cache-related headers
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const cacheControl = response.headers.get('cache-control');
    context.log('Cache headers - ETag:', etag, 'Last-Modified:', lastModified, 'Cache-Control:', cacheControl);

    if (!response.ok) {
      const errorText = await response.text();
      context.log.error('Concept2 API error response:', response.status, errorText);
      
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
    
    // Pass through cache headers to client
    if (etag) {
      context.res.headers['ETag'] = etag;
    }
    if (lastModified) {
      context.res.headers['Last-Modified'] = lastModified;
    }
    if (cacheControl) {
      context.res.headers['Cache-Control'] = cacheControl;
    }
    
    context.res.status = 200;
    context.res.body = data;
  } catch (error) {
    context.log.error('Error proxying request:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
  }
};
