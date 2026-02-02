const BASE_URL = 'https://log.concept2.com'
const AUTH_URL = `${BASE_URL}/oauth/authorize`
const TOKEN_URL = `${BASE_URL}/oauth/access_token`
const API_URL = `${BASE_URL}/api`

const CLIENT_ID = import.meta.env.VITE_CONCEPT2_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_CONCEPT2_CLIENT_SECRET
const REDIRECT_URI = import.meta.env.VITE_CONCEPT2_REDIRECT_URI

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'user:read,results:read',
    response_type: 'code',
    redirect_uri: REDIRECT_URI
  })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(code) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code
    })
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for token')
  }

  const tokenData = await response.json()
  // Store when the token was obtained
  tokenData.obtained_at = Date.now()
  return tokenData
}

async function refreshAccessToken(refreshToken) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  const tokenData = await response.json()
  tokenData.obtained_at = Date.now()
  return tokenData
}

export function saveToken(tokenData) {
  localStorage.setItem('concept2_token', JSON.stringify(tokenData))
}

export function getToken() {
  const data = localStorage.getItem('concept2_token')
  return data ? JSON.parse(data) : null
}

export function clearToken() {
  localStorage.removeItem('concept2_token')
}

function isTokenExpired(tokenData) {
  if (!tokenData || !tokenData.obtained_at || !tokenData.expires_in) {
    return false // Can't determine, assume valid
  }
  const expiresAt = tokenData.obtained_at + (tokenData.expires_in * 1000)
  // Consider expired 5 minutes before actual expiry
  return Date.now() > (expiresAt - 5 * 60 * 1000)
}

export async function getValidToken() {
  let tokenData = getToken()

  if (!tokenData || !tokenData.access_token) {
    throw new Error('Not authenticated')
  }

  // Check if token is expired or about to expire
  if (isTokenExpired(tokenData) && tokenData.refresh_token) {
    try {
      tokenData = await refreshAccessToken(tokenData.refresh_token)
      saveToken(tokenData)
    } catch (err) {
      clearToken()
      throw new Error('Session expired. Please reconnect.')
    }
  }

  return tokenData.access_token
}

export function isAuthenticated() {
  const token = getToken()
  return token && token.access_token
}

async function apiRequest(endpoint) {
  const token = await getValidToken()

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Try to refresh and retry once
      const tokenData = getToken()
      if (tokenData?.refresh_token) {
        try {
          const newTokenData = await refreshAccessToken(tokenData.refresh_token)
          saveToken(newTokenData)

          // Retry the request
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${newTokenData.access_token}`,
              'Accept': 'application/json'
            }
          })

          if (retryResponse.ok) {
            return retryResponse.json()
          }
        } catch (err) {
          // Refresh failed
        }
      }

      clearToken()
      throw new Error('Session expired. Please reconnect.')
    }
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}

export async function fetchUserProfile() {
  const data = await apiRequest('/users/me')
  return data.data
}

export async function fetchYearResults(year) {
  const from = `${year}-01-01`
  const to = `${year}-12-31`
  let allResults = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const data = await apiRequest(`/users/me/results?from=${from}&to=${to}&page=${page}`)

    if (data.data && data.data.length > 0) {
      allResults = allResults.concat(data.data)
      page++
      hasMore = data.data.length === 50
    } else {
      hasMore = false
    }
  }

  return allResults
}

export async function fetchAllResults() {
  let allResults = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const data = await apiRequest(`/users/me/results?page=${page}`)

    if (data.data && data.data.length > 0) {
      allResults = allResults.concat(data.data)
      page++
      hasMore = data.data.length === 50
    } else {
      hasMore = false
    }
  }

  return allResults
}

export function calculateTotalMeters(results) {
  return results.reduce((total, result) => {
    return total + (result.distance || 0)
  }, 0)
}
