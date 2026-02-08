# Auth API Contract

**Base path**: `/api/auth`

## POST /api/auth/register

Register a new player account.

**Request body**:
```json
{
  "email": "player@example.com",
  "username": "HeroMaster",
  "password": "secret123"
}
```

**Validation**:
- email: valid format, max 255 chars, unique
- username: 3-30 chars, alphanumeric + underscore, unique
- password: min 6 chars

**Response 201** (Created):
```json
{
  "message": "Registration successful. Please check your email to confirm your account."
}
```

**Response 400** (Validation error):
```json
{
  "error": "EMAIL_TAKEN",
  "message": "An account with this email already exists."
}
```

**Response 400** (Username taken):
```json
{
  "error": "USERNAME_TAKEN",
  "message": "This username is already in use."
}
```

**Side effects**: Sends confirmation email from `piratemanagerofficial@gmail.com` with link containing UUID token.

---

## GET /api/auth/confirm?token={uuid}

Confirm email address and activate account.

**Response 200**:
```json
{
  "message": "Email confirmed successfully. You can now log in."
}
```

**Response 400** (Invalid/expired):
```json
{
  "error": "INVALID_TOKEN",
  "message": "This confirmation link is invalid or has expired. Please request a new one."
}
```

**Side effects**: Marks player as confirmed. Initializes account: Konohamaru-Genin (level 1), 500 gold, 0 diamonds, 120/120 energy.

---

## POST /api/auth/login

Authenticate and receive JWT token.

**Request body**:
```json
{
  "login": "player@example.com",
  "password": "secret123"
}
```

`login` accepts either email or username.

**Response 200**:
```json
{
  "token": "eyJhbGciOi...",
  "playerId": 1,
  "username": "HeroMaster"
}
```

**Response 401** (Invalid credentials):
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email/username or password."
}
```

**Response 403** (Not confirmed):
```json
{
  "error": "EMAIL_NOT_CONFIRMED",
  "message": "Please confirm your email before logging in."
}
```

---

## POST /api/auth/resend-confirmation

Request a new confirmation email.

**Request body**:
```json
{
  "email": "player@example.com"
}
```

**Response 200**:
```json
{
  "message": "If an unconfirmed account exists for this email, a new confirmation link has been sent."
}
```

**Note**: Always returns 200 to prevent email enumeration.
