# Tasks: HeroManager Core Game System

**Input**: Design documents from `specs/1-core-game-system/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, research.md, contracts/, quickstart.md

**Tests**: No automated tests — manual testing only (per project requirements).

**Organization**: Tasks grouped by user story (8 stories: 4×P1, 4×P2) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story (US1–US8) — only in user story phases
- All file paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize backend and frontend project structures

- [x] T001 Create backend Maven project with Spring Boot 3.x dependencies (Web, Data JPA, Security, Mail, H2, DevTools, Lombok) in backend/pom.xml and full directory structure per plan.md
- [x] T002 [P] Create frontend project with Vite, React 18, TypeScript, React Router v6, and Axios in frontend/ with package.json, vite.config.ts, and tsconfig.json
- [x] T003 [P] Create backend configuration files (application.properties and application-dev.properties) with H2 database, Gmail SMTP, JWT, and CORS settings in backend/src/main/resources/
- [x] T004 [P] Copy hero image assets from Heroes/ directory to frontend/src/assets/heroes/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entities, security, seed data, and frontend scaffold that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create HeroManagerApplication.java Spring Boot entry point in backend/src/main/java/com/heromanager/HeroManagerApplication.java
- [x] T006 [P] Create Player entity (id, email, username, passwordHash, emailConfirmed, gold, diamonds, arenaEnergy, worldEnergy, lastEnergyUpdate, onlineUntil, createdAt) and ConfirmationToken entity (id, token, playerId, expiresAt, confirmedAt) in backend/src/main/java/com/heromanager/entity/
- [x] T007 [P] Create HeroTemplate entity (all 6 base stats + 6 growth rates, cost, capacity, imagePath, isStarter) and SummonTemplate entity (baseMana, baseMp, growthMana, growthMp, cost, capacity) in backend/src/main/java/com/heromanager/entity/
- [x] T008 [P] Create Hero entity (playerId, templateId, level, currentXp, unique constraint on playerId+templateId), Summon entity (playerId, templateId, level, currentXp), and TeamSlot entity (playerId, slotNumber 1-7, heroId, summonId) in backend/src/main/java/com/heromanager/entity/
- [x] T009 [P] Create ItemTemplate entity (name, cost, 6 bonus stat fields) and AbilityTemplate entity (name, heroTemplateId FK, cost, tier 1-4, 6 bonus stat fields) in backend/src/main/java/com/heromanager/entity/
- [x] T010 Create all repository interfaces (PlayerRepository, HeroRepository, HeroTemplateRepository, SummonRepository, SummonTemplateRepository, ItemTemplateRepository, AbilityTemplateRepository, TeamSlotRepository, ConfirmationTokenRepository) in backend/src/main/java/com/heromanager/repository/
- [x] T011 Create seed data with 9 hero templates (stats from research.md R-005), 1 summon template (Susanoo-Spirit-Summon), 10 item templates (from R-006), and 36 ability templates (4 per hero from R-007) in backend/src/main/resources/data.sql
- [x] T012 [P] Create JwtUtil (generateToken, validateToken, extractPlayerId, extractUsername) in backend/src/main/java/com/heromanager/util/JwtUtil.java and JwtConfig (@ConfigurationProperties for jwt.secret and jwt.expiration) in backend/src/main/java/com/heromanager/config/JwtConfig.java
- [x] T013 Create SecurityConfig with JWT authentication filter chain, permit /api/auth/** and /h2-console/**, require auth for all other endpoints in backend/src/main/java/com/heromanager/config/SecurityConfig.java
- [x] T014 [P] Create CorsConfig allowing http://localhost:3000 origin with all methods in backend/src/main/java/com/heromanager/config/CorsConfig.java
- [x] T015 Create EnergyService with calculateCurrentEnergy(player) using formula min(120, stored + floor((now - lastUpdate) / 10min)), deductEnergy(player, amount), and getNextTickSeconds(player) in backend/src/main/java/com/heromanager/service/EnergyService.java
- [x] T016 [P] Create TypeScript type definitions for all API request/response shapes (Player, Hero, Summon, Team, ShopHero, ArenaOpponent, BattleResult, Energy) in frontend/src/types/index.ts
- [x] T017 [P] Create Axios API client with baseURL http://localhost:8080/api, JWT Bearer token interceptor from localStorage, and 401 redirect to login in frontend/src/api/client.ts
- [x] T018 Create AuthContext with JWT token storage (localStorage), isAuthenticated state, login/logout actions, and ProtectedRoute wrapper component in frontend/src/context/AuthContext.tsx
- [x] T019 Create App.tsx with React Router v6 route definitions for all 8 pages (/login, /register, /confirm, /team, /shop, /arena, /battle/:id, /hero/:id) with ProtectedRoute wrapping in frontend/src/App.tsx
- [x] T020 [P] Create Layout shell components: Navbar (navigation links to Team, Shop, Arena) and Sidebar (player info placeholder) in frontend/src/components/Layout/Navbar.tsx and frontend/src/components/Layout/Sidebar.tsx
- [x] T021 Create main.tsx entry point wrapping App with AuthContext provider and BrowserRouter in frontend/src/main.tsx, and configure index.html with app title in frontend/index.html

**Checkpoint**: Backend starts with seed data loaded (verify via H2 console). Frontend starts and shows login page. JWT auth infrastructure ready.

---

## Phase 3: User Story 1 — Player Registration & Email Confirmation (Priority: P1) 🎯 MVP

**Goal**: New players can register, confirm email, and log in to receive starter account (Konohamaru-Genin, 500g, 120/120 energy)

**Independent Test**: Register account → check email → click confirmation link → log in → verify starter hero and resources

### Implementation for User Story 1

- [x] T022 [US1] Create RegisterRequest (email, username, password), LoginRequest (login, password), and LoginResponse (token, playerId, username) DTOs in backend/src/main/java/com/heromanager/dto/
- [x] T023 [US1] Create EmailService for sending HTML confirmation emails via Gmail SMTP with configurable confirmation URL template in backend/src/main/java/com/heromanager/service/EmailService.java
- [x] T024 [US1] Create AuthService with register (create unconfirmed player + generate UUID token + send email), confirm (validate token not expired, mark player confirmed, create starter Hero from Konohamaru-Genin template at level 1, equip to team slot 1), login (accept email or username, validate BCrypt password, check confirmed, return JWT), and resendConfirmation (regenerate token if unconfirmed) in backend/src/main/java/com/heromanager/service/AuthService.java
- [x] T025 [US1] Create AuthController with POST /api/auth/register (201), GET /api/auth/confirm?token={uuid} (200), POST /api/auth/login (200/401/403), POST /api/auth/resend-confirmation (200) per auth-api.md contract in backend/src/main/java/com/heromanager/controller/AuthController.java
- [x] T026 [P] [US1] Create authApi with register(), login(), confirm(token), resendConfirmation(email) functions calling backend endpoints in frontend/src/api/authApi.ts
- [x] T027 [P] [US1] Create RegisterPage with email, username, password form fields, validation, submit handler, success message prompting email check, and link to login in frontend/src/pages/RegisterPage.tsx
- [x] T028 [P] [US1] Create LoginPage with email/username and password form, error display for invalid credentials and unconfirmed account, and redirect to /team on success in frontend/src/pages/LoginPage.tsx
- [x] T029 [US1] Create ConfirmPage that reads token from URL query parameter, calls confirm API on mount, and displays success message with login link or error message with resend option in frontend/src/pages/ConfirmPage.tsx

**Checkpoint**: Full registration → email confirmation → login flow works. Player sees empty dashboard after login.

---

## Phase 4: User Story 2 — Team Lineup Management (Priority: P1)

**Goal**: Players can view and manage their team lineup (6 hero slots + 1 summon slot) with capacity enforcement (max 100)

**Independent Test**: Log in → view team with starter hero in slot 1 → equip/unequip heroes → verify capacity constraints (5/100 with starter)

### Implementation for User Story 2

- [x] T030 [US2] Create PlayerResponse (id, username, gold, diamonds, arenaEnergy, worldEnergy, nextEnergyTickSeconds, isOnline) and HeroResponse (id, templateId, name, imagePath, level, xp, xpToNextLevel, capacity, isEquipped, teamSlot, stats, bonusStats, equippedItems, equippedAbilities) DTOs in backend/src/main/java/com/heromanager/dto/
- [x] T031 [US2] Create TeamResponse (capacity used/max, teamPower, slots array with hero/summon details and totalStats) DTO in backend/src/main/java/com/heromanager/dto/TeamResponse.java
- [x] T032 [US2] Create PlayerService with getPlayerInfo (calculate energy via EnergyService, compute online status from onlineUntil), getHeroes (compute stats: base + growth*(level-1) for each stat, mark equipped/bench), getSummons (compute stats, mark equipped) in backend/src/main/java/com/heromanager/service/PlayerService.java
- [x] T033 [US2] Create TeamService with getTeamLineup (build 7 slots, compute totalStats including summon MP bonus, calculate teamPower as sum of all hero stats), equipHero (validate capacity <= 100, validate slot 1-6 empty, validate hero not already equipped), unequipHero, equipSummon (validate slot 7), unequipSummon, reorderTeam (rearrange hero IDs across slots 1-6) in backend/src/main/java/com/heromanager/service/TeamService.java
- [x] T034 [P] [US2] Create PlayerController with GET /api/player/me, GET /api/player/heroes, GET /api/player/summons per player-api.md contract in backend/src/main/java/com/heromanager/controller/PlayerController.java
- [x] T035 [US2] Create TeamController with GET /api/team, POST /api/team/equip-hero, POST /api/team/unequip-hero, POST /api/team/equip-summon, POST /api/team/unequip-summon, POST /api/team/reorder per team-api.md contract in backend/src/main/java/com/heromanager/controller/TeamController.java
- [x] T036 [P] [US2] Create playerApi (getMe, getHeroes, getSummons) and teamApi (getTeam, equipHero, unequipHero, equipSummon, unequipSummon, reorder) in frontend/src/api/playerApi.ts and frontend/src/api/teamApi.ts
- [x] T037 [US2] Create PlayerContext providing gold, diamonds, arenaEnergy, worldEnergy, isOnline state with fetchPlayer refresh function triggered on API calls in frontend/src/context/PlayerContext.tsx
- [x] T038 [P] [US2] Create Hero display components: HeroCard (portrait, name, level, stats summary), HeroPortrait (image/gif rendering at 180x200 base), HeroStats (6-stat list) in frontend/src/components/Hero/
- [x] T039 [P] [US2] Create Team display components: TeamSlot (empty/filled slot with equip/unequip action), CapacityBar (used/max capacity visual bar) in frontend/src/components/Team/
- [x] T040 [US2] Create TeamPage with 6 hero slots grid, 1 summon slot, bench roster list of unequipped heroes/summons, equip/unequip buttons, capacity bar, and team power display in frontend/src/pages/TeamPage.tsx
- [x] T041 [US2] Update Layout Sidebar to show player username, gold, diamonds, and basic energy display from PlayerContext in frontend/src/components/Layout/Sidebar.tsx

**Checkpoint**: Team page shows starter hero in slot 1, capacity 5/100. Can equip/unequip heroes between bench and lineup. Player info shown in sidebar.

---

## Phase 5: User Story 3 — Hero Shop (Priority: P1)

**Goal**: Players can browse and purchase heroes and summons using gold

**Independent Test**: Visit shop → see all 8 heroes + 1 summon with prices, portraits, and stats → buy Sakura (200g) → verify 300g remaining and Sakura in roster

### Implementation for User Story 3

- [x] T042 [US3] Create ShopHeroResponse DTO (templateId, name, displayName, imagePath, cost, capacity, baseStats, growthStats, owned flag) in backend/src/main/java/com/heromanager/dto/ShopHeroResponse.java
- [x] T043 [US3] Create ShopService with listHeroes (all templates with owned flag per player), listSummons (with owned flag), buyHero (check gold >= cost, check not already owned, deduct gold, create Hero at level 1), buySummon (same logic) in backend/src/main/java/com/heromanager/service/ShopService.java
- [x] T044 [US3] Create ShopController with GET /api/shop/heroes (returns heroes + summons with owned status), POST /api/shop/buy-hero, POST /api/shop/buy-summon per shop-api.md contract in backend/src/main/java/com/heromanager/controller/ShopController.java
- [x] T045 [P] [US3] Create shopApi with listHeroes(), buyHero(templateId), buySummon(templateId) in frontend/src/api/shopApi.ts
- [x] T046 [P] [US3] Create ShopHeroCard component showing hero portrait image/gif, name, gold cost, capacity, 6 base stats with growth rates, and buy button (disabled if owned or insufficient gold) in frontend/src/components/Shop/ShopHeroCard.tsx
- [x] T047 [US3] Create ShopPage with hero grid displaying all 8 shop heroes and summon section, buy buttons, current gold display, owned indicators, and insufficient gold messaging in frontend/src/pages/ShopPage.tsx

**Checkpoint**: Shop displays all 8 heroes + 1 summon with correct prices from research.md. Can buy heroes with gold deduction. Owned heroes shown as purchased.

---

## Phase 6: User Story 4 — Arena Battle System (Priority: P1)

**Goal**: Players can challenge opponents in sequential 1v1 hero battles, view text-based battle logs, and earn gold/XP rewards

**Independent Test**: Open arena → see opponents sorted by team power → challenge a player (5 AE) → view round-by-round battle log → verify gold earned and energy deducted

### Implementation for User Story 4

- [x] T048 [US4] Create BattleLog entity (challengerId, defenderId, winnerId, challengerGoldEarned, defenderGoldEarned, battleLog JSON text, energyCost, isReturnChallenge, returnChallengeUsed, createdAt) and BattleLogRepository in backend/src/main/java/com/heromanager/entity/BattleLog.java and backend/src/main/java/com/heromanager/repository/BattleLogRepository.java
- [x] T049 [US4] Create BattleResultResponse (battleId, result, goldEarned, energyCost, arenaEnergyRemaining, battleLog with rounds/xp/summonXp) and ArenaOpponentResponse (playerId, username, teamPower, isOnline, heroCount, hasPendingReturn, energyCost) DTOs in backend/src/main/java/com/heromanager/dto/
- [x] T050 [US4] Create BattleCalculator with calculateAttackNumber(hero, staminaModifier) using formula ((PA*0.5) + (MP*random(0.1-1.0)) + (Dex*0.33)) * staminaModifier, applying summon MP bonus and equipment bonuses to hero stats, with tie-breaking favoring the defender in backend/src/main/java/com/heromanager/util/BattleCalculator.java
- [x] T051 [US4] Create BattleService with simulateBattle(challengerTeam, defenderTeam) running sequential 1v1 confrontations (winner stays with 10% stamina decay: 1.0→0.9→0.81), building round-by-round JSON log, determining winner (team that runs out first loses), awarding gold (+2 win/+1 loss), awarding hero XP (4 + 2*enemyLevel per defeated enemy), awarding summon XP (+1 win/+0 loss), and checking level-ups (threshold: level^2 * 10) in backend/src/main/java/com/heromanager/service/BattleService.java
- [x] T052 [US4] Create ArenaService with listOpponents(playerId) excluding self sorted by teamPower descending with online status and energyCost (5 online/7 offline/4 return), initiateChallenge(challengerId, defenderId) with energy check, energy deduction via EnergyService, online status set (40 min), battle execution via BattleService, BattleLog creation, and getBattleLog(playerId) with return challenge eligibility in backend/src/main/java/com/heromanager/service/ArenaService.java
- [x] T053 [US4] Create ArenaController with GET /api/arena/opponents (paginated), POST /api/arena/challenge, GET /api/arena/battle-log (paginated), GET /api/arena/battle/{battleId} per arena-api.md contract in backend/src/main/java/com/heromanager/controller/ArenaController.java
- [x] T054 [P] [US4] Create arenaApi with getOpponents(page, size), challenge(defenderId), getBattleLog(page, size), getBattle(battleId) in frontend/src/api/arenaApi.ts
- [x] T055 [P] [US4] Create Arena components: OpponentRow (username, teamPower, online/offline indicator, energy cost badge, Fight button), BattleLogList (recent battles with opponent, result, gold earned, Return Challenge button), ChallengeButton (with energy cost display) in frontend/src/components/Arena/
- [x] T056 [US4] Create ArenaPage with opponent list sorted by team power, battle log section showing recent challenges with return challenge buttons (4 AE), current energy display, and empty team warning in frontend/src/pages/ArenaPage.tsx
- [x] T057 [US4] Create BattlePage displaying full battle result: both team lineups, round-by-round confrontation log (attacker hero vs defender hero, attack values, winner, stamina modifier), XP gained per hero, summon XP, gold earned, and link back to arena in frontend/src/pages/BattlePage.tsx

**Checkpoint**: Full arena battle flow works. Opponents listed with correct energy costs (5/7/4). Battle simulation produces detailed round log. Gold and XP awarded correctly. Return challenges functional.

---

## Phase 7: User Story 5 — Energy System (Priority: P2)

**Goal**: Display arena (green) and world (yellow) energy with real-time countdown timer and regeneration visualization

**Independent Test**: Spend energy on arena challenge → see energy decrease → watch timer count down → verify +1 energy at next tick → confirm cap at 120

### Implementation for User Story 5

- [x] T058 [US5] Create EnergyBar component displaying arena energy (green bar) and world energy (yellow bar) as current/max with countdown timer showing minutes:seconds to next +1 regeneration tick in frontend/src/components/Layout/EnergyBar.tsx
- [x] T059 [US5] Integrate EnergyBar into Layout Sidebar below player info, with client-side countdown timer between API refreshes and auto-refresh of PlayerContext when timer reaches zero in frontend/src/components/Layout/Sidebar.tsx
- [x] T060 [US5] Enhance ArenaPage to show detailed energy info: current arena energy, cost of next challenge, and "Next energy in X:XX" message when below threshold to challenge in frontend/src/pages/ArenaPage.tsx

**Checkpoint**: Energy bars visible on all authenticated pages. Green (arena) and yellow (world) with current/max. Timer counts down accurately. Energy caps at 120.

---

## Phase 8: User Story 6 — Online/Offline Status System (Priority: P2)

**Goal**: Players go online for 40 minutes when spending energy; arena shows online/offline status affecting challenge costs (5 vs 7 AE)

**Independent Test**: Spend energy → verify online status active → check arena shows you as online → wait 40+ min → verify offline → confirm energy costs change

### Implementation for User Story 6

- [x] T061 [US6] Verify and refine online status logic: setOnline(player) resets onlineUntil to now+40min on every energy spend in EnergyService, and ensure arena opponent listing correctly derives isOnline from onlineUntil > now in backend/src/main/java/com/heromanager/service/EnergyService.java and backend/src/main/java/com/heromanager/service/ArenaService.java
- [x] T062 [US6] Add prominent online (green dot/badge) and offline (gray dot/badge) status indicators to OpponentRow component, and clearly display variable energy cost (5 AE online, 7 AE offline, 4 AE return) next to each opponent's Fight button in frontend/src/components/Arena/OpponentRow.tsx

**Checkpoint**: Online/offline status displayed with clear visual indicators in arena. Energy costs reflect 5 (online) / 7 (offline) / 4 (return) correctly.

---

## Phase 9: User Story 7 — Hero Leveling & Stats Growth (Priority: P2)

**Goal**: Heroes gain XP from battles, level up when XP threshold reached (level^2 * 10), and players can view detailed hero stats with growth breakdown

**Independent Test**: Fight arena battles → hero accumulates XP → reaches threshold → levels up → stats increase by growth rates → view hero detail page showing progression

### Implementation for User Story 7

- [x] T063 [US7] Verify and refine level-up logic in BattleService: after XP award, check if currentXp >= level^2 * 10, if so increment level and subtract threshold XP (allow multiple level-ups per battle), and ensure stat computation base + growth*(level-1) reflects new level in backend/src/main/java/com/heromanager/service/BattleService.java
- [x] T064 [US7] Create HeroDetailPage displaying hero portrait, name, level, XP progress bar (currentXp / xpToNextLevel), all 6 stats with base value and growth rate per level, summon bonus (if on team with summon), and navigation back to team in frontend/src/pages/HeroDetailPage.tsx
- [x] T065 [US7] Enhance HeroStats component to show per-stat breakdown table: base value, growth per level, current computed value at current level, bonus from equipment, bonus from summon, and total effective stat in frontend/src/components/Hero/HeroStats.tsx

**Checkpoint**: Hero detail page shows complete stat breakdown with XP progress. Leveling works correctly after battles. Stats increase per growth rates.

---

## Phase 10: User Story 8 — Equipment: Items & Abilities (Priority: P2)

**Goal**: Heroes equip items (3 slots, no duplicate per hero, max 3 same item per team) and abilities (hero-specific, 4 tiers at 50/200/400/800g). Items sellable at 75%.

**Independent Test**: Buy item from shop → equip to hero → verify stat bonus applied → try duplicate → see prevention → sell item → verify 75% gold return → buy ability → equip → verify hero-specific

### Implementation for User Story 8

- [x] T066 [US8] Create EquippedItem entity (heroId, itemTemplateId, slotNumber; unique heroId+slotNumber, unique heroId+itemTemplateId) and EquippedAbility entity (heroId, abilityTemplateId; unique heroId+abilityTemplateId, validate abilityTemplate.heroTemplateId matches hero.templateId) in backend/src/main/java/com/heromanager/entity/
- [x] T067 [US8] Create EquipmentService with equipItem (check slot 1-3 not occupied, check no duplicate item on hero, check team-wide count < 3 for same item), unequipItem, sellItem (remove + add 75% of itemTemplate.cost to player gold), equipAbility (check hero template match, check no duplicate), unequipAbility (no gold refund) in backend/src/main/java/com/heromanager/service/EquipmentService.java
- [x] T068 [US8] Create EquipmentController with GET /api/equipment/hero/{heroId}, POST /api/equipment/equip-item, POST /api/equipment/unequip-item, POST /api/equipment/sell-item, POST /api/equipment/unequip-ability per equipment-api.md contract in backend/src/main/java/com/heromanager/controller/EquipmentController.java
- [x] T069 [US8] Add item and ability shop endpoints to ShopController: GET /api/shop/items (all item templates), POST /api/shop/buy-item (gold check, create EquippedItem), GET /api/shop/abilities?heroId (hero-specific abilities with owned flag), POST /api/shop/buy-ability (gold check, hero match, create EquippedAbility) per shop-api.md contract in backend/src/main/java/com/heromanager/controller/ShopController.java
- [x] T070 [P] [US8] Create equipmentApi (getHeroEquipment, equipItem, unequipItem, sellItem, unequipAbility) and add listItems(), buyItem(), listAbilities(heroId), buyAbility() to shopApi in frontend/src/api/equipmentApi.ts and frontend/src/api/shopApi.ts
- [x] T071 [P] [US8] Create Equipment components: ItemSlot (item display with unequip/sell buttons, empty slot indicator), AbilitySlot (ability display with unequip button), and ShopItemCard (item name, cost, stat bonuses, buy button) in frontend/src/components/Equipment/ and frontend/src/components/Shop/ShopItemCard.tsx
- [x] T072 [US8] Add equipment management section to HeroDetailPage: 3 item slots with equip/unequip/sell actions, abilities list with equipped and available-to-buy abilities, stat totals updated with equipment bonuses in frontend/src/pages/HeroDetailPage.tsx
- [x] T073 [US8] Add Items tab (grid of all items with prices and stat bonuses, buy-and-equip flow selecting hero and slot) and Abilities tab (hero selector, hero-specific abilities at 4 price tiers, buy flow) to ShopPage in frontend/src/pages/ShopPage.tsx

**Checkpoint**: Items and abilities purchasable from shop. Equipment visible on hero detail page. All constraints enforced (3 slots, no duplicates, team max 3). Sell returns 75% gold.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final integration validation and polish across all user stories

- [x] T074 Verify all 9 hero images and 1 summon image from Heroes/ folder display correctly in shop hero cards, team slots, and hero detail views at appropriate dimensions (180x200 base)
- [x] T075 [P] Add consistent error handling with user-friendly error messages (inline errors or toast notifications) for all API failure cases across all frontend pages
- [x] T076 [P] Add loading spinners and empty state displays for all data-fetching pages (TeamPage, ShopPage, ArenaPage, HeroDetailPage, BattlePage)
- [x] T077 Validate full quickstart.md flow end-to-end: start backend → verify seed data in H2 console (9 heroes, 10 items, 1 summon, 36 abilities) → start frontend → register → confirm email → login → verify starter account (Konohamaru-Genin, 500g, 120/120 energy) → buy hero → equip to team → fight arena battle → check rewards

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — gateway to all gameplay
- **US2 (Phase 4)**: Depends on Foundational + US1 (needs login to access team)
- **US3 (Phase 5)**: Depends on Foundational + US1 (needs login to access shop)
- **US4 (Phase 6)**: Depends on Foundational + US1 + US2 (needs team lineup for battles)
- **US5 (Phase 7)**: Depends on US4 (needs arena to spend/display energy)
- **US6 (Phase 8)**: Depends on US4 (needs arena to see online/offline status)
- **US7 (Phase 9)**: Depends on US4 (needs battles to earn XP and level up)
- **US8 (Phase 10)**: Depends on US1 + US3 (needs login and hero ownership)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

```
US1 (Auth) ─────────┬──── US2 (Team) ────── US4 (Arena) ──┬── US5 (Energy)
                     │                                      ├── US6 (Online/Offline)
                     │                                      └── US7 (Leveling)
                     └──── US3 (Shop) ────── US8 (Equipment)
