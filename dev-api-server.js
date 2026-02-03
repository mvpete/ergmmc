import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const CLIENT_ID = process.env.CONCEPT2_CLIENT_ID || 'rsbSKDlH8oEdk9HwxNC7LRO4GXKBJyM8QZcwSBpr'
const CLIENT_SECRET = process.env.CONCEPT2_CLIENT_SECRET || 'aRFup2NKKV0O2gAvfMhR5xF73zHQeEMtjRMXuMdX'
const REDIRECT_URI = process.env.CONCEPT2_REDIRECT_URI || 'http://localhost:5173/callback'

app.post('/api/token', async (req, res) => {
  const { code, refresh_token, grant_type = 'authorization_code' } = req.body

  if (!code && !refresh_token) {
    return res.status(400).json({ error: 'Authorization code or refresh token is required' })
  }

  try {
    const tokenUrl = 'https://log.concept2.com/oauth/access_token'
    
    let params
    if (grant_type === 'refresh_token' && refresh_token) {
      params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refresh_token
      })
    } else {
      params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
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
      console.error('Token exchange failed:', errorText)
      return res.status(response.status).json({ error: 'Failed to exchange token' })
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Error exchanging token:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// API proxy endpoint to avoid CORS issues on iOS
app.get('/api/proxy', async (req, res) => {
  // Use X-Concept2-Token header (Azure Static Web Apps overwrites Authorization header)
  const token = req.headers['x-concept2-token']
  if (!token) {
    return res.status(401).json({ error: 'X-Concept2-Token header required' })
  }

  const path = req.query.path
  if (!path) {
    return res.status(400).json({ error: 'Path parameter required' })
  }

  // Security: Validate path to prevent malicious requests
  // Only allow paths starting with /users/me
  if (!path.startsWith('/users/me')) {
    console.warn('Blocked potentially malicious API call:', path)
    return res.status(403).json({ error: 'Forbidden: Invalid API path' })
  }

  // Security: Prevent path traversal attacks
  if (path.includes('..') || path.includes('//')) {
    console.warn('Blocked path traversal attempt:', path)
    return res.status(403).json({ error: 'Forbidden: Invalid path format' })
  }

  try {
    const apiUrl = `https://log.concept2.com/api${path}`
    console.log('Proxying request to:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Concept2 API error:', response.status, errorText)
      return res.status(response.status).json({ error: errorText })
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Error proxying request:', error)
    res.status(500).json({ error: error.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Development API server running on http://localhost:${PORT}`)
})
