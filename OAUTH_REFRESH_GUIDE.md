# OAuth Automatic Token Refresh

## Overview
After initial setup, automatically refreshes Basecamp OAuth tokens every 2 weeks without manual dialog approvals.

## How It Works
When tokens expire, the system automatically:
1. **Checks** if token is valid using `hasAccess()`
2. **Refreshes** via direct Basecamp API call (throws error if fails)
3. **Falls back** to manual auth dialog only if refresh completely fails

*Note: Uses direct API calls since the OAuth2 library's `refresh()` method doesn't work with Basecamp. The system throws `BasecampUnauthError` immediately when auth issues occur, ensuring quick failure detection.*

## First-Time Setup
For automatic refresh to work, you need to authorize once to get refresh tokens:

1. **Run initial authorization:**
   ```javascript
   login()
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
- `login()` - Ensure auth works, automatically refresh or show auth dialog (throws `BasecampUnauthError` only if completely unable to authenticate)
- **Automatic refresh token storage** - Extracts and stores refresh tokens transparently when needed
- `simulateTokenExpiration()` - Simulate token expiration for testing automatic refresh
- `logout()` - Clear all tokens

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

**Error Handling:**
- Functions throw `BasecampUnauthError` immediately when authentication fails
- No boolean returns to check - either succeeds or throws
- Simplifies error handling and ensures fast failure detection

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
   login()  // Should automatically refresh and succeed (throws error only if auth completely fails)
   ```

4. **Verify it worked:**
   ```javascript
   viewAuthStatus()  // Should show authenticated with refresh token
   ```

The logs will show the automatic refresh process in action!
