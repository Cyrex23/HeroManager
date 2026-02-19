# Quickstart: Core Game Fixes & Polish

**Branch**: `002-fixes-polish`

## Prerequisites

- Java 17+ (JDK)
- Node.js 18+ (for frontend build)
- Maven 3.8+

## Start Backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Verify: `http://localhost:8080/h2-console` — check hero_template has 9 rows.

## Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Verify: `http://localhost:3000` shows login page.

## Verify Fixes

### 1. Email Confirmation (US3)

1. Register a new account
2. Click confirmation link from email
3. **Expected**: Page shows "Email confirmed successfully!" with login link
4. Click the same link again → shows "Your email is already confirmed" (not an error)

### 2. Starter Hero (US2)

1. Log in with the newly confirmed account
2. Navigate to Team page
3. **Expected**: Konohamaru-Genin in slot 1, capacity 5/100

### 3. Team Page (US1)

1. Navigate to Team page
2. **Expected**: No "Failed to load" errors. Team slots display correctly.
3. Buy a hero from Shop, return to Team
4. **Expected**: New hero appears in Bench Heroes section

### 4. Shop Abilities Dropdown (US4)

1. Navigate to Shop → Abilities tab
2. **Expected**: Hero dropdown shows all owned heroes
3. Select a hero → abilities for that hero load

### 5. Login Online Status (US5)

1. Log in after 3+ hours of inactivity (or fresh account)
2. Have another player check Arena
3. **Expected**: Logged-in player appears as "Online" with 5 AE cost

### 6. Hexagonal Diagram (US6)

1. Navigate to Shop → view any hero card
2. **Expected**: Hexagonal radar chart shows 6 stats with base values and growth rates
3. Navigate to hero detail page
4. **Expected**: Larger hex diagram with same data

## Key URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- H2 Console: http://localhost:8080/h2-console (user: sa, password: empty)
