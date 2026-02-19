# API Contract Changes: Auth

## GET /api/auth/confirm

**Change**: Make endpoint idempotent — return 200 for already-confirmed tokens.

### Before

| Case | Status | Response |
|------|--------|----------|
| Valid, unused token | 200 | `{ "message": "Email confirmed successfully. You can now log in." }` |
| Already confirmed | 400 | `{ "error": "INVALID_TOKEN", "message": "This confirmation link has already been used." }` |
| Expired/invalid | 400 | `{ "error": "INVALID_TOKEN", "message": "..." }` |

### After

| Case | Status | Response |
|------|--------|----------|
| Valid, unused token | 200 | `{ "message": "Email confirmed successfully! You can now log in.", "alreadyConfirmed": false }` |
| Already confirmed | 200 | `{ "message": "Your email is already confirmed. You can log in.", "alreadyConfirmed": true }` |
| Expired/invalid | 400 | `{ "error": "INVALID_TOKEN", "message": "..." }` |

## POST /api/auth/login

**Change**: Add login-based online status grant.

### Behavior Addition

After successful password validation, if the player's `onlineUntil` is null or more than 3 hours in the past, set `onlineUntil` to `now + 20 minutes`.

**Response**: No change to response shape. The `PlayerResponse` from `/api/player/me` will reflect the updated online status.
