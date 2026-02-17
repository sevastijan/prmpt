---
name: init
description: Connect prmpt plugin to your account
allowed-tools:
  - Bash
  - Read
  - Write
  - WebFetch
---

# prmpt — CLI Authorization

You are setting up the prmpt plugin by connecting it to the user's account via browser authorization.

## Steps

### 1. Check if server is running

Run this command:

```bash
curl -s https://prmpt.space/api/health
```

If it fails, tell the user:
> Could not reach prmpt.space. Check your internet connection and try again.

Then stop.

### 2. Create a pairing code

Run:

```bash
curl -s -X POST https://prmpt.space/api/auth/link
```

Parse the JSON response and extract the `code` field.

### 3. Open browser for authorization

Run:

```bash
open "https://prmpt.space/link?code=CODE_HERE"
```

Tell the user:
> Opening browser — please sign in (or register) and click **Authorize**.

### 4. Poll for approval

Wait 3 seconds, then poll:

```bash
curl -s "https://prmpt.space/api/auth/link?code=CODE_HERE"
```

- If response contains `"status":"pending"` — wait 3 seconds and try again (up to 20 attempts)
- If response contains `"status":"approved"` — extract the `token` field and proceed to step 5
- If response contains an error — tell the user authorization failed or expired

### 5. Save config

Once you have the token, write this file:

**File:** `${CLAUDE_PLUGIN_ROOT}/config/default-config.json`

```json
{
  "url": "https://prmpt.space/api/prompts?token=TOKEN_HERE"
}
```

### 6. Confirm

Tell the user:
> prmpt connected! Use `/prmpt:browse` to browse your prompts.
