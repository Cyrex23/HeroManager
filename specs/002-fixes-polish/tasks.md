# Tasks: Core Game Fixes & Polish

**Input**: Design documents from `/specs/002-fixes-polish/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No automated tests (per project constitution — manual testing only).

**Organization**: Tasks are grouped by user story. Phase 1 contains shared backend fixes that unblock US1, US2, and US4 simultaneously.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Foundational Backend Fixes (Blocking — US1, US2, US4)

**Purpose**: Fix the backend root causes (R-001) that block team page, bench heroes, and abilities dropdown. All three user stories share the same underlying failures: missing `@Transactional`, null safety on lazy-loaded templates, and boolean serialization.

**⚠️ CRITICAL**: US1, US2, and US4 cannot function until this phase is complete.

- [x] T001 [P] [US1] Add `@Transactional(readOnly = true)` to `PlayerService.getHeroes()` and `PlayerService.getSummons()` in `backend/src/main/java/com/heromanager/service/PlayerService.java`. Add null check on `hero.getTemplate()` — skip heroes with null templates instead of NPE.
- [x] T002 [P] [US1] Add `@Transactional(readOnly = true)` to `TeamService.getTeamLineup()` in `backend/src/main/java/com/heromanager/service/TeamService.java`. Add null checks on `hero.getTemplate()` and `summon.getTemplate()` — skip slots with missing entity references gracefully.
- [x] T003 [P] [US1] Add `@JsonProperty("isEquipped")` to the `isEquipped` field in `backend/src/main/java/com/heromanager/dto/HeroResponse.java` to fix Jackson boolean serialization name mangling.

**Checkpoint**: Backend API endpoints `/api/player/heroes`, `/api/player/summons`, and `/api/team` return correct data without NPEs. Team page, bench heroes, and abilities dropdown should now load.

---

## Phase 2: US1 + US2 — Team Page & Starter Hero (Priority: P1) 🎯 MVP

**Goal**: Team page loads correctly showing equipped heroes, bench heroes, and the starter hero (Konohamaru-Genin) in slot 1 for new players.

**Independent Test**: Register a new account, confirm email, log in. Navigate to Team page — Konohamaru-Genin appears in slot 1. Buy a hero from shop, return to Team — new hero appears in bench.

**Note**: US2 (starter hero) requires no code fix — research R-003 confirmed the starter hero creation logic is correct. Fixing the team page (Phase 1) and confirmation flow (Phase 3) makes it visible. US1 is resolved by Phase 1 backend fixes plus the frontend improvement below.

### Implementation

- [x] T004 [US1] Improve error handling in `frontend/src/pages/TeamPage.tsx` — add `console.error` logging in the catch block (line 32) to log which API call failed and the error details, aiding future debugging.

**Checkpoint**: Team page loads successfully for all players. Starter hero visible for new confirmed accounts. Bench heroes show after purchase.

---

## Phase 3: US3 — Email Confirmation Success Feedback (Priority: P1)

**Goal**: Confirmation page shows clear success message on first use and "already confirmed" on repeat visits — never a confusing error.

**Independent Test**: Register a new account, click confirmation link → see "Email confirmed successfully!" with login link. Click the same link again → see "Your email is already confirmed" (not an error).

### Implementation

- [x] T005 [US3] Make `AuthService.confirm()` idempotent in `backend/src/main/java/com/heromanager/service/AuthService.java`. When `confirmedAt` is already set AND the player is confirmed, return success with an `alreadyConfirmed` flag instead of throwing an error. See contract: `specs/002-fixes-polish/contracts/auth-api-changes.md`.
- [x] T006 [US3] Update confirm endpoint in `backend/src/main/java/com/heromanager/controller/AuthController.java` to return the `alreadyConfirmed` flag in the 200 response. New confirmation returns `{ "message": "Email confirmed successfully! You can now log in.", "alreadyConfirmed": false }`. Already-confirmed returns `{ "message": "Your email is already confirmed. You can log in.", "alreadyConfirmed": true }`.
- [x] T007 [US3] Add `useRef` guard in `frontend/src/pages/ConfirmPage.tsx` to prevent React StrictMode double-effect from calling `confirmEmail(token)` twice. Handle `alreadyConfirmed` response — show "already confirmed" as a success-like state (green text, login link), not an error.

**Checkpoint**: Confirmation page shows correct success/already-confirmed messages. No confusing "already used" errors.

---

## Phase 4: US4 — Shop Abilities Hero Dropdown (Priority: P1)

**Goal**: Abilities tab dropdown shows all owned heroes so players can buy hero-specific abilities.

**Independent Test**: Log in with multiple owned heroes. Navigate to Shop > Abilities tab. Verify dropdown lists all owned heroes. Select a hero, confirm abilities display.

**Note**: Research R-004 confirmed this is entirely resolved by Phase 1 backend fixes (`getHeroes()` API was failing). No separate code change needed — this phase is verification only.

### Implementation

- [x] T008 [US4] Verify Shop Abilities hero dropdown works after Phase 1 fixes. Navigate to Shop > Abilities, confirm owned heroes appear in the dropdown, and selecting a hero loads matching abilities. No code changes expected.

**Checkpoint**: All P1 bugs resolved. Core gameplay (team management, hero purchasing, ability shopping, email confirmation) fully functional.

---

## Phase 5: US5 — Login Grants Online Status (Priority: P2)

**Goal**: Players who log in after 3+ hours of inactivity receive 20 minutes of online status for arena visibility.

**Independent Test**: Log in after being offline for 3+ hours (or with a fresh account). Check arena — player appears as "Online" with 5 AE challenge cost.

### Implementation

- [x] T009 [US5] Add online status grant logic to `AuthService.login()` in `backend/src/main/java/com/heromanager/service/AuthService.java`. After password validation, check `player.getOnlineUntil()`. If null or more than 3 hours in the past, set `onlineUntil = now + 20 minutes` and save. If `onlineUntil` is within the last 3 hours (player recently active), do not override. See contract: `specs/002-fixes-polish/contracts/auth-api-changes.md`.

**Checkpoint**: Login-based online status works. Fresh/inactive players appear online in arena for 20 minutes after login.

---

## Phase 6: US6 — Hexagonal Growth Stats Diagram (Priority: P2)

**Goal**: SVG radar chart component for hero stats, displayed on shop cards and hero detail pages.

**Independent Test**: Navigate to Shop, view a hero card — compact hex diagram with 6 labeled stat vertices. Navigate to hero detail page — larger hex diagram with same data.

### Implementation

- [x] T010 [US6] Create `HexStatDiagram.tsx` in `frontend/src/components/Hero/HexStatDiagram.tsx`. Props: `stats` (6 base values), `growthStats` (6 growth rates), `size` (diameter, default 240), `maxValue` (default 40). Render SVG with: hexagonal frame (gray guidelines), filled polygon (semi-transparent gold #fbbf24 at 20% opacity, gold stroke), stat labels at each vertex showing "{name} {value} +{growth}". Vertex order clockwise from top: Physical Attack, Magic Power, Dexterity, Element, Mana, Stamina. See research: `specs/002-fixes-polish/research.md` R-006.
- [x] T011 [US6] Integrate `HexStatDiagram` into `frontend/src/pages/ShopPage.tsx` (or `frontend/src/components/Shop/ShopHeroCard.tsx`) — compact version (180px diameter) on hero cards, replacing or supplementing existing stat display.
- [x] T012 [US6] Integrate `HexStatDiagram` into `frontend/src/pages/HeroDetailPage.tsx` — full-size version (240px diameter) in the hero stats section.

**Checkpoint**: Hexagonal diagrams render correctly for all 9 hero templates with accurate stat representation.

---

## Phase 7: Polish & Validation

**Purpose**: Final verification across all user stories.

- [x] T013 Run full quickstart.md validation (`specs/002-fixes-polish/quickstart.md`) — verify all 6 user stories end-to-end: confirmation flow, starter hero, team page, shop abilities dropdown, login online status, hex diagram.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately. **BLOCKS** Phases 2, 3, 4.
- **Phase 2 (US1+US2)**: Depends on Phase 1. Frontend improvement only.
- **Phase 3 (US3)**: Backend tasks (T005, T006) can start in parallel with Phase 1. Frontend task (T007) can also start in parallel. No dependency on Phase 1.
- **Phase 4 (US4)**: Verification only — depends on Phase 1 completion.
- **Phase 5 (US5)**: Independent — can start in parallel with any phase.
- **Phase 6 (US6)**: Independent — can start in parallel with any phase.
- **Phase 7 (Polish)**: Depends on all previous phases.

### Parallel Opportunities

- **Within Phase 1**: T001, T002, T003 are all in different files — run in parallel.
- **Cross-phase**: Phase 3 (US3), Phase 5 (US5), and Phase 6 (US6) are independent of Phase 1 and each other — can run in parallel.
- **Within Phase 6**: T010 must complete before T011/T012 (component needed first). T011 and T012 are in different files — run in parallel after T010.

### Critical Path

Phase 1 (T001-T003) → Phase 2 (T004) + Phase 4 (T008) → Phase 7 (T013)

### Parallel Path

Phase 3 (T005-T007) | Phase 5 (T009) | Phase 6 (T010→T011+T012) — all can run alongside the critical path.

---

## Implementation Strategy

### MVP First (P1 Bugs Only — Phases 1-4)

1. Complete Phase 1: Foundational backend fixes (3 tasks, all parallel)
2. Complete Phase 2: Team page error logging (1 task)
3. Complete Phase 3: Confirmation flow fix (3 tasks)
4. Complete Phase 4: Verify abilities dropdown (1 task)
5. **STOP and VALIDATE**: All P1 bugs resolved — core gameplay functional

### Full Delivery (Add P2 Enhancements — Phases 5-6)

6. Complete Phase 5: Login online status (1 task)
7. Complete Phase 6: Hexagonal diagram (3 tasks)
8. Complete Phase 7: Full validation

---

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 13 |
| P1 bug fix tasks | 8 (T001-T008) |
| P2 enhancement tasks | 4 (T009-T012) |
| Validation tasks | 1 (T013) |
| Max parallel tasks | 3 (within Phase 1) |
| Files modified | 8 (5 backend, 3 frontend) |
| Files created | 1 (HexStatDiagram.tsx) |

---

## Notes

- [P] tasks = different files, no dependencies
- US2 (starter hero) and US4 (abilities dropdown) require no separate code fixes — resolved by Phase 1 backend fixes
- No automated tests per project constitution — all verification is manual per quickstart.md
- No schema/migration changes — all fixes are code-level behavior changes
