# Research: Core Game Fixes & Polish

**Date**: 2026-02-11
**Feature**: `002-fixes-polish`

## R-001: Team Page "Failed to load team data" Root Cause Analysis

### Investigation

The `TeamPage.tsx` makes three parallel API calls (`getTeam()`, `getHeroes()`, `getSummons()`). If ANY fails, the generic error "Failed to load team data." is displayed (TeamPage.tsx:32-33).

**Chain analyzed**: Frontend API → Controller → Service → Repository → Entity

### Findings

1. **Lazy loading risk**: `Hero.template` uses `@ManyToOne(fetch = FetchType.LAZY)` (Hero.java:38-40). Both `PlayerService.getHeroes()` and `TeamService.getTeamLineup()` call `hero.getTemplate()` without `@Transactional`, relying on Spring's `open-in-view` (OSIV) which keeps the session open for the request lifecycle. While OSIV is enabled by default, this is fragile.

2. **No null safety**: `PlayerService.getHeroes()` (line 76) and `TeamService.getTeamLineup()` (line 59) call `hero.getTemplate()` without null checks. If the template is null (e.g., orphaned hero record), `buildHeroStats(t, level)` throws NPE at line 143-150.

3. **No error isolation**: The frontend catch block (TeamPage.tsx:32) swallows all errors from all three API calls with a single generic message. No way to know which endpoint failed.

4. **Boolean serialization risk**: `HeroResponse.isEquipped` (boolean field) with Lombok `@Getter` generates `isEquipped()`. Jackson may serialize this as `equipped` (dropping "is" prefix), causing frontend `isEquipped` to be `undefined`.

### Decision

- Add `@Transactional(readOnly = true)` to `getHeroes()`, `getSummons()`, and `getTeamLineup()` to ensure consistent session for lazy loading.
- Add null safety for template access in both services.
- The boolean serialization issue should be fixed with `@JsonProperty("isEquipped")` on the field.
- Frontend should log which API call failed for debugging.

---

## R-002: Email Confirmation "Already Used" Root Cause

### Investigation

Traced the flow: ConfirmPage.tsx → authApi.confirmEmail() → GET /api/auth/confirm?token=xxx → AuthService.confirm()

### Root Cause: React 18 StrictMode Double-Effect

`main.tsx` wraps the app in `<React.StrictMode>` (line 9). In React 18 development mode, StrictMode intentionally double-invokes effects (mount → unmount → remount). This means:

1. **First effect run**: `confirmEmail(token)` succeeds → `setStatus('success')`
2. **StrictMode unmount/remount**
3. **Second effect run**: `confirmEmail(token)` fails → backend returns "already used" (token.confirmedAt is now set) → `setStatus('error')`

The second result **overrides** the first. User sees "already used" error despite the confirmation succeeding on the first call.

### Backend confirmation flow (AuthService.java:92-135)

The flow is correct and `@Transactional` — if hero creation fails, the token `confirmedAt` rolls back too. However, the idempotency issue remains: the backend throws an error for already-confirmed tokens instead of returning a success-like response.

### Decision

**Two-pronged fix:**

1. **Backend**: When a token's `confirmedAt` is already set AND the player is confirmed, return a 200 with message "Email already confirmed. You can log in." instead of throwing an error. This makes the endpoint idempotent.
2. **Frontend**: Add a `useRef` guard to prevent the double API call in development mode.

---

## R-003: Starter Hero (Konohamaru-Genin) Visibility

### Investigation

- `data.sql:7`: Konohamaru-Genin is correctly defined with `is_starter=true`
- `AuthService.confirm()` (lines 118-134): Creates Hero with templateId from `findByIsStarterTrue()` and creates TeamSlot with slotNumber=1
- Code flow is correct

### Finding

The starter hero IS created correctly during confirmation (the first StrictMode effect run succeeds). The user cannot SEE it because:
1. The confirmation page shows "error" (R-002 above) — confusing but hero is created
2. The team page fails to load (R-001 above) — hero exists but can't be displayed

### Decision

