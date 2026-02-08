# Feature Specification: HeroManager Core Game System

**Feature Branch**: `1-core-game-system`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Build a web application hero management game inspired by NinjaManager with authentication, hero team management, arena battles, shop, energy system, and equipment."

## Clarifications

### Session 2026-02-08

- Q: Do heroes on the losing team also earn XP for enemies they personally defeated during the battle? → A: Yes — all heroes earn XP per individual enemy defeated, regardless of team win/loss.
- Q: How should received challenges be presented to the player? → A: Battle log in arena — list of recent challengers with a "Return Challenge" button next to each.
- Q: How should opponents be displayed and sorted in the arena list? → A: Show all players, sorted by team power (sum of hero stats/levels).
- Q: Can a player challenge their own team? → A: No — the system prevents players from challenging themselves.
- Q: Should players set a team name, or use the player's username? → A: Use the player's username as the team name (no separate team name).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Registration & Email Confirmation (Priority: P1)

A new player visits the HeroManager website and registers an account by providing an email address, username, and password. The system sends a confirmation email from `piratemanagerofficial@gmail.com`. The player must click the confirmation link in the email before they can log in and play. Once confirmed, the player logs in and is granted a starter account: 1 hero (Konohamaru-Genin at level 1), 500 gold, 0 diamonds, full arena energy (120), and full world energy (120).

**Why this priority**: Without authentication, no other game feature can function. This is the gateway to all gameplay and the foundation of player identity.

**Independent Test**: Can be fully tested by registering a new account, checking for the confirmation email, clicking the link, logging in, and verifying the starter resources are present.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they submit a valid email, username, and password, **Then** a confirmation email is sent from `piratemanagerofficial@gmail.com` and the account is created in an unconfirmed state.
2. **Given** an unconfirmed account, **When** the player attempts to log in, **Then** the system denies access and displays a message indicating email confirmation is required.
3. **Given** an unconfirmed account, **When** the player clicks the confirmation link in their email, **Then** their account is marked as confirmed and they can now log in.
4. **Given** a newly confirmed account, **When** the player logs in for the first time, **Then** they see their starter hero (Konohamaru-Genin, level 1), 500 gold, 0 diamonds, 120 arena energy (green), and 120 world energy (yellow).
5. **Given** a visitor, **When** they attempt to access any game page without being logged in, **Then** they are redirected to the login page.

---

### User Story 2 - Team Lineup Management (Priority: P1)

A logged-in player can view and manage their team lineup. The team consists of up to 6 hero slots and 1 summon slot. Each hero and summon occupies team capacity (starting maximum: 100). The player can equip and unequip heroes and summons from their roster into the active team lineup, as long as total capacity is not exceeded.

**Why this priority**: Team composition is the core gameplay loop — players need to assemble and modify their team before they can battle or progress.

**Independent Test**: Can be tested by logging in, viewing the team screen, equipping/unequipping heroes, and verifying capacity constraints are enforced.

**Acceptance Scenarios**:

1. **Given** a new player with Konohamaru-Genin (capacity: 5), **When** they view their team, **Then** they see Konohamaru-Genin in slot 1 and 5 empty slots for heroes, 1 empty summon slot, and used capacity of 5/100.
2. **Given** a player with multiple heroes in their roster, **When** they equip a hero to an empty team slot, **Then** the hero appears in the lineup and the team's used capacity increases by that hero's capacity value.
3. **Given** a team at 95/100 capacity, **When** a player attempts to equip a hero with capacity 10, **Then** the system prevents it and displays a message that there is insufficient team capacity.
4. **Given** a player with a hero in the lineup, **When** they unequip that hero, **Then** the hero returns to the bench roster and the team capacity is freed.
5. **Given** a player with a summon equipped, **When** they view their team stats, **Then** the summon's stat bonuses are reflected in each hero's displayed stats.
6. **Given** a player with no summon, **When** they equip a summon from their roster, **Then** the summon occupies the summon slot and its capacity is deducted from the team total.

---

### User Story 3 - Hero Shop (Priority: P1)

A logged-in player can visit the shop to browse and purchase heroes and summons using gold. Each listing shows the hero's portrait image/gif, name, cost, capacity, and base stats. When a hero is purchased, the gold is deducted and the hero is added to the player's roster at level 1 with base stats.

**Why this priority**: The shop is the primary means of acquiring new heroes, which drives team building and progression — a core gameplay pillar.

