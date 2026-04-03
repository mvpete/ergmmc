/**
 * Shared token exchange logic for Azure Functions (CommonJS)
 */

async function exchangeToken(fetch, { code, refresh_token, grant_type = 'authorization_code', clientId, clientSecret, redirectUri }) {
  if (!code && !refresh_token) {
    throw new Error('Authorization code or refresh token is required')
  }

  if (!clientId || !clientSecret) {
    throw new Error('Client ID and secret are required')
  }

  const tokenUrl = 'https://log.concept2.com/oauth/access_token'
  
  let params
  if (grant_type === 'refresh_token' && refresh_token) {
    params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh_token,
      scope: 'user:read,results:read'
    })
  } else {
    if (!redirectUri) {
      throw new Error('Redirect URI is required for authorization code exchange')
    }
    params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
      scope: 'user:read,results:read'
    })
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorBody
    try { 
      errorBody = JSON.parse(errorText) 
    } catch { 
      errorBody = { error: errorText } 
    }
    const error = new Error('Token exchange failed')
    error.statusCode = response.status
    error.body = errorBody
    throw error
  }

  return await response.json()
}

module.exports = { exchangeToken }