```

- **US1**: Gateway — all other stories require authentication
- **US2 + US3**: Can run in parallel after US1 completes
- **US4**: Requires US2 (team must exist for battles)
- **US5, US6, US7**: Can all run in parallel after US4 completes
- **US8**: Can run in parallel with US4 (only needs US1 + US3)

### Within Each User Story

1. DTOs before services (services construct DTOs)
2. Services before controllers (controllers delegate to services)
3. Backend complete before frontend API client
4. Components before pages (pages compose components)
5. API client before pages (pages call API)

### Parallel Opportunities

- **Setup**: T002, T003, T004 all parallel with T001
- **Foundational entities**: T006, T007, T008, T009 all parallel
- **Foundational infra**: T012, T014, T016, T017, T020 all parallel
- **US2 and US3**: Can start in parallel after US1 completes
- **US5, US6, US7, US8**: Can all start in parallel after their dependencies complete
- **Within each story**: All tasks marked [P] can run in parallel

---

## Parallel Execution Examples

### Foundational Phase (Maximum Parallelism)

```
Parallel Group A (entities — all [P]):
  T006: Player + ConfirmationToken entities
  T007: HeroTemplate + SummonTemplate entities
  T008: Hero + Summon + TeamSlot entities
  T009: ItemTemplate + AbilityTemplate entities