**Independent Test**: Can be tested by visiting the shop, verifying all heroes/summons are listed with correct prices, purchasing a hero, and confirming gold deduction and hero appearing in roster.

**Acceptance Scenarios**:

1. **Given** a logged-in player visiting the shop, **When** the shop page loads, **Then** all available heroes and summons are displayed with their portrait image/gif, name, cost in gold, capacity, and base stats with growth rates.
2. **Given** a player with 500 gold, **When** they purchase Sakura (cost: 200g), **Then** 200 gold is deducted (leaving 300g), Sakura appears in the player's hero roster at level 1, and the shop reflects the purchase.
3. **Given** a player with 100 gold, **When** they attempt to buy Deidara (cost: 400g), **Then** the purchase is denied and a message displays indicating insufficient gold.
4. **Given** a player who already owns Deidara, **When** they view the shop, **Then** Deidara is shown as already owned and cannot be purchased again.
5. **Given** a player purchasing Susanoo-Spirit-Summon (cost: 300g), **When** the purchase completes, **Then** the summon is added to the player's roster with base stats of 10 Mana (+5/lvl) and 5 Magic Power (+4/lvl).

---

### User Story 4 - Arena Battle System (Priority: P1)

A logged-in player can challenge other players' teams in the arena. The battle is a sequential 1v1 confrontation between heroes. Each hero generates an attack number based on their stats, and the hero with the higher number wins the confrontation (the loser's hero is eliminated). The winning hero stays active but accumulates stamina fatigue. The team that runs out of heroes first loses. Battle results are displayed as a text-based log. Winners earn gold and heroes earn experience points.

**Why this priority**: The arena is the central competitive feature and the primary way players earn gold and experience — it drives the entire game economy and progression.

**Independent Test**: Can be tested by challenging another player's team, watching the battle log, and verifying gold/XP rewards and energy cost deduction.

**Acceptance Scenarios**:

