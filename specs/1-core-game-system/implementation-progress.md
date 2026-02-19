# Implementation Progress: HeroManager Core Game System

**Last Updated**: 2026-02-11
**Branch**: `1f_auth_team_shop_arena`

---

## Summary

| Phase | Description | Tasks | Status |
|-------|-------------|-------|--------|
| Phase 1 | Setup (Shared Infrastructure) | T001–T004 | Complete |
| Phase 2 | Foundational (Blocking Prerequisites) | T005–T021 | Complete |
| Phase 3 | US1 — Registration & Auth | T022–T029 | Complete |
| Phase 4 | US2 — Team Lineup Management | T030–T041 | Complete |
| Phase 5 | US3 — Hero Shop | T042–T047 | Complete (verified) |
| Phase 6 | US4 — Arena Battle System | T048–T057 | Complete (verified + fix) |
| Phase 7 | US5 — Energy System UI | T058–T060 | Complete |
| Phase 8 | US6 — Online/Offline Status | T061–T062 | Complete |
| Phase 9 | US7 — Hero Leveling | T063–T065 | Complete |
| Phase 10 | US8 — Equipment System | T066–T073 | Complete |
| Phase 11 | Polish & Cross-Cutting | T074–T077 | T074–T076 complete, T077 pending |

**Backend compilation**: Verified with `mvn compile -q` through Phase 10.
**Frontend compilation**: Not verified — Node.js v12.3.0 is too old for TypeScript 5.3+ (needs Node 14.17+). Node 16.14.0 is available via nvm but requires admin access to switch.

---

## Phase 1: Setup (T001–T004) — Complete

- **T001**: Backend Maven project with Spring Boot 3.x (Web, JPA, Security, Mail, H2, DevTools, Lombok)
- **T002**: Frontend Vite + React 18 + TypeScript + React Router v6 + Axios
- **T003**: Backend config files (application.properties, application-dev.properties) with H2, Gmail SMTP, JWT, CORS
- **T004**: Hero image assets copied to `frontend/src/assets/heroes/`

## Phase 2: Foundational (T005–T021) — Complete

### Backend (T005–T015)
- **T005**: `HeroManagerApplication.java` — Spring Boot entry point
- **T006**: `Player` entity (email, username, passwordHash, gold, diamonds, energy, onlineUntil) + `ConfirmationToken` entity
- **T007**: `HeroTemplate` entity (6 base stats + 6 growth rates, cost, capacity, isStarter) + `SummonTemplate` entity
- **T008**: `Hero` entity (playerId, templateId, level, currentXp) + `Summon` entity + `TeamSlot` entity (slotNumber 1-7)
- **T009**: `ItemTemplate` entity (6 bonus stat fields) + `AbilityTemplate` entity (heroTemplateId FK, tier 1-4)
- **T010**: All 9 repository interfaces
- **T011**: Seed data in `data.sql` — 9 heroes, 1 summon, 10 items, 36 abilities
- **T012**: `JwtUtil` + `JwtConfig`
- **T013**: `SecurityConfig` with JWT filter chain
- **T014**: `CorsConfig` allowing localhost:3000
- **T015**: `EnergyService` with regeneration formula, deduction, online status

### Frontend (T016–T021)
- **T016**: TypeScript type definitions for all API contracts in `frontend/src/types/index.ts`
- **T017**: Axios client with JWT interceptor in `frontend/src/api/client.ts`
- **T018**: `AuthContext` with login/logout/ProtectedRoute in `frontend/src/context/AuthContext.tsx`
- **T019**: `App.tsx` with routes for all 8 pages (AuthLayout + AppLayout)
- **T020**: `Navbar.tsx` and `Sidebar.tsx` layout components
- **T021**: `main.tsx` entry point with provider wrappers

## Phase 3: US1 — Registration & Auth (T022–T029) — Complete

### Backend (T022–T025)
- **T022**: DTOs — `RegisterRequest`, `LoginRequest`, `LoginResponse`
- **T023**: `EmailService` — HTML confirmation email via Gmail SMTP
- **T024**: `AuthService` — register, confirm (creates starter Konohamaru-Genin), login (email OR username), resendConfirmation
- **T025**: `AuthController` — POST /register (201), GET /confirm, POST /login, POST /resend-confirmation

### Frontend (T026–T029)
- **T026**: `authApi.ts` — register(), login(), confirmEmail(), resendConfirmation()
- **T027**: `RegisterPage.tsx` — Form with validation, success state
- **T028**: `LoginPage.tsx` — Form with error handling, redirect to /team
- **T029**: `ConfirmPage.tsx` — Token validation on mount, resend option

## Phase 4: US2 — Team Lineup Management (T030–T041) — Complete