Then sequential: T010 (repos depend on entities) → T011 (seed data depends on tables)

Parallel Group B (security + frontend — all [P]):
  T012: JwtUtil + JwtConfig
  T014: CorsConfig
  T016: TypeScript types
  T017: API client
  T020: Layout components
```

### After US1 Completes (P1 Parallelism)

```
Parallel:
  Agent A: US2 — Team Management (T030 → T041)
  Agent B: US3 — Hero Shop (T042 → T047)
```

### After US4 Completes (P2 Parallelism)

```
Parallel:
  Agent A: US5 — Energy Display (T058 → T060)
  Agent B: US6 — Online/Offline (T061 → T062)
  Agent C: US7 — Hero Leveling (T063 → T065)
  Agent D: US8 — Equipment (T066 → T073)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — Registration & Login
4. **STOP and VALIDATE**: Can register, confirm email, and log in

### Core Gameplay Loop (User Stories 1–4)

5. Complete Phase 4: US2 — Team Management
6. Complete Phase 5: US3 — Hero Shop
7. **STOP and VALIDATE**: Can build a team and buy heroes
8. Complete Phase 6: US4 — Arena Battles
9. **STOP and VALIDATE**: Full battle loop with gold/XP rewards

### Enhancement Layer (User Stories 5–8)

10. Complete US5–US8 in any order (can be parallel)
11. **STOP and VALIDATE**: Each story independently
12. Complete Phase 11: Polish

### Suggested MVP Scope

**Minimum Viable Product = US1 + US2 + US3 + US4** (all P1 stories)

This delivers the complete gameplay loop: Registration → Team building → Hero shopping → Arena battles with gold/XP rewards.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks within the same phase
- [Story] labels map to spec.md user stories (US1–US8)
- No automated tests — all testing is manual per project requirements
- Backend: http://localhost:8080 | Frontend: http://localhost:3000 | H2 Console: http://localhost:8080/h2-console
- Hero images served from frontend/src/assets/heroes/ (copied from Heroes/ folder)
- Commit after each task or logical group for safe progress tracking
