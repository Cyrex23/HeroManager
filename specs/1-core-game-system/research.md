# Research: HeroManager Core Game System

**Date**: 2026-02-08
**Phase**: 0 — Outline & Research
**Spec**: [spec.md](spec.md)

## R-001: Database Selection

**Decision**: H2 (embedded) for development, PostgreSQL for production readiness

**Rationale**: H2 requires zero external setup (runs embedded in the JVM), supports SQL/JPA seamlessly, and provides an in-memory mode for rapid iteration. Spring Boot auto-configures H2 out of the box. PostgreSQL is the long-term target for when the project moves to multi-user or deployed environments. Spring Data JPA abstracts the difference so migration is a config change.

**Alternatives considered**:
- MySQL: Equally valid, but PostgreSQL has better JSON support and standards compliance
- SQLite: Poor JPA support in Java ecosystem
- MongoDB: Document DB is a poor fit for the highly relational data model (heroes → teams → players → battles)

---

## R-002: Authentication & Security Approach

**Decision**: Spring Security with JWT (stateless) + BCrypt password hashing

**Rationale**: JWT-based auth is standard for SPA (React) frontends. The frontend stores the JWT in memory/localStorage and sends it via `Authorization: Bearer` header. Stateless auth avoids server-side session management complexity. BCrypt is the industry standard for password hashing in Spring Security.

**Key details**:
- Registration: email + username + password → BCrypt hash → store → send confirmation email
- Confirmation: UUID token in URL → marks account as confirmed
- Login: email/username + password → validate → return JWT
- JWT contains: playerId, username, issued/expiry timestamps
- Token expiry: 24 hours (appropriate for a game — players stay logged in during sessions)
- Password policy: minimum 6 characters (simple for a game, not enterprise)

**Alternatives considered**:
- Session-based auth: Requires server-side session store, complicates horizontal scaling later
- OAuth2/Social login: Over-engineered for phase 1; can be added later

---

## R-003: Email Sending Approach

**Decision**: Spring Boot Mail with Gmail SMTP (App Password)

**Rationale**: Spring Boot's `spring-boot-starter-mail` provides straightforward SMTP integration. Gmail requires an App Password (since 2-factor auth blocks regular passwords for SMTP). This is the simplest approach for local development.

**Key details**:
- SMTP host: `smtp.gmail.com`, port 587, TLS enabled
- From address: `piratemanagerofficial@gmail.com`
- Requires: Gmail App Password configured in `application.properties`
- Confirmation email contains a link with a UUID token: `http://localhost:8080/api/auth/confirm?token={uuid}`
- Token expires after 24 hours (FR-006)

**Alternatives considered**:
- SendGrid/Mailgun: Production-grade but overkill for local dev
- MailHog (local mock): Good for testing but user wants real emails sent

---

## R-004: XP-to-Level Curve

**Decision**: Exponential curve: XP needed = `level^2 * 10`

**Rationale**: Simple formula that provides increasing XP requirements per level, creating a natural progression slowdown. At early levels, leveling is fast (encouraging engagement); at higher levels it takes more battles.

| Level | XP Needed | Cumulative XP | Approx. Battles (vs Lv1) |
|-------|-----------|---------------|--------------------------|
| 2     | 40        | 40            | ~7 battles               |
| 3     | 90        | 130           | ~15 battles              |
| 4     | 160       | 290           | ~27 battles              |
| 5     | 250       | 540           | ~42 battles              |
| 10    | 1000      | 3850          | ~167 battles             |
| 15    | 2250      | 12100         | ~375 battles             |
| 20    | 4000      | 28500         | ~667 battles             |

**Alternatives considered**:
- Linear (level * 20): Too fast at high levels
- Fibonacci-based: Harder to calculate, similar curve
- Fixed 100 XP per level: No scaling, poor long-term engagement

---

## R-005: Hero Stats for Shop Heroes

**Decision**: Stats balanced by cost tier — cheap heroes are weaker, expensive heroes have higher stats and growth.

**Design principles**:
- Higher cost = higher total base stats + higher total growth
- Each hero has a "specialty" (1-2 stats significantly higher than others)
- Capacity roughly correlates with power level
- Konohamaru-Genin (starter, 5 cap, free) is the baseline

### Hero Stat Table

| Hero | Cost | Cap | PA (growth) | MP (growth) | Dex (growth) | Elem (growth) | Mana (growth) | Stam (growth) | Specialty |
|------|------|-----|-------------|-------------|--------------|---------------|---------------|---------------|-----------|
| Konohamaru-Genin | free | 5 | 5 (+0.8) | 8 (+1.0) | 3 (+0.2) | 2 (+0.7) | 20 (+1.0) | 10 (+1.0) | Balanced starter |
| Sakura | 200g | 8 | 4 (+0.5) | 12 (+1.5) | 4 (+0.3) | 5 (+1.0) | 30 (+1.5) | 12 (+1.2) | Magic/Mana healer |
| Hidan | 400g | 10 | 14 (+1.5) | 3 (+0.3) | 5 (+0.5) | 2 (+0.3) | 15 (+0.8) | 18 (+1.8) | Physical brute |
| Konan | 400g | 10 | 6 (+0.7) | 10 (+1.2) | 8 (+0.8) | 6 (+0.8) | 22 (+1.2) | 12 (+1.0) | Balanced mid-tier |
| Kabuto | 400g | 15 | 7 (+0.8) | 14 (+1.6) | 6 (+0.5) | 8 (+1.2) | 28 (+1.5) | 14 (+1.2) | Magic/Element |
| Kakashi | 400g | 15 | 12 (+1.3) | 11 (+1.3) | 9 (+0.9) | 7 (+0.9) | 25 (+1.3) | 15 (+1.3) | All-rounder |
| Deidara | 400g | 20 | 8 (+0.9) | 16 (+1.8) | 5 (+0.4) | 12 (+1.5) | 32 (+1.8) | 10 (+0.8) | Explosive magic |
| Minato | 2000g | 30 | 15 (+1.6) | 14 (+1.5) | 14 (+1.4) | 10 (+1.2) | 30 (+1.5) | 20 (+1.8) | Speed/power elite |
| Hashirama | 2000g | 30 | 16 (+1.7) | 16 (+1.7) | 8 (+0.8) | 12 (+1.4) | 35 (+2.0) | 22 (+2.0) | Tank/magic elite |

