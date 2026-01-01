# Slack App Setup Instructions

## 1. Create a Slack App

1. Go to [Slack API Dashboard](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Enter app name: "ZeitFlow Bot"
4. Select your development workspace
5. Click "Create App"

## 2. Configure OAuth & Permissions

1. In your app settings, go to "OAuth & Permissions"
2. Add the following **Bot Token Scopes**:
   - `chat:write` - Send messages to channels
   - `channels:read` - Read channel information
   - `users:read` - Read user information

## 3. Configure Redirect URLs

1. In "OAuth & Permissions", add **Redirect URLs**:
   - Development: `http://localhost:3000/api/slack/callback`
   - Production: `https://your-domain.com/api/slack/callback`

## 4. Get App Credentials

1. Go to "Basic Information"
2. Copy **Client ID** (this will be `SLACK_CLIENT_ID`)
3. Copy **Client Secret** (this will be `SLACK_CLIENT_SECRET`)
4. Copy **Signing Secret** from "Basic Information" → "Signing Secret" (this will be `SLACK_SIGNING_SECRET`)

## 5. Install App to Workspace

1. Go to "Install App" in your app settings
2. Click "Install to Workspace"
3. Authorize the permissions
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`) for testing

## 6. Update Environment Variables

Add these to your `.env.local` file:

```env
# Slack OAuth Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_STATE_SECRET=generate_random_secret_string
NEXT_PUBLIC_SLACK_CLIENT_ID=your_slack_client_id
```

To generate a random state secret:
```bash
openssl rand -base64 32
```

## 7. Test Integration

1. Go to your ZeitFlow settings page
2. Click "Add Slack Bot"
3. Complete the OAuth flow
4. Test sending a message to a channel

## Notes

- Each user can connect multiple Slack workspaces
- Bot tokens are stored securely in the database
- Bots can be deactivated but preserve history
- Channel format validation: `#channel` for channels, `@user` for direct messages
- Variable support: Use `{{variable}}` syntax for dynamic content

## Security Considerations

- Always use HTTPS in production
- Keep your client secrets secure
- Regular tokens expire and may need refreshing
- Use minimum required scopes for security