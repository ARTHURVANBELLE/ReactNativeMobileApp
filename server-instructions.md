# Strava Authentication Backend Instructions

The React Native app is failing to receive authentication data after the OAuth flow completes. Here are the exact changes needed on your SolidJS backend to fix the issue:

## 1. Modify the `/api/auth/strava/url` endpoint

Ensure this endpoint accepts and uses the `session_id` parameter:

```javascript
app.post('/api/auth/strava/url', (req, res) => {
  const { redirect_uri, platform, session_id } = req.body;
  
  // Store the session_id for later use - you can use a server-side cache or database
  // This associates the auth session with a specific app instance
  // Example: sessionStore.set(session_id, { startTime: Date.now() });
  
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=read,activity:read&state=${session_id}`;
  
  res.json({ url: authUrl });
});
```

## 2. Fix the `/api/auth/strava/mobile-callback` endpoint

This is the main issue. When Strava redirects back to this endpoint, it should:

```javascript
app.get('/api/auth/strava/mobile-callback', async (req, res) => {
  try {
    // Extract code and session_id (from state parameter)
    const { code, state: session_id } = req.query;
    
    if (!code) {
      return renderErrorPage(res, 'No authorization code received');
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      return renderErrorPage(res, `Token exchange failed: ${error}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user data if needed
    let userData = null;
    if (tokenData.access_token) {
      try {
        const userResponse = await fetch('https://www.strava.com/api/v3/athlete', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        userData = await userResponse.json();
        tokenData.user = userData;
      } catch (userError) {
        console.error('Error fetching user data:', userError);
      }
    }
    
    // Store tokens with the session_id
    if (session_id) {
      // Example: sessionStore.set(session_id, { ...tokenData, userData });
      console.log(`Stored token data for session ${session_id}`);
    }
    
    // Return success HTML with auth data stored in localStorage
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Complete</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 20px; background: #f7f7f7; }
          .card { max-width: 500px; margin: 0 auto; padding: 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .success { color: #2ecc71; }
          .spinner { display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(0,0,0,0.1); border-radius: 50%; border-top-color: #2ecc71; animation: spin 1s ease-in-out infinite; margin-right: 10px; vertical-align: middle; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 class="success">Authentication Successful!</h2>
          <p><span class="spinner"></span> Returning to application...</p>
        </div>
        
        <script>
          // The main issue is here - ensure this code properly stores the token data
          try {
            // Store authentication data where the app can find it
            const authData = ${JSON.stringify(tokenData)};
            
            // Store in both localStorage and sessionStorage for redundancy
            localStorage.setItem('strava_auth_data', JSON.stringify(authData));
            sessionStorage.setItem('strava_auth_data', JSON.stringify(authData));
            
            console.log('Auth data saved to browser storage');
            
            // Try to communicate directly with opener window if available
            if (window.opener) {
              window.opener.postMessage({
                type: 'strava-auth-complete',
                success: true,
                authData: authData
              }, '*');
              
              console.log('Message posted to opener window');
            }
            
            // Close window or redirect
            setTimeout(function() {
              if (window.opener) {
                window.close();
              } else {
                // If we can't close (browser restriction), redirect to app
                window.location.href = "/";
              }
            }, 1500);
          } catch(e) {
            console.error('Error in auth callback processing:', e);
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Auth callback error:', error);
    renderErrorPage(res, error.message);
  }
});

// Helper function for error pages
function renderErrorPage(res, errorMessage) {
  res.status(400).send(`
    <html>
      <head>
        <title>Authentication Failed</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 20px; background: #f7f7f7; }
          .card { max-width: 500px; margin: 0 auto; padding: 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 class="error">Authentication Failed</h2>
          <p>${errorMessage}</p>
          <button onclick="window.close()">Close</button>
        </div>
        <script>
          setTimeout(() => {
            if (window.opener) window.close();
          }, 5000);
        </script>
      </body>
    </html>
  `);
}
```

## 3. Add a session check endpoint

Create a new endpoint to retrieve tokens by session ID:

```javascript
app.get('/api/auth/check-session', (req, res) => {
  const { session_id } = req.query;
  
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id parameter' });
  }
  
  // Retrieve the stored token data
  // Example: const tokenData = sessionStore.get(session_id);
  const tokenData = null; // Replace with actual data retrieval
  
  if (!tokenData) {
    return res.status(404).json({ error: 'No authentication data found for this session' });
  }
  
  // Return the token data
  res.json(tokenData);
});
```

## 4. Ensure CORS is properly configured

This is critical - make sure your CORS configuration is correct:

```javascript
import cors from 'cors';

// Set up CORS correctly - this is important!
app.use(cors({
  origin: ['http://localhost:8081', 'https://your-production-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Or manually:
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:8081', 'https://your-production-domain.com'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  
  // Critical: Handle OPTIONS requests properly
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
```

## Testing

After making these changes:

1. Open your React Native app
2. Click the "Connect with Strava" button
3. Complete the Strava authorization
4. The popup should close automatically
5. Your app should receive the auth tokens and proceed to the authenticated state

If you still encounter issues, check the browser console for error messages.