1. **Given** a player with at least 5 arena energy and an online opponent, **When** they challenge that opponent, **Then** 5 arena energy is deducted, the battle resolves, and a text-based battle log is displayed showing each confrontation.
2. **Given** a player challenging an offline opponent, **When** the challenge is initiated, **Then** 7 arena energy is deducted instead of 5.
3. **Given** a player returning a challenge from another player, **When** they accept the return challenge, **Then** only 4 arena energy is deducted.
4. **Given** two heroes confronting each other, **When** the attack numbers are calculated using the formula `(physical_attack * 0.5) + (magic_power * random(0.1 to 1)) + (dexterity * 0.33)) * (stamina_modifier)`, **Then** the hero with the higher attack number wins, and the losing hero is eliminated.
5. **Given** a hero that has won a confrontation, **When** they face the next enemy hero, **Then** their stamina modifier decreases by 10% (1.0 → 0.9 → 0.81 → etc.).
6. **Given** a team that wins the battle, **When** the battle concludes, **Then** the winning team receives +2 gold and the winning team's summon receives +1 XP.
7. **Given** a team that loses the battle, **When** the battle concludes, **Then** the losing team receives +1 gold and the losing team's summon receives +0 XP.
8. **Given** any hero on either team that defeated an enemy hero during the battle, **When** the battle concludes, **Then** that hero receives 4 + (2 * defeated enemy hero's level) XP per enemy defeated, regardless of whether their team won or lost.
9. **Given** a player with fewer than 5 arena energy and no pending return challenges at 4 AE, **When** they attempt to challenge, **Then** the system prevents the challenge and shows remaining energy with a timer for the next energy point.

---

### User Story 5 - Energy System (Priority: P2)

Each player has two energy types: Arena Energy (green, for battles) and World Energy (yellow, reserved for future use). Both regenerate at +1 every 10 minutes, capping at 120. Energy is consumed by arena actions. New accounts start at 120/120 for both.

**Why this priority**: The energy system gates gameplay pacing and is essential for the arena to function, but it builds on top of the battle system.

**Independent Test**: Can be tested by spending energy, waiting for regeneration ticks, and verifying the cap at 120 prevents further gain.

**Acceptance Scenarios**:

1. **Given** a player with 115 arena energy, **When** 50 minutes pass without spending energy, **Then** their arena energy is 120 (capped), not 120+.
2. **Given** a player with 120 arena energy, **When** 10 minutes pass, **Then** their arena energy remains at 120 (no gain above cap).
3. **Given** a player with 100 arena energy, **When** they spend 5 AE on a challenge and 10 minutes pass, **Then** their arena energy is 96 (95 + 1 regenerated).
4. **Given** a player viewing their dashboard, **When** they look at the energy display, **Then** arena energy is shown in green and world energy in yellow, both showing current/max values and a timer to next regeneration tick.
5. **Given** a new player who just logged in for the first time, **When** they view their energy, **Then** both arena and world energy are at 120/120.

---

### User Story 6 - Online/Offline Status System (Priority: P2)

Whenever a player spends energy (any type), their team is set to "online" status for 40 minutes. Other players can see which teams are online or offline in the arena list. Online opponents cost 5 AE to challenge; offline cost 7 AE. This incentivizes active play.

**Why this priority**: The online system directly affects arena energy costs and is a core strategic element, but is secondary to the battle system itself.

**Independent Test**: Can be tested by spending energy, verifying the online timer activates for 40 minutes, and confirming the status is visible to other players in the arena.

**Acceptance Scenarios**:

1. **Given** a player who spends arena energy, **When** another player views the arena list, **Then** the first player's team is shown as "online" with a green indicator.
2. **Given** a player who last spent energy 41 minutes ago, **When** another player views the arena list, **Then** that player's team is shown as "offline".
3. **Given** a player who spent energy 30 minutes ago, **When** they spend energy again, **Then** their online timer resets to 40 minutes from the new action.
4. **Given** an online opponent, **When** a player challenges them, **Then** 5 AE is consumed.
5. **Given** an offline opponent, **When** a player challenges them, **Then** 7 AE is consumed.

---

### User Story 7 - Hero Leveling & Stats Growth (Priority: P2)

Heroes and summons gain experience points from battles. When enough XP is accumulated, they level up. Each level applies the hero's growth rates to their stats. The player can view each hero's current stats, level, and XP progress.

**Why this priority**: Progression through leveling is what gives battles long-term meaning and keeps players engaged, but it builds on top of the battle and team systems.

**Independent Test**: Can be tested by fighting arena battles, accumulating XP, leveling up a hero, and verifying stats increase according to growth rates.

**Acceptance Scenarios**:

1. **Given** Konohamaru-Genin at level 1 with base stats (PA:5, MP:8, Dex:3, Elem:2, Mana:20, Stam:10), **When** the hero reaches level 2, **Then** stats become PA:5.8, MP:9, Dex:3.2, Elem:2.7, Mana:21, Stam:11 (base + growth).
2. **Given** a hero that defeats an enemy hero at level 5, **When** XP is awarded, **Then** the hero gains 4 + (2 * 5) = 14 XP.
3. **Given** a summon on the winning team, **When** the battle concludes with a win, **Then** the summon gains +1 XP.
4. **Given** a summon on the losing team, **When** the battle concludes with a loss, **Then** the summon gains +0 XP.
5. **Given** Susanoo-Spirit-Summon at level 2 (Mana: 15, MP: 9), **When** equipped to a team, **Then** each hero on the team receives +9 Magic Power bonus from the summon.

---

### User Story 8 - Equipment: Items & Abilities (Priority: P2)

Heroes can equip up to 3 items and multiple abilities. Items are shared across the shop; abilities are hero-specific. A hero cannot equip duplicate items/abilities. No more than 3 of the same item can be equipped across the entire team. Abilities cost 50, 200, 400, and 800 gold. Items can be sold for 75% of their base cost.

**Why this priority**: Equipment adds depth to team customization and strategy, building on top of the core hero and shop systems.

**Independent Test**: Can be tested by purchasing items/abilities from the shop, equipping them to heroes, verifying slot limits, and selling items back.

**Acceptance Scenarios**:

1. **Given** a hero with 3 empty item slots, **When** a player equips an item, **Then** the item occupies one slot and its stat bonuses apply to the hero.
2. **Given** a hero with item "Iron Shield" equipped, **When** the player tries to equip a second "Iron Shield" to the same hero, **Then** the system prevents it with a message about duplicate items.
3. **Given** 3 heroes on a team each with "Iron Shield" equipped (3 total), **When** the player tries to equip a 4th "Iron Shield" to another hero, **Then** the system prevents it indicating the team maximum of 3 per item is reached.
4. **Given** a hero with a specific set of available abilities (4 tiers: 50g, 200g, 400g, 800g), **When** the player views the ability shop for that hero, **Then** only that hero's specific abilities are shown at the correct prices.
5. **Given** a player with an item worth 400g, **When** they sell the item, **Then** they receive 300g (75% of base cost).
6. **Given** a hero with an ability equipped, **When** the player tries to equip the same ability again, **Then** the system prevents the duplicate.

---

### Edge Cases

- What happens when a player registers with an email that is already in use? The system rejects the registration and prompts the player to log in or use a different email.
- What happens if the confirmation email link expires? Links should expire after 24 hours; the player can request a new confirmation email.
- What happens if a player has 0 heroes in their active lineup and tries to enter the arena? The system prevents entry and prompts them to equip at least 1 hero.
- What happens if both heroes in a confrontation generate the exact same attack number? The defending hero (the one who was already active) wins the tie.
- What happens if a player tries to buy a hero they already own? The shop prevents duplicate purchases.
- What happens when a player disconnects mid-battle? Battles are calculated server-side in their entirety; disconnection does not affect the outcome.
- What happens if arena energy regeneration tick occurs exactly at 120? No energy is added; the regeneration timer pauses until energy drops below 120.
- What happens if a player has exactly 4 AE and an offline opponent costs 7 AE? The challenge is denied with a clear message about insufficient energy.
- What happens if a player's only hero is unequipped from the team? The system should warn the player but allow it (they simply cannot battle with an empty lineup).
- What happens if a player tries to challenge themselves? The system prevents self-challenges; the player's own team is excluded from the arena opponent list.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Accounts**
- **FR-001**: System MUST allow new players to register with email, username, and password.
- **FR-002**: System MUST send a confirmation email from `piratemanagerofficial@gmail.com` upon registration.
- **FR-003**: System MUST prevent login until the player's email is confirmed via the emailed link.
- **FR-004**: System MUST redirect unauthenticated users to the login page when they attempt to access game pages.
- **FR-005**: System MUST initialize new confirmed accounts with: 1 hero (Konohamaru-Genin, level 1), 500 gold, 0 diamonds, 120/120 arena energy, 120/120 world energy.
- **FR-006**: Confirmation email links MUST expire after 24 hours; players can request a new confirmation email.

**Heroes & Summons**
- **FR-007**: Each hero MUST have the following stats: Physical Attack, Magic Power, Dexterity, Element, Mana, Stamina — each with a base value and a per-level growth rate.
- **FR-008**: Konohamaru-Genin MUST have base stats: PA:5 (+0.8), MP:8 (+1), Dex:3 (+0.2), Elem:2 (+0.7), Mana:20 (+1), Stam:10 (+1), Capacity:5.
- **FR-009**: Summons MUST have their own stats and growth rates, which apply as bonuses to every hero on the team.
- **FR-010**: Susanoo-Spirit-Summon MUST have base stats: Mana:10 (+5), MP:5 (+4), Capacity:15.
- **FR-011**: Heroes and summons MUST gain experience from battles and level up, applying growth rates to their stats per level gained.
- **FR-012**: Hero XP formula per defeated enemy hero MUST be: 4 + (2 * enemy hero's level). This applies to all heroes that defeated an opponent, regardless of whether their team won or lost the battle.
- **FR-013**: Summon XP MUST be: +1 for a team win, +0 for a team loss.

**Team Management**
- **FR-014**: Each team MUST support up to 6 hero slots and 1 summon slot.
- **FR-015**: Each team MUST have a total capacity limit (starting at 100); equipping heroes/summons MUST deduct their capacity cost.
- **FR-016**: System MUST prevent equipping a hero or summon if it would exceed the team's capacity limit.
- **FR-017**: Players MUST be able to equip and unequip heroes and summons between their roster and active team lineup.
- **FR-018**: Hero display MUST show the hero's portrait image/gif at approximately 180x200 base dimensions, scaled appropriately for UI context.

**Shop**
- **FR-019**: The shop MUST list the following heroes with their costs and capacities:
  - Deidara: 400g, capacity 20
  - Sakura: 200g, capacity 8
  - Hidan: 400g, capacity 10
  - Kabuto: 400g, capacity 15
  - Kakashi: 400g, capacity 15
  - Konan: 400g, capacity 10
  - Minato: 2000g, capacity 30
  - Hashirama: 2000g, capacity 30
- **FR-020**: The shop MUST list Susanoo-Spirit-Summon at 300g, capacity 15.
- **FR-021**: System MUST prevent purchasing a hero or summon the player already owns.
- **FR-022**: System MUST deduct gold upon purchase and add the hero/summon to the player's roster at level 1.

**Energy System**
- **FR-023**: Each player MUST have Arena Energy (displayed green) and World Energy (displayed yellow).
- **FR-024**: Both energy types MUST regenerate at +1 every 10 minutes.
- **FR-025**: Both energy types MUST have a maximum capacity of 120; regeneration MUST NOT exceed the cap.
- **FR-026**: Energy regeneration timer MUST pause when energy is at maximum capacity and resume when energy drops below the cap.
- **FR-027**: New accounts MUST start with 120/120 for both energy types.

**Online/Offline System**
- **FR-028**: Spending any energy MUST set the player's team status to "online" for 40 minutes.
- **FR-029**: The online timer MUST reset to 40 minutes each time energy is spent.
- **FR-030**: The arena list MUST display each team's online/offline status visually.

**Arena & Battles**
- **FR-031**: Challenging an online opponent MUST cost 5 Arena Energy.
- **FR-032**: Challenging an offline opponent MUST cost 7 Arena Energy.
- **FR-033**: Returning a received challenge MUST cost 4 Arena Energy.
- **FR-034**: Battles MUST be sequential 1v1 hero confrontations; the team that runs out of heroes first loses.
- **FR-035**: Each hero's attack number MUST be calculated as: `(physical_attack * 0.5) + (magic_power * random(0.1 to 1)) + (dexterity * 0.33)) * (stamina_modifier)`, where stamina_modifier starts at 1.0 and decreases by 10% after each confrontation won.
- **FR-036**: The hero with the higher attack number wins the confrontation; the losing hero is eliminated from the battle. In a tie, the defending (already active) hero wins.
- **FR-037**: The winning team earns +2 gold; the losing team earns +1 gold.
- **FR-038**: Battles MUST be fully calculated server-side and presented as a text-based log to the player.
- **FR-039**: System MUST prevent a player from entering the arena with an empty team lineup.
- **FR-049**: The arena page MUST display a battle log section listing recent opponents who challenged the player, with a "Return Challenge" button next to each entry. Returning a challenge costs 4 AE (per FR-033).
- **FR-050**: Battle log entries MUST show the challenger's username, the battle outcome (win/loss), and the timestamp of the challenge.
- **FR-051**: The arena opponent list MUST display all registered players (excluding the current player), sorted by team power (calculated from the sum of all active heroes' stats and levels).
- **FR-052**: Each opponent entry in the arena list MUST show: username, team power, online/offline status, and a "Fight" button.
- **FR-053**: System MUST prevent a player from challenging their own team.

**Equipment: Items**
- **FR-040**: Each hero MUST have 3 item equipment slots.
- **FR-041**: A hero MUST NOT be able to equip two copies of the same item.
- **FR-042**: No more than 3 of the same item MUST be equipped across the entire team.
- **FR-043**: Players MUST be able to sell items for 75% of their base cost.

**Equipment: Abilities**
- **FR-044**: Each hero MUST have at least 4 hero-specific abilities available, priced at 50, 200, 400, and 800 gold.
- **FR-045**: A hero MUST NOT be able to equip two copies of the same ability.
- **FR-046**: The team-wide limit of 3 MUST NOT apply to abilities (abilities may exceed 3 of the same across the team).

**Currencies**
- **FR-047**: Each player MUST have Gold (common currency) and Diamonds (premium currency) displayed in their account.
- **FR-048**: Gold MUST be earned through arena battles (+2 for win, +1 for loss) and spendable in the shop.

### Key Entities

- **Player**: Represents a registered user. Has email, username (also serves as the team name displayed in arena and battle logs), password, email confirmation status, gold balance, diamond balance, arena energy, world energy, online status with expiry timestamp, and owns a roster of heroes and summons.
- **Hero**: A character with a name, portrait image/gif, level, current XP, base stats (PA, MP, Dex, Element, Mana, Stamina), per-level growth rates, capacity cost, and equipped items/abilities. Belongs to a player's roster and optionally to an active team slot.
- **Summon**: Similar to a hero but occupies the single summon team slot. Has its own stats and growth rates that apply as bonuses to all heroes on the team. Gains XP from team wins only.
- **Team**: A player's active lineup of up to 6 heroes and 1 summon. Has a maximum capacity (starting 100). The team's composition determines battle order. Has a calculated team power value (sum of active heroes' stats/levels) used for arena sorting.
- **Item**: An equippable piece of gear with stat bonuses and a gold cost. Can be equipped to a hero's item slots (3 per hero, no duplicates on one hero, max 3 same item per team). Sellable at 75% base cost.
- **Ability**: A hero-specific equippable skill with stat effects and a gold cost (4 tiers: 50, 200, 400, 800g). No duplicate abilities on one hero, but no team-wide cap.
- **Battle**: A server-calculated arena confrontation between two teams. Produces a sequential text log of hero-vs-hero confrontations. Awards gold and XP based on outcome.
- **Energy**: A time-gated resource (Arena Energy, World Energy) that regenerates +1 per 10 minutes up to a cap of 120. Consumed by game actions.
- **Battle Log Entry**: A record of a completed arena battle. Stores the challenger, the defender, the outcome (win/loss), timestamp, and whether a return challenge has been used. Displayed in the arena page to enable return challenges at reduced AE cost.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new player can register, confirm their email, and log in to see their starter account within 5 minutes.
- **SC-002**: A player can browse the shop, purchase a hero, equip it to their team, and verify stats in under 2 minutes.
- **SC-003**: A player can initiate and view a complete arena battle (including text log and rewards) within 30 seconds of clicking "Fight".
- **SC-004**: Energy regeneration accurately adds +1 energy every 10 minutes (within 30-second tolerance) when below the 120 cap.
- **SC-005**: 100% of shop purchases correctly deduct gold and add the hero/summon to the player's roster with accurate base stats.
- **SC-006**: Battle results consistently apply the correct XP formula: heroes gain 4 + (2 * enemy level) per defeated enemy; summons gain +1 for wins.
- **SC-007**: The online/offline system correctly transitions a player to offline after 40 minutes of inactivity (no energy spent), with arena costs reflecting the correct 5/7/4 AE rates.
- **SC-008**: Team capacity enforcement has 0% bypass rate — no lineup can exceed 100 capacity through any sequence of equip/unequip actions.
- **SC-009**: Item/ability equip rules are enforced with 100% accuracy — no duplicate items on a hero, no more than 3 of the same item on a team, no duplicate abilities on a hero.
- **SC-010**: All hero images/gifs from the Heroes folder are displayed correctly in the shop and team views at appropriate dimensions.

## Assumptions

- **Database choice**: A relational database (e.g., PostgreSQL or H2 for local development) is most appropriate given the structured entity relationships (players, heroes, items, battles). Final choice deferred to planning phase.
- **XP-to-level curve**: The spec does not define how much XP is required per level. A standard exponential curve will be designed during planning (e.g., level 2 = 10 XP, level 3 = 25 XP, etc.).
- **Hero stats for shop heroes**: The user has specified that the AI should determine base stats and growth rates for Deidara, Sakura, Hidan, Kabuto, Kakashi, Konan, Minato, and Hashirama. These will be balanced during planning with higher-cost heroes having stronger stats.
- **Items catalog**: No specific items are defined yet. A starter set of items with varied stat bonuses will be designed during planning. The user will rebalance manually.
- **Abilities catalog**: Each hero will have 4 abilities at the specified price tiers. The AI will generate placeholder abilities with stat effects; the user will rename and rebalance them manually.
- **World Energy**: Currently reserved for future features. Will be displayed as yellow with +1/10min regeneration and 120 cap, but no game actions consume it yet.
- **Mana and Element stats**: Present on heroes and included in growth, but not used in the current battle formula. Reserved for future battle system expansion.
- **Battle order**: Heroes fight in the order they are placed in the team lineup (slot 1 first, slot 2 second, etc.).
- **Single hero purchase**: Each hero/summon can only be purchased once per player (no duplicates).
- **No real-money transactions**: Diamond (premium currency) exists as a display placeholder; no purchase mechanism is needed in this phase.
- **Local development**: No cloud deployment. The application runs entirely on the developer's local machine.
- **No unit tests**: Testing is manual by users. Focus is on functionality and implementation.
- **Email delivery**: Using the specified Gmail account (`piratemanagerofficial@gmail.com`) for sending confirmation and announcement emails.

## Out of Scope

- World Energy gameplay mechanics (displayed only, no actions consume it)
- Mana and Element in battle calculations
- Real-money or payment processing for premium currency
- Cloud deployment or hosting
- Automated testing (unit, integration, or end-to-end)
- Clan/guild system
- World map missions
- Forge/crafting system
- Kage ranks
- Chat system
- Leaderboard/rating system beyond basic arena listings
- Mobile-specific responsive design (desktop-first)
