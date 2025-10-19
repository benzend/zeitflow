# Authentication Setup Guide

This guide walks you through setting up authentication for your Joice application, including Google OAuth and magic link sign-in with Resend.

## 1. Google Cloud Console Setup

### Create OAuth 2.0 Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Set the following:

   **Name**: `jjoist App Authentication`

   **Authorized JavaScript origins**:

   - `http://localhost:3000` (for local development)
   - `https://your-app-name.vercel.app` (for production)

   **Authorized redirect URIs**:

   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://your-app-name.vercel.app/api/auth/callback/google` (for production)

7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## 2. Resend Setup (for Magic Links)

### Create Resend Account:

1. Go to [Resend](https://resend.com/) and create an account
2. Verify your domain in the Resend dashboard
3. Create an API key from the API Keys section

### Environment Variables for Resend:

Add these to your `.env.local`:

```bash
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Important**: The `RESEND_FROM_EMAIL` must be a verified domain in your Resend account.

## 3. Environment Variables

### Local Development (.env.local):

```bash
DATABASE_URL=your_postgresql_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key
HOST=http://localhost:3000

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Resend for Magic Links
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Vercel Deployment:

Add these environment variables in your Vercel dashboard:

- `DATABASE_URL`
- `OPENROUTER_API_KEY`
- `HOST` (set to your Vercel app URL)
- `NEXTAUTH_URL` (set to your Vercel app URL)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## 4. Generate NEXTAUTH_SECRET

You can generate a secure secret using:

```bash
openssl rand -base64 32
```

## 5. Test Authentication

### Google OAuth:
1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Sign In" → "Sign in with Google"
4. Complete the OAuth flow and you'll be redirected to your dashboard

### Magic Links:
1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Sign In" → "Magic Link" tab
4. Enter your email and click "Send magic link"
5. Check your email for the sign-in link
6. Click the link to sign in automatically

## Important Notes

- **Redirect URIs must match exactly** in Google Cloud Console
- For Vercel, update the redirect URI after deploying to get your actual domain
- The callback URL follows the pattern: `{your-domain}/api/auth/callback/google`
- NextAuth.js handles the OAuth flow automatically - you don't need to implement the callback logic
- Magic links expire after 24 hours for security
- Magic links automatically verify the user's email address
- Resend requires domain verification before sending emails
