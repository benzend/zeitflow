# Setup Guide: Fix Chat API Error
# =================================

## Problem
You're getting: "SyntaxError: Unexpected token 'I', "Internal S"... is not valid JSON"

## Root Cause
The OpenRouter API key is not configured, causing the AI service to fail.

## Solution

### 1. Get OpenRouter API Key
1. Visit https://openrouter.ai/
2. Sign up for an account
3. Get your API key from the dashboard

### 2. Configure Environment Variables
Create/update your `.env.local` file with:

```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

### 3. Restart Development Server
```bash
pnpm dev
```

### 4. Test the Chat
1. Go to http://localhost:3001/workflow/iwe
2. Sign in if required
3. Try sending a message in the chat

## Alternative: Check Existing Configuration
If you already have a `.env.local` file, make sure it contains:
- `OPENROUTER_API_KEY=your_key_here`
- No extra spaces or quotes around the key

## Verification
After setup, the chat should work without JSON parsing errors.