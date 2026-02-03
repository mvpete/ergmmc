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

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Development API server running on http://localhost:${PORT}`)
})
