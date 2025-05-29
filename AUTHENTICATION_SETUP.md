# Authentication Setup Guide

This guide walks you through setting up Google OAuth authentication for your Joice application.

## 1. Google Cloud Console Setup

### Create OAuth 2.0 Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Set the following:

   **Name**: `Joice App Authentication`
   
   **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - `https://your-app-name.vercel.app` (for production)
   
   **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://your-app-name.vercel.app/api/auth/callback/google` (for production)

7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## 2. Environment Variables

### Local Development (.env.local):
```bash
DATABASE_URL=your_postgresql_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key
HOST=http://localhost:3000

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
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

## 3. Generate NEXTAUTH_SECRET

You can generate a secure secret using:
```bash
openssl rand -base64 32
```

## 4. Test Authentication

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Sign In" - you should be redirected to Google OAuth
4. After successful authentication, you'll be redirected back to your dashboard

## Important Notes

- **Redirect URIs must match exactly** in Google Cloud Console
- For Vercel, update the redirect URI after deploying to get your actual domain
- The callback URL follows the pattern: `{your-domain}/api/auth/callback/google`
- NextAuth.js handles the OAuth flow automatically - you don't need to implement the callback logic