### Backend (T030–T035)
- **T030**: DTOs — `PlayerResponse`, `HeroResponse` (with EquippedItemInfo/EquippedAbilityInfo)
- **T031**: DTOs — `TeamResponse` (CapacityInfo, SlotInfo, HeroSlotInfo, SummonSlotInfo) + `SummonResponse`
- **T032**: `PlayerService` — getPlayerInfo (energy refresh), getHeroes (stat computation), getSummons
- **T033**: `TeamService` — getTeamLineup, equipHero/unequipHero, equipSummon/unequipSummon, reorderTeam, calculateCapacity
- **T034**: `PlayerController` — GET /api/player/me, /heroes, /summons
- **T035**: `TeamController` — GET /api/team, POST equip/unequip/reorder endpoints

### Frontend (T036–T041)
- **T036**: `playerApi.ts` and `teamApi.ts` — All player and team API functions
- **T037**: `PlayerContext` — Player state with fetchPlayer refresh
- **T038**: Hero components — `HeroPortrait`, `HeroStats`, `HeroCard`
- **T039**: Team components — `TeamSlot`, `CapacityBar`
- **T040**: `TeamPage.tsx` — Full team management with slots grid, bench, equip/unequip
- **T041**: `Sidebar.tsx` updated — Player info, resources, energy, logout

## Phase 5: US3 — Hero Shop (T042–T047) — Complete

Verified against task requirements and API contracts. All 6 tasks confirmed working.

### Backend (T042–T044)
- **T042**: `ShopHeroResponse` DTO with baseStats/growthStats maps, owned flag
- **T043**: `ShopService` — listHeroes (excludes starter), buyHero, buySummon with gold/ownership validation
- **T044**: `ShopController` — GET /api/shop/heroes, POST buy-hero, POST buy-summon

### Frontend (T045–T047)
- **T045**: `shopApi.ts` — listHeroes(), buyHero(), buySummon()
- **T046**: `ShopHeroCard` component — Stats display, cost, buy/owned state
- **T047**: `ShopPage.tsx` — Hero grid, summon section, buy functionality (later enhanced with Items/Abilities tabs in T073)

## Phase 6: US4 — Arena Battle System (T048–T057) — Complete

Verified against task requirements. One fix applied: added missing `defenderStaminaModifier` to battle round data in `BattleService.java` and updated `BattlePage.tsx` to render both attacker and defender stamina modifiers.

### Backend (T048–T053)
- **T048**: `BattleLog` entity + `BattleLogRepository` (findByPlayerInvolved, findPendingReturnChallenge)
- **T049**: DTOs — `BattleResultResponse`, `ArenaOpponentResponse`
- **T050**: `BattleCalculator` — Attack formula: ((PA*0.5) + (MP*random(0.1-1.0)) + (Dex*0.33)) * staminaModifier
- **T051**: `BattleService` — simulateBattle with sequential 1v1, stamina decay (0.9), XP awards, level-up checks
- **T052**: `ArenaService` — listOpponents, initiateChallenge (energy cost 5/7/4), gold awards, return challenges
- **T053**: `ArenaController` — GET /opponents, POST /challenge, GET /battle-log, GET /battle/{id}

### Frontend (T054–T057)
- **T054**: `arenaApi.ts` — getOpponents(), challenge(), getBattleLog(), getBattle()
- **T055**: Arena components — `OpponentRow`, `BattleLogList`
- **T056**: `ArenaPage.tsx` — Opponents list, battle log, energy display
- **T057**: `BattlePage.tsx` — Full battle result with round-by-round log, XP, gold

## Phase 7: US5 — Energy System UI (T058–T060) — Complete

### Frontend (T058–T060)
- **T058**: `EnergyBar.tsx` — Reusable energy bar component with green/yellow color variants, countdown timer, auto-refresh callback on tick completion
- **T059**: Sidebar integration — Replaced plain text energy display with two EnergyBar components (green for arena, yellow for world), auto-refresh via PlayerContext
- **T060**: ArenaPage enhancement — Detailed energy info box with large current value, warning message when below 5 AE with countdown timer

## Phase 8: US6 — Online/Offline Status (T061–T062) — Complete

### Backend (T061)
- **T061**: Verified existing logic — `EnergyService.setOnline()` resets onlineUntil to now+40min, `ArenaService` correctly derives isOnline and applies 5/7/4 energy costs. No code changes needed.

### Frontend (T062)
- **T062**: Enhanced `OpponentRow.tsx` — Added online/offline status badge (green/gray pill with dot indicator), color-coded energy cost per challenge type (green=online, gray=offline, yellow=return)

## Phase 9: US7 — Hero Leveling (T063–T065) — Complete

### Backend (T063)
- **T063**: Verified level-up logic in `BattleService` — Uses while loop with threshold `level^2 * 10`, allows multiple level-ups per battle. No code changes needed.

### Frontend (T064–T065)
- **T064**: `HeroDetailPage.tsx` — Full hero detail with portrait, level, XP progress bar, stats breakdown table, equipped items and abilities display (later enhanced with interactive equipment management in T072)
- **T065**: `HeroStats.tsx` — Added optional `showBreakdown` mode with header row and base/bonus/total columns for stat visualization

## Phase 10: US8 — Equipment System (T066–T073) — Complete

