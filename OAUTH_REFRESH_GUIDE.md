# OAuth Automatic Token Refresh

## Overview
Automatically refreshes Basecamp OAuth tokens every 2 weeks without manual intervention. No more authorization dialogs!

## How It Works
When tokens expire, the system:
1. **Checks** if token is valid using `hasAccess()`
2. **Refreshes** automatically via direct Basecamp API call
3. **Falls back** to manual auth only if refresh fails

*Note: Uses direct API calls since the OAuth2 library's `refresh()` method doesn't work with Basecamp.*

## First-Time Setup
For automatic refresh to work, you need to authorize once to get refresh tokens:

1. **Run initial authorization:**
   ```javascript
   ensureAuthenticated()
   ```

2. **If not authenticated**, it will show an authorization link popup in the Onestop Google Sheet:
   - Copy the link and open it in your browser
   - Approve access to Basecamp
   - Return to Google Apps Script

3. **Verify setup:**
   ```javascript
   viewAuthStatus()
   ```
   Should show both authentication and refresh token as available.

**You only need to do this once!** After setup, tokens refresh automatically every 2 weeks.

## Check Status
```javascript
viewAuthStatus()
```

**Expected output when working:**
```
✅ Currently Authenticated: YES
🔄 Automatic Refresh Available: YES
🎉 Fully configured - automatic refresh will work when tokens expire
```

## Available Functions
- `viewAuthStatus()` - Check current auth status (read-only)
- `ensureAuthenticated()` - Ensure auth works, fix if needed (takes action)
- **Automatic refresh token extraction** - Happens transparently when needed
- `simulateTokenExpiration()` - Simulate token expiration for testing automatic refresh
- `logout()` - Clear tokens

## Benefits
- ✅ **Zero manual intervention** - no more 2-week interruptions
- ✅ **Seamless experience** - automatic background refresh
- ✅ **Secure** - uses proper OAuth2 refresh flow
- ✅ **Reliable fallback** - manual auth if refresh fails

## Technical Details
**Refresh Endpoint:** `POST https://launchpad.37signals.com/authorization/token`

**Token Storage:**
- `oauth2.Basecamp` - OAuth2 library storage (access + refresh tokens)
- `Basecamp.refresh_token` - Extracted refresh token for our system

## Testing Automatic Refresh
To test that automatic refresh works without waiting 2 weeks:

1. **Simulate expiration:**
   ```javascript
   simulateTokenExpiration()
   ```

2. **Verify expiration (optional):**
   ```javascript
   viewAuthStatus()  // Should now show "Not authenticated"
   ```

3. **Test automatic refresh:**
   ```javascript
   ensureAuthenticated()  // Should automatically refresh and succeed
   ```

4. **Verify it worked:**
   ```javascript
   viewAuthStatus()  // Should show authenticated with refresh token
   ```

The logs will show the automatic refresh process in action!
