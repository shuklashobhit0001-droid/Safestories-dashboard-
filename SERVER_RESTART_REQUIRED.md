# Server Restart Required

## Issue
The error `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` means the server is returning HTML instead of JSON. This happens when:
1. The server hasn't been restarted after adding new API endpoints
2. The API endpoint doesn't exist on the running server

## Solution
You need to restart the server to load the new `/api/admin-profile` endpoints.

### Steps to Restart:

1. **Stop the current server** (if running):
   - Press `Ctrl+C` in the terminal where the server is running

2. **Start the server**:
   ```bash
   npm run server
   ```
   or
   ```bash
   node server/index.ts
   ```

3. **Verify the server is running**:
   - Check the terminal for "Server running on port 3002" message
   - The admin profile functionality should now work

## New Endpoints Added
- `GET /api/admin-profile?user_id=X` - Fetch admin profile
- `PUT /api/admin-profile` - Update admin profile

## After Restart
Once the server is restarted:
1. Refresh the browser
2. Click on the profile picture in the admin sidebar
3. Click "Edit Profile"
4. The profile should load without errors