No separate fix needed. Fixing R-001 (team page) and R-002 (confirmation) will resolve this. The starter hero creation logic is correct.

---

## R-004: Shop Abilities Hero Dropdown

### Investigation

The `ShopPage.tsx` abilities tab:
- Fetches owned heroes via `getHeroes()` from `playerApi.ts` (ShopPage.tsx:44)
- Stores in `ownedHeroes` state (line 26)
- Populates dropdown (lines 258-272)

### Finding

The code is architecturally correct. The dropdown fails to show heroes because `getHeroes()` fails — same root cause as R-001 (team page API failure). When `refreshItems()` catches an error, it shows "Failed to load data." and `ownedHeroes` stays empty.

### Decision

No separate fix needed. Fixing R-001 resolves this.

---

## R-005: Login Online Status Feature

### Investigation

Current auth/online flow:
- `AuthService.login()` (lines 137-154): Retrieves Player entity, validates password, generates JWT. Does NOT touch online status.
- `EnergyService.setOnline()` (lines 56-59): Sets `onlineUntil = now + 40 minutes`. Currently only called from `ArenaService.initiateChallenge()`.
- `Player.onlineUntil`: Nullable timestamp field. If null or past, player is offline.

### Decision

**Best location**: Add logic in `AuthService.login()` after password validation (line 144), before JWT generation (line 152).

**Logic**:
```
if (player.onlineUntil == null || player.onlineUntil < now - 3 hours):
    player.onlineUntil = now + 20 minutes
    save player
```

This only grants online status if the player has been inactive for 3+ hours. The 20-minute duration is less than the 40-minute arena activity bonus, so FR-007 is naturally satisfied — if a player is already online with >20 minutes remaining, the check `onlineUntil < now - 3 hours` will be false, and their status won't be overridden.

### Alternatives Considered

- **In SecurityConfig JWT filter**: Would fire on every request, not just login. Rejected — too frequent.
- **New endpoint `/api/player/heartbeat`**: Over-engineered for this requirement. Rejected.

---

## R-006: Hexagonal Stat Diagram

### Investigation

Reference image analysis: Shows a hexagonal radar chart with 6 vertices, each labeled with stat name, base value, and growth rate (e.g., "Physical 30 +2"). A semi-transparent filled polygon shows the stat distribution.

### Hero Base Stat Ranges (from data.sql)

| Stat | Min | Max | Hero with Max |
|------|-----|-----|---------------|
| physicalAttack | 4 | 16 | Hashirama |
| magicPower | 3 | 16 | Hashirama/Deidara |
| dexterity | 3 | 14 | Minato |
| element | 2 | 12 | Deidara/Hashirama |
| mana | 15 | 35 | Hashirama |
| stamina | 10 | 22 | Hashirama |

Maximum value across all stats: **35** (mana, Hashirama).

### Decision

- **Fixed max scale**: Use 40 as the fixed maximum for all axes. This gives Hashirama's 35 mana ~87.5% fill, leaving visual headroom. All heroes will be comparable on the same scale.
- **Implementation**: Pure SVG component — no external chart library. Six axes at 60-degree intervals. Polygon vertices computed from stat values / 40 * radius.
- **Styling**: Semi-transparent gold fill (#fbbf24 at 20% opacity), gold stroke for the polygon. Gray guidelines for the hexagon frame. Stat labels outside each vertex.
- **Vertex order** (clockwise from top): Physical Attack, Magic Power, Dexterity, Element, Mana, Stamina — matching the reference image layout (Ninjutsu≈MP, Taijutsu≈PA, etc.).
- **Placement**: Shop hero cards and hero detail page. On shop cards, a compact version (180px diameter). On hero detail page, a larger version (240px diameter).

### Alternatives Considered

- **Chart.js / Recharts**: Would add a dependency for a single chart type. Rejected per constitution (YAGNI).
- **Dynamic max (per-hero)**: Would make all heroes look similar. Rejected — doesn't support visual comparison.
- **Canvas-based**: SVG is simpler, accessible, and resolution-independent. Better fit.