### Summon Stat Table

| Summon | Cost | Cap | Mana (growth) | MP (growth) | Bonus Applied |
|--------|------|-----|---------------|-------------|---------------|
| Susanoo-Spirit-Summon | 300g | 15 | 10 (+5) | 5 (+4) | +MP to all team heroes |

---

## R-006: Items Catalog (Starter Set)

**Decision**: 10 starter items across 3 stat-focus categories, priced at 3 tiers.

**Design principles**:
- Items boost 1-2 stats each
- 3 price tiers: 100g (basic), 300g (mid), 600g (premium)
- Items affect battle-relevant stats (PA, MP, Dex, Stam primarily)

| Item | Cost | Stat Bonuses | Category |
|------|------|-------------|----------|
| Training Weights | 100g | +3 PA | Physical |
| Iron Kunai | 100g | +2 PA, +1 Dex | Physical |
| Chakra Scroll | 100g | +3 MP | Magic |
| Mana Crystal | 100g | +5 Mana | Magic |
| Swift Boots | 100g | +3 Dex | Speed |
| Warrior Armor | 300g | +6 PA, +4 Stam | Physical |
| Mystic Tome | 300g | +6 MP, +8 Mana | Magic |
| Shadow Cloak | 300g | +5 Dex, +3 Stam | Speed |
| Legendary Blade | 600g | +12 PA, +5 Dex | Physical |
| Sage Staff | 600g | +12 MP, +12 Mana | Magic |

---

## R-007: Abilities Catalog (Placeholder)

**Decision**: 4 abilities per hero at price tiers 50g, 200g, 400g, 800g. Each ability boosts specific stats.

**Note**: The user will rename and rebalance these manually. Names are placeholders.

| Hero | Ability 1 (50g) | Ability 2 (200g) | Ability 3 (400g) | Ability 4 (800g) |
|------|------------------|-------------------|-------------------|-------------------|
| Konohamaru-Genin | +2 PA | +3 MP, +2 Dex | +5 PA, +3 Stam | +8 MP, +5 Mana |
| Sakura | +3 MP | +5 Mana, +2 MP | +6 MP, +4 Stam | +10 MP, +8 Mana |
| Hidan | +3 PA | +4 PA, +3 Stam | +8 PA, +2 Dex | +12 PA, +6 Stam |
| Konan | +2 Dex | +3 MP, +3 Dex | +5 MP, +5 Dex | +8 MP, +6 Dex, +4 Stam |
| Kabuto | +3 MP | +4 MP, +3 Elem | +7 MP, +5 Mana | +10 MP, +8 Elem |
| Kakashi | +2 PA, +1 Dex | +4 PA, +3 MP | +6 PA, +5 MP | +9 PA, +8 MP, +4 Dex |
| Deidara | +3 Elem | +5 MP, +3 Elem | +8 MP, +6 Elem | +12 MP, +10 Elem |
| Minato | +3 Dex | +5 PA, +4 Dex | +8 PA, +6 Dex | +12 PA, +10 Dex, +5 Stam |
| Hashirama | +3 Stam | +5 MP, +4 Stam | +8 MP, +8 Stam | +12 MP, +10 Stam, +8 Mana |

---

## R-008: Energy Regeneration Implementation

**Decision**: Timestamp-based calculation (not real-time ticks)

**Rationale**: Instead of running a background timer/scheduler that ticks every 10 minutes for every player, store the timestamp of when energy was last calculated. On each request that reads energy, compute how many 10-minute intervals have passed since the last update, add the earned energy (capped at 120), and update the timestamp. This is efficient, accurate, and works even when the server restarts.

**Formula**: `current_energy = min(120, stored_energy + floor((now - last_update) / 10 minutes))`

**Alternatives considered**:
- Scheduled task (cron): Unnecessary load, scales poorly with many players
- WebSocket push: Over-engineered for this phase; frontend can poll or calculate client-side

---

## R-009: Frontend State Management

**Decision**: React Context for global state (auth, player data) + local component state for UI

**Rationale**: The app has limited global state needs (logged-in player info, energy, gold). React Context is sufficient and avoids adding a state management library. Component-level state handles form inputs, modals, and UI interactions.

**Key contexts**:
- `AuthContext`: JWT token, player info, login/logout actions
- `PlayerContext`: Gold, diamonds, energy values, online status (refreshed on API calls)

**Alternatives considered**:
- Redux: Over-engineered for current scope; adds boilerplate
- Zustand: Simpler than Redux but still an extra dependency not yet needed
- React Query/TanStack Query: Good for server state caching; can be added later if needed

---

## R-010: Frontend Routing & Page Structure

**Decision**: React Router v6 with route-based code organization

**Pages**:
- `/login` — Login page
- `/register` — Registration page
- `/confirm` — Email confirmation landing
- `/team` — Team lineup management (default dashboard)
- `/shop` — Hero and item shop
- `/arena` — Arena opponent list, battle log, fight
- `/battle/:id` — Battle result/log view
- `/hero/:id` — Hero detail (stats, equipment, abilities)

**Protected routes**: All pages except `/login`, `/register`, `/confirm` require authentication.