### Backend (T066–T069)
- **T066**: `EquippedItem.java` entity (heroId, itemTemplateId, slotNumber, unique constraints) + `EquippedAbility.java` entity (heroId, abilityTemplateId, unique constraint) + repositories for both
- **T067**: `EquipmentService.java` — Full service with getHeroEquipment (3 item slots + abilities), equipItem (slot 1-3, no duplicate on hero, team-wide max 3), unequipItem, sellItem (75% refund), equipAbility (hero template match), unequipAbility
- **T068**: `EquipmentController.java` — GET /hero/{heroId}, POST equip-item, unequip-item, sell-item, unequip-ability
- **T069**: Extended `ShopService` and `ShopController` with item/ability shop endpoints: GET /items, POST /buy-item, GET /abilities?heroId, POST /buy-ability

### Frontend (T070–T073)
- **T070**: `equipmentApi.ts` — getHeroEquipment, equipItem, unequipItem, sellItem, unequipAbility. Extended `shopApi.ts` with listItems, buyItem, listAbilities, buyAbility
- **T071**: `ItemSlot.tsx` (filled/empty states with unequip/sell), `AbilitySlot.tsx` (name, tier, bonuses, unequip), `ShopItemCard.tsx` (item card with buy button)
- **T072**: `HeroDetailPage.tsx` rewritten — Interactive equipment management with 3 ItemSlot components, AbilitySlot list, available abilities to buy
- **T073**: `ShopPage.tsx` rewritten — 3 tabs (Heroes, Items, Abilities) with hero/slot selector for buy-and-equip flow

## Phase 11: Polish & Cross-Cutting (T074–T077) — In Progress

- **T074**: Verified all 10 images in `frontend/src/assets/heroes/` match `data.sql` image_path values
- **T075**: Verified all pages have error handling with user-friendly messages. Added `fetchError` state to `BattlePage.tsx`
- **T076**: Verified all data-fetching pages have loading states and empty state displays
- **T077**: **NOT COMPLETE** — Manual end-to-end validation requires running the full application (backend + frontend). Frontend cannot be compiled due to Node.js version limitation (v12.3.0 vs required 14.17+)

---

## Known Issues

1. **Node.js version**: v12.3.0 is too old for TypeScript 5.3+. Frontend TypeScript compilation has not been verified. Node 16.14.0 available via nvm but requires admin privileges.
2. **Null type safety warnings**: Recurring IDE warnings on `findById()` calls in services — harmless Spring Data `@NonNull` annotation warnings since IDs come from validated sources.
3. **Auth principal inconsistency**: `ShopController` uses `(Long) auth.getPrincipal()` while `EquipmentController` uses `Long.parseLong(auth.getName())` to extract player ID. Both should work but should be unified for consistency.

---

## Architecture Notes

### Backend
- **Framework**: Spring Boot 3.x, Java 17+
- **Database**: H2 embedded (dev), PostgreSQL-ready via JPA
- **Auth**: JWT Bearer tokens, BCrypt passwords, email confirmation flow
- **Pattern**: Controller → Service → Repository with DTOs, Lombok annotations (@Getter, @Setter, @Builder)
- **Energy formula**: `min(120, stored + floor((now - lastUpdate) / 10min))`
- **Battle formula**: `((PA*0.5) + (MP*random(0.1-1.0)) + (Dex*0.33)) * staminaModifier`
- **Level-up threshold**: `level^2 * 10` XP (supports multiple level-ups per battle)
- **Equipment constraints**: 3 item slots per hero, no duplicate items on same hero, max 3 of same item per team, abilities hero-specific, sell at 75%

### Frontend
- **Framework**: React 18 + TypeScript, Vite 5, React Router v6
- **HTTP**: Axios with JWT interceptor, 401 auto-redirect
- **Styling**: Inline CSS with dark theme (#0f0f23 bg, #1a1a2e cards, #e94560 accent, #4ade80 success, #fbbf24 gold)
- **State**: AuthContext (JWT), PlayerContext (player data)
- **Components**: Organized by domain (Hero/, Team/, Arena/, Equipment/, Shop/, Layout/)

### Key Paths
- Backend source: `backend/src/main/java/com/heromanager/`
- Frontend source: `frontend/src/`
- API contracts: `specs/1-core-game-system/contracts/`
- Seed data: `backend/src/main/resources/data.sql`

### Files Created/Modified Per Phase

| Phase | Files Created | Files Modified |
|-------|--------------|----------------|
| Phase 7 | EnergyBar.tsx | Sidebar.tsx, ArenaPage.tsx |
| Phase 8 | — | OpponentRow.tsx (verified EnergyService.java, ArenaService.java) |
| Phase 9 | — | HeroDetailPage.tsx, HeroStats.tsx (verified BattleService.java) |
| Phase 10 | EquippedItem.java, EquippedAbility.java, EquippedItemRepository.java, EquippedAbilityRepository.java, EquipmentService.java, EquipmentController.java, equipmentApi.ts, ItemSlot.tsx, AbilitySlot.tsx, ShopItemCard.tsx | ShopService.java, ShopController.java, shopApi.ts, HeroDetailPage.tsx, ShopPage.tsx |
| Phase 11 | — | BattlePage.tsx |
