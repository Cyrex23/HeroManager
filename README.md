# HeroManager — Complete Game & Codebase Reference

> **Purpose:** This document is the single source of truth for anyone (human or LLM) picking up this project. It explains every game system, mechanic, formula, entity, and architectural decision in enough detail to implement, extend, or debug any feature.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Directory Structure](#3-directory-structure)
4. [Authentication & Player Account](#4-authentication--player-account)
5. [Currency & Resources](#5-currency--resources)
6. [The Stats System](#6-the-stats-system)
7. [Heroes](#7-heroes)
8. [Summons](#8-summons)
9. [Equipment — Items & Abilities](#9-equipment--items--abilities)
10. [The Spell System](#10-the-spell-system)
11. [Team Building](#11-team-building)
12. [The Battle System](#12-the-battle-system)
13. [The Arena & World](#13-the-arena--world)
14. [XP & Leveling](#14-xp--leveling)
15. [The Upgrade System](#15-the-upgrade-system)
16. [The Blacksmith (Crafting)](#16-the-blacksmith-crafting)
17. [The Shop](#17-the-shop)
18. [Frontend Pages](#18-frontend-pages)
19. [Backend Services](#19-backend-services)
20. [Database Schema](#20-database-schema)
21. [Key Conventions & Patterns](#21-key-conventions--patterns)

---

## 1. Project Overview

HeroManager is a browser-based hero management game. Players build a roster of anime-inspired heroes (Naruto, Hunter x Hunter, One Piece), equip them with items and abilities, form a team, and send that team into automated turn-based battles against other players' teams in the **Arena** or scripted opponents in the **World**.

The game loop:
1. **Buy** heroes and summons from the Shop using gold.
2. **Equip** items and abilities to heroes.
3. **Assign** heroes to your team (subject to capacity and tier constraints).
4. **Battle** — battles are fully automated; strategy comes from hero/equipment choices.
5. **Earn** gold and XP from battles.
6. **Level up** heroes and purchase stat upgrades.
7. **Craft** powerful weapons in the Blacksmith.
8. **Unlock** upgrades to expand your roster, energy cap, and team setups.

---

## 2. Tech Stack & Architecture

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2.2, Spring Data JPA, Lombok |
| Database | H2 (file-based in dev: `./data/heromanager.mv.db`) |
| Frontend | React 18.2, TypeScript 5.3, Vite 5, Axios |
| Auth | JWT (HS256, 24h expiry) |
| Email | Gmail SMTP (account confirmation, password reset) |

**Dev config** (`application-dev.properties`):
- `spring.jpa.hibernate.ddl-auto=update` — Hibernate auto-creates/alters tables from entities
- `spring.sql.init.mode=always` — `data.sql` runs on every startup
- `spring.sql.init.continue-on-error=true` — SQL errors are swallowed (logged only)
- `spring.jpa.defer-datasource-initialization=true` — Hibernate schema runs before `data.sql`

**Critical consequence:** Because H2 is file-based and `ddl-auto=update` only ADDs columns (never drops), if the `ability_spell` table or any other table is ever in a corrupt/empty state, the safest fix is to delete `backend/data/heromanager.mv.db` and restart — the full schema and seed data will be recreated from `data.sql`.

---

## 3. Directory Structure

```
backend/
  src/main/java/com/heromanager/
    controller/          REST endpoints (one per domain)
    dto/                 Response/request DTOs (Java records mostly)
    entity/              JPA entities (direct DB mapping)
    repository/          Spring Data JPA repos
    service/             Business logic
    util/
      BattleCalculator.java   — pure combat math (no Spring, no DB)
      AbilitySpellBuilder.java — single source for building spell JSON maps
  src/main/resources/
    data.sql             Full seed data: hero templates, abilities, items,
                         weapons, materials, recipes, 27+ ability spells
    application.properties
    application-dev.properties

frontend/
  public/
    Portraits/           Hero portrait images (GIFs/PNGs, per franchise)
    heroes/              Additional hero art
    blacksmith/          Weapon sprite sheets (7 PNG sheets, 128×128 cells)
  src/
    api/                 Axios wrappers per domain
      client.ts          Base Axios instance (JWT header injection)
      playerApi.ts       Player/hero/summon endpoints
      equipmentApi.ts    Equip/unequip/sell endpoints
      battleApi.ts       Battle trigger + log fetch
      blacksmithApi.ts   Crafting/refine/materials endpoints
      ...
    components/          Reusable UI components
      Equipment/
        EquipmentTooltip.tsx  — Renders item/ability tooltip with all stats + spells
        AbilitySlot.tsx       — Single ability display
        ItemSlot.tsx          — Single item display
      Battle/
        BattleAnimator.tsx    — Animated battle replay
      Arena/
        TeamInspectBody.tsx   — Opponent team inspection popup
      Layout/
        Navbar.tsx            — Top bar with hero lineup
        Sidebar.tsx           — Left panel navigation
    pages/               Full page views
    types/index.ts        ALL shared TypeScript interfaces
    utils/
      summonStatConfig.ts   — Summon stat label/key mapping config
```

---

## 4. Authentication & Player Account

- **Register**: email + username + password. Email confirmation required before login.
- **Login**: returns JWT token stored in `localStorage`. Axios client injects it as `Authorization: Bearer <token>`.
- **Profile image**: determined by which heroes the player owns. Each `hero_template` has an `image_path`; as heroes are purchased, those paths unlock as choosable avatars.
- **Team name**: separate from username, shown to other players in Arena. Can be changed with a cooldown.

---

## 5. Currency & Resources

### Gold
Primary currency. Used for almost everything: hero purchases, ability purchases, item purchases, stat upgrades, team upgrades, blacksmith crafting.

### Diamonds
Premium currency. Used for: Extra Lineup slot, Energy Plus upgrade, Double Spin.

### Arena Energy & World Energy
Separate pools, each with a cap of **120** base (**140** with Energy Plus upgrade).
- Regenerates automatically via server-side ticks.
- **Base rate**: 1 energy per tick.
- **Energy Gain Upgrade** (200,000g): doubles to 2 per tick.
- Spent when challenging opponents:

| Challenge Type | Energy Cost |
|---------------|-------------|
| Self (vs own team) | 0 |
| Return challenge (responding to someone who hit you) | 4 |
| Direct challenge vs online player | 5 |
| Direct challenge vs offline player | 7 |

---

## 6. The Stats System

### 6.1 The 6 Core Stats

Every hero has these 6 stats. They grow every level:

```
final_stat = baseValue + growthValue × (level − 1)
```

| Stat | Role in battle |
|------|---------------|
| **PA (Physical Attack)** | Contributes `PA × 0.5` to raw damage. Affected by stamina and physical immunity. |
| **MP (Magic Power)** | Contributes `MP × roll` where roll ∈ [0.1, 1.0) is random each turn. Affected by stamina and magic immunity. |
| **DEX (Dexterity)** | Contributes `DEX × (0.33 + dexProficiency)` to raw damage. Partially immune to stamina via dexPosture. Consumed each turn and partially recovered. |
| **Element** | Elemental affinity bonus. Counters grant 10% bonus damage (see §12.5). |
| **Mana** | Shared pool for the whole team per battle. Spells cost mana; team runs out if over-spellcasting. Regenerates via Mana Recharge sub-stat. |
| **Stamina** | Governs battle endurance. Stamina effectiveness: `staEff = min(1.0, stamina / (60 + level × 2.5))`. Determines how much damage is retained on consecutive wins (see §12.3). |

### 6.2 Sub-Stats (Combat Modifiers)

Provided exclusively by equipment (items, abilities, weapons, summon bonuses). Values are additive across all equipped gear.

#### Damage Amplifiers
| Sub-stat | Range | Effect |
|----------|-------|--------|
| `attack` | flat | Flat damage added AFTER stamina calculation — stamina-immune. Never reduced by consecutive wins. |
| `magicProficiency` | [0, 1] | Probability of re-rolling MP's random factor and taking the better result. |
| `critChance` | [0, 1] | Probability of landing a critical hit. |
| `critDamage` | [0, 1] | Bonus multiplier on crits. Final crit multiplier = `1.5 + critDamage`. |
| `dexProficiency` | [0, 1] | Added to DEX factor (base 0.33). Higher = more DEX damage. |
| `dexPosture` | [0, 1] | Fraction of DEX consumption that is stamina-immune (DEX damage persists through fatigue). |
| `dexMaxPosture` | [0, 1] | Fraction of max DEX recovered per turn (on top of normal recovery). |

#### Defenses (defender-side, capped at 90%)
| Sub-stat | Reduces |
|----------|---------|
| `physicalImmunity` | PA damage taken |
| `magicImmunity` | MP damage taken |
| `dexEvasiveness` | DEX damage taken |

#### Spell Mechanics
| Sub-stat | Effect |
|----------|--------|
| `spellMastery` | Multiplies T3+ spell stat bonuses by `(1 + spellMastery)`. Also reduces spell mana cost. |
| `spellActivation` | Added to spell trigger chance. Overflow above 100% = guaranteed cast + overflow% chance to double it. |
| `manaRecharge` | Percent of missing mana regenerated per round: `regen = missingMana × manaRecharge`. |
| `spellLearn` | Probability to learn an opponent's spell that just fired (can cast it next turn). |
| `spellCopy` | Probability to copy the bonuses of an opponent's spell at 0 mana cost. |
| `spellAbsorb` | Probability to absorb an opponent's incoming spell, restoring mana instead of taking the effect. |

#### Progression & Utility
| Sub-stat | Effect |
|----------|--------|
| `expBonus` | Additive % bonus XP from battles. |
| `goldBonus` | Additive % bonus gold from battles. |
| `itemDiscovery` | Probability per battle of gaining +1 bonus gold. |
| `offPositioning` | Stamina penalty when hero is placed in wrong tier slot (reduces effectiveness when misslotted). |
| `tenacity` | Reduces stamina degradation from consecutive wins. `reducedPenalty = (1−stam) × 200 / (200 + tenacity)`. |
| `fatigueRecovery` | Shifts the capacity window upward after consecutive wins. `stamina = min(1.0, stamina + fatigueRecovery)`. |
| `cleanse` | Per-turn probability to remove all Rot afflictions and debuffs. |

#### Special / Summon Stats
| Sub-stat | Effect |
|----------|--------|
| `rot` | Applied by summons. A damage-over-time debuff that reduces all three defenses multiplicatively over multiple turns. Duration = `3 + ceil((dexProf − 0.30) / 0.10)` turns. Max reduction = `min(0.75, 0.50 + dexProf × 0.50)`. Stacks increase reduction by 0.03 per stack (max 0.15). Crits extend Rot by 1 turn. Cleanse removes it. |

---

## 7. Heroes

### 7.1 HeroTemplate (the blueprint)
Defined in `data.sql`. Fields:
- `name` — internal key (e.g. `"kakashi"`)
- `display_name` — shown to players (e.g. `"Kakashi"`)
- `image_path` — relative path to portrait image
- `cost` — gold purchase price
- `capacity` — team capacity consumed (typically 20–50+)
- `tier` — COMMONER / ELITE / LEGENDARY (affects off-positioning)
- `element` — default element (can be changed by player)
- `is_starter` — if true, hero is given to new players, hidden from shop
- Base stats + growth per level: `pa, mp, dex, element, mana, stamina` and their `_growth` equivalents

**Current hero roster** (10 heroes, all Naruto):
Konohamaru-Genin, Sakura, Hidan, Konan, Kabuto, Kakashi, Deidara, Minato, Hashirama, Zabuza

### 7.2 Hero Instance (player-owned)
One row per hero per player. Tracks:
- Current level and XP
- Capacity override (player can spend gold to halve a hero's capacity requirement)
- Element override (player can change the element)
- Bonus stats from purchases (`bonus_pa`, `bonus_mp`, etc.)
- Unallocated stat points (earned on level-up)
- Seal (0–3) and seal change count
- Battle statistics: clashes won/lost, win/loss streaks (current and best), max damage dealt/received, total damage by type, stat purchase count, stat reset count

### 7.3 Seal System
- Each hero has a seal value (0–3) and a seal change counter.
- Seals are displayed as elemental affinity markers in the UI.
- Changing seals costs resources (gold/diamonds scaled to change count).
- `changeSeal(direction: 'up' | 'down')` — cycles seal value.

### 7.4 Stat Purchase System
Players can spend gold to permanently increase a hero's base stats:

```
nextCost = 100 + purchaseCount × 50
```

- Each purchase grants **1 stat point** allocatable to any of the 6 core stats.
- **Stat Reset** (requires Stat Reset Unlock upgrade, 15,000g):
  - Refunds all allocated points; player re-allocates from scratch.
  - Reset cost: `500 × (resetCount + 1)` (increases each reset).

### 7.5 Hero Capacity Override
Spending gold can halve a hero's capacity cost (once per hero), allowing more heroes in the team without hitting the capacity limit.

---

## 8. Summons

Summons occupy **slot 7** of the team (the single summon slot). They do not fight directly in battle but apply team-wide passive bonuses to all 6 heroes.

### SummonTemplate Stats
Summons have base + growth values for:
- Mana, MP, Magic Proficiency, Spell Mastery, Spell Activation
- Crit Chance, Crit Damage
- DEX, Dex Proficiency, Dex Posture
- Gold Bonus, Item Find, XP Bonus
- Attack, Stamina, Physical Attack
- Physical Immunity, Magic Immunity, Dex Evasiveness
- Mana Recharge, Spell Learn, Spell Copy, Spell Absorb, Rot

All stat values: `final = baseValue + growthValue × (level − 1)`

Summon bonuses are added to EVERY hero's effective stats before battle.

**Current summons** (from data.sql): Mike Zoldyck and others (One Piece / HxH franchise).

---

## 9. Equipment — Items & Abilities

Each hero has **3 equipment slots** (shared between items and abilities). An item or ability occupies one slot. Unequipped ones sit in the player's inventory.

### 9.1 Items (Weapons / Gear)
Defined in `item_template`. An `equipped_item` links a player's copy to a hero+slot.

**Item bonuses** cover all 6 core stats PLUS all sub-stats (see §6.2).

Items can have **weapon spells** — active effects that trigger during battle (see §10.2).

**Weapon tiers**: COMMON, EPIC, LEGENDARY (affects crafting, UI glow color).

**Craftable items** have `is_craftable = true` and a matching `weapon_recipe`.

### 9.2 Abilities
Defined in `ability_template`, linked to a specific hero template.

**Ability tiers**: T1, T2, T3, T4 — higher tiers have stronger bonuses.
- T3+ abilities interact with the `spellMastery` sub-stat.
- T3+ abilities always grant **ability spells** (see §10.1).

Each hero has **4 ability tiers** (T1–T4). Players buy them from the Shop.

### 9.3 Copies
The game tracks how many copies of an item or ability a player owns (`equippedAbilityRepository.countByPlayerAndAbilityTemplate`). Displayed as "COPIES N" in tooltips.

---

## 10. The Spell System

Spells are active effects that trigger under specific conditions during battle. There are three spell sources:

### 10.1 Ability Spells (`ability_spell` table)
Each `ability_template` can have **0, 1, or 2** ability spells. Stored in the `ability_spell` table (separate from the old inline `spell_name` column on `ability_template` which is legacy and unused).

Fields per spell:
- `spell_name`, `spell_trigger`, `spell_chance`, `spell_mana_cost`
- `max_usages` (0 = unlimited), `lasts_turns` (0 = instant)
- `affects_opponent` — if true, bonuses are debuffs applied to the enemy
- `pass_on_type` — NEXT / TEAM / BATTLEFIELD (see §10.4)
- 27 bonus columns covering all sub-stats

**Who builds spell JSON maps?** → `AbilitySpellBuilder` (`util/AbilitySpellBuilder.java`).
This is the single source of truth injected into `EquipmentService`, `ShopService`, and `TeamService`. Never duplicate this logic elsewhere.

### 10.2 Weapon Spells (`weapon_spell` table)
Each `item_template` (weapon) can have multiple weapon spells. Same structure as ability spells but mapped from `WeaponSpell` entity.

### 10.3 Spell Triggers

| Trigger | When it fires |
|---------|--------------|
| `ENTRANCE` | When the hero first enters battle (once per hero per battle) |
| `OPPONENT_ENTRANCE` | When the opposing hero enters (or when you enter and they're already there) |
| `ATTACK` | Every clash turn |
| `AFTER_CLASH` | After every clash result is determined |
| `AFTER_CLASH_CRIT` | Only after a clash that resulted in a critical hit |
| `BEFORE_TURN_X` | Before turn number X (configurable threshold) |
| `AFTER_TURN_X` | After turn number X |

### 10.4 Pass-On Types

| Type | Effect |
|------|--------|
| `NEXT` | Active buffs carry over to the next hero when the current one falls |
| `TEAM` | Buffs carry to ALL subsequent heroes |
| `BATTLEFIELD` | Permanent for the entire battle (affects both teams in some cases) |

### 10.5 Spell Mechanics (Advanced)

**Overflow**: If `spellChance + spellActivation > 1.0`, the spell is guaranteed to fire AND has `(chance + activation − 1.0)` probability to fire a second time (doubled effect).

**Spell Mastery**: T3 ability spells have their stat bonuses multiplied by `(1 + spellMastery)` and their mana costs reduced proportionally.

**Spell Learn**: When an opponent's spell fires, there's a `spellLearn` probability the current hero "learns" it and can cast it on a future turn.

**Spell Copy**: When an opponent's spell fires, there's a `spellCopy` probability the hero copies the bonuses at 0 mana cost.

**Spell Absorb**: When an opponent casts a spell, there's a `spellAbsorb` probability to intercept it, negating the effect and restoring mana equal to the spell's cost.

**Duration**: Spells with `lasts_turns > 0` create "active buffs" tracked per hero. Each round, remaining duration is decremented. Buff applies each turn until expired.

### 10.6 Frontend Tooltip Rendering
`EquipmentTooltip.tsx` is the single component that renders spell data in tooltips — Team page, Shop, Arena inspection, Hero detail, Inventory all reuse it. It receives `spells?: SpellInfo[]` and renders each spell block with:
- Red border/background for `affectsOpponent = true` (debuffs, skull icon)
- Blue border/background for self-buffs (star icon)
- Trigger badge (ON ENTER, ON ATTACK, AFTER CLASH, etc.)
- Duration badge ("Lasts N turns"), Usage limit badge ("Max N×"), Pass-on badge (NEXT/TEAM/BATTLEFIELD)
- Stat bonuses (values < 1 displayed as %, negative values in red)

---

## 11. Team Building

### 11.1 Slots
- **Slots 1–6**: Heroes (order matters for battle sequence)
- **Slot 7**: One summon (passive bonuses only)

### 11.2 Capacity
Every hero and summon has a capacity cost. The team's total capacity cannot exceed the player's cap:
- **Base cap**: 100
- **Capacity Plus** upgrade: +10 (can be purchased once, bringing total to 110)

Capacity can be reduced per-hero by paying gold to halve that hero's cost.

### 11.3 Tier Slots & Off-Positioning
The 6 hero slots are divided into tiers:
- **Slots 1–2**: COMMONER tier
- **Slots 3–4**: ELITE tier
- **Slots 5–6**: LEGENDARY tier

If a hero's template tier doesn't match the slot tier, they suffer an **off-positioning stamina penalty**:

```
required = tierBase + level × 3
  (COMMONER base: 50, ELITE base: 100, LEGENDARY base: 150)

maxPenalty = 0.80 (COMMONER), 0.65 (ELITE), 0.50 (LEGENDARY)

penalty = maxPenalty × max(0, 1 − stamina / required)
stamina_after = stamina × (1 − penalty)
```

The `offPositioning` sub-stat on items/abilities REDUCES this penalty further.

### 11.4 Team Setups
Players can save multiple team configurations:
- **Base**: 1 lineup (Arena + World share the same team but can be overridden)
- **Extra Lineup Gold** (2,000g): +1 saved setup
- **Extra Lineup Diamonds** (100d): +1 saved setup
- Maximum 4 setups total

---

## 12. The Battle System

Battles are fully automated. The algorithm runs server-side in `BattleService.java`, using `BattleCalculator.java` for pure math.

### 12.1 Pre-Battle Setup

For both teams:
1. Load heroes in slot order (1–6) + summon bonuses.
2. Compute effective stats per hero (base + growth×level + equipment bonuses + summon bonuses + spell-applied bonuses).
3. Initialize per-hero tracking: current DEX, Rot state, consecutive wins, active buffs, learned spells.
4. Initialize team-wide mana pool = sum of all hero Mana stats.
5. Calculate team-wide Gold Bonus, Item Discovery, Exp Bonus (additive across all heroes' gear).

### 12.2 The Round Loop

```
while (both teams have heroes remaining):
  challenger = first alive hero in challenger queue
  defender = first alive hero in defender queue

  1. Fire ENTRANCE spells (if hero is new to battle)
  2. Fire OPPONENT_ENTRANCE spells (if applicable)
  3. Tick active buffs (decrement duration, apply persistent effects)
  4. Cleanse check (remove Rot if cleanse proc)
  5. Apply Rot (reduce defender immunities multiplicatively)
  6. Fire ATTACK spells (for both heroes)
  7. Fire BEFORE_TURN_X spells (if turn threshold met)
  8. Process spell learning / copying / absorbing
  9. Calculate DEX values for this turn (using current DEX state)
  10. Calculate stamina modifier (capacity degradation from consecutive wins)
  11. Apply off-positioning penalty (if hero misslotted)
  12. Apply tenacity boost
  13. Apply fatigue recovery boost
  14. Calculate attacker's attack: BattleCalculator.calculateAttack(...)
  15. Calculate defender's counter-attack: BattleCalculator.calculateAttack(...)
  16. Determine round winner (higher attack value wins)
  17. Update DEX state (consumed + recovery)
  18. Apply element bonus to winning attack
  19. Extend Rot if crit occurred
  20. Apply new Rot affliction (from summon bonuses)
  21. Apply mana recharge (both teams)
  22. Fire AFTER_CLASH spells
  23. Fire AFTER_CLASH_CRIT spells (if crit occurred)
  24. Loser hero is retired (removed from queue)
  25. Award XP, update streaks, record damage stats
  26. Winner hero increments consecutive wins counter
```

### 12.3 Stamina / Capacity Degradation

A hero's attack power degrades as they fight consecutive opponents without resting. The **Turn Capacity** table:

| Consecutive Wins | Capacity |
|-----------------|----------|
| 0 | 100% |
| 1 | 60% + 35% × staEff |
| 2 | 30% + 50% × staEff |
| 3 | 10% + 55% × staEff |
| 4 | 0% + 50% × staEff |
| 5 | 0% + 35% × staEff |
| 6 | 0% + 20% × staEff |
| 7+ | 0% + 5% × staEff |

Where `staEff = min(1.0, stamina / (60 + level × 2.5))`.

The `attack` flat bonus is **entirely immune** to this degradation — it always applies at full value, making it uniquely powerful for sustained fights.

### 12.4 The Attack Formula

```
// Immunities capped at 90%
physImmunity = min(0.9, defenderPhysicalImmunity)
magicImmunity = min(0.9, defenderMagicImmunity)
dexEvasion = min(0.9, defenderDexEvasiveness)

// Raw contributions
paRaw  = PA × 0.5 × (1 − physImmunity)
mpRoll = random(0.1, 1.0)   // rerolled if magicProficiency procs
mpRaw  = MP × mpRoll × (1 − magicImmunity)
dexRaw = DEX × (0.33 + dexProficiency) × (1 − dexEvasion)

// Stamina application
// Note: DEX is partially immune via dexPosture
dexStaminaMod = staminaMod + dexPosture × (1 − staminaMod)
paContrib  = paRaw × staminaMod
mpContrib  = mpRaw × staminaMod
dexContrib = dexRaw × dexStaminaMod

preCrit = paContrib + mpContrib + dexContrib + attackBonus

// Critical hit
if random() < critChance:
  critBonus = paContrib × (1.5 + critDamage − 1.0)  // extra on top of base 1.5×
  final = preCrit + critBonus
else:
  final = preCrit

// Element bonus applied separately after
```

### 12.5 Element Counter System

| Attacker Element | Counters | Bonus |
|-----------------|----------|-------|
| Fire | Wind | +10% |
| Water | Fire | +10% |
| Lightning | Earth | +10% |
| Wind | Lightning | +10% |
| Earth | Water | +10% |

### 12.6 DEX Lifecycle

DEX is consumed each turn as "energy" for attacks, then partially recovered:

```
dexUsed     = currentDex × (0.33 + dexProficiency)
dexRecovered = dexPosture × dexUsed + dexMaxPosture × maxDex
nextDex     = max(0, currentDex − dexUsed + dexRecovered)
```

A hero with no DEX recovery (0 dexPosture, 0 dexMaxPosture) will see their DEX drained to 0 quickly.

### 12.7 Rot Affliction

Applied by the summon's `rot` stat. Each turn:
- Reduces all three defenses of the afflicted hero multiplicatively.
- `duration = 3 + ceil((summonDexProf − 0.30) / 0.10)` turns.
- `maxReduction = min(0.75, 0.50 + summonDexProf × 0.50)`.
- Stacking adds 0.03 per stack (max 0.15 additional reduction).
- Crits extend duration by 1 turn.
- `cleanse` sub-stat can remove all Rot each turn with probability = cleanse value.

### 12.8 Battle Rewards

| Outcome | Gold | XP |
|---------|------|----|
| Win | `round(2 × (1 + goldBonus))` | `4 + 2 × defenderHeroLevel` |
| Loss | `round(1 × (1 + goldBonus))` | 0 |

- `itemDiscovery`: additive probability per battle of +1 bonus gold.
- `expBonus`: additive % multiplier on XP earned per hero.

All battles are recorded to `battle_log` with full round-by-round data for replay.

---

## 13. The Arena & World

### 13.1 Arena
PvP battles against other players. The Arena tab shows the leaderboard of all players sorted by team power.

**Challenge limits** (per opponent, per 24h rolling window):
- **Direct challenges**: 7 base / 12 with Challenge Limit upgrade
- **Return challenges**: 5 base / 10 with Return Cap upgrade
- A "return challenge" is available when someone has challenged you (you can strike back at 4 energy instead of 5–7)

Online players cost 5 energy to challenge; offline cost 7.

### 13.2 World
PvE battles against scripted opponents. Uses `worldEnergy` instead of `arenaEnergy`. Separate challenge sets with fixed opponents (defined in data).

### 13.3 Self-Challenge
Players can always battle their own team (0 energy). Useful for testing setups.

---

## 14. XP & Leveling

### 14.1 XP Formula
```
xpToNextLevel = level × level × 10
```
Examples: Level 1→2 = 10 XP, Level 5→6 = 250 XP, Level 10→11 = 1,000 XP, Level 20→21 = 4,000 XP.

### 14.2 Battle XP
- Winner hero gains `4 + 2 × defenderHeroLevel` XP.
- Loser heroes gain 0.
- Team-wide `expBonus` (from equipment/summon) multiplies XP: `finalXp = round(baseXp × (1 + expBonus))`.

### 14.3 Level-Up Rewards
- Each level-up grants **1 unallocated stat point**.
- Stat points are spent on any of the 6 core stats via the Stat Purchase system.
- Purchase costs: `100 + purchaseCount × 50` (per hero).

### 14.4 XP Tracking
All XP gains are logged to `hero_xp_log` (hero, amount, timestamp). The Dashboard aggregates this into Today / This Week / This Month / All Time views per hero.

---

## 15. The Upgrade System

One-time permanent upgrades purchased by the player (not per-hero).

| Upgrade | Cost | Effect |
|---------|------|--------|
| Extra Lineup (Gold) | 2,000g | +1 team setup slot |
| Extra Lineup (Diamonds) | 100d | +1 team setup slot |
| Energy Plus | 40d | Max energy 120 → 140 |
| Hero Capacity Plus | 4,000g | Hero roster cap 20 → 40 |
| Capacity Plus | 8,000g | Team capacity 100 → 110 |
| Stat Reset Unlock | 15,000g | Enables hero stat resets |
| Battle Log | 500g | Unlocks battle history viewer |
| Double Spin | 50d | 2 blacksmith spins/day instead of 1 |
| Extra Crafting Slot | 4,000g | 2 simultaneous crafting jobs |
| Return Cap Upgrade | 8,000g | Return challenges 5 → 10 |
| Challenge Limit Upgrade | 13,000g | Direct challenges 7 → 12 per opponent |
| Energy Gain Upgrade | 200,000g | Energy regeneration 1× → 2× per tick |

---

## 16. The Blacksmith (Crafting)

The Blacksmith page has three tabs: **Materials**, **Craft Weapons**, **Refine Materials**.

### 16.1 Materials

120 material types across 5 tiers. Stored in `player_material` (player + material_template + quantity).

Tier colors:
- T1: `#9ca3af` (gray)
- T2: `#60a5fa` (blue)
- T3: `#a78bfa` (purple)
- T4: `#f97316` (orange)
- T5: `#fbbf24` (gold)

Materials are displayed using a sprite sheet system:
- 7 PNG sprite sheets in `public/blacksmith/` (1024×1024 each)
- Cell size: **128×128 px**
- 8 columns per sheet
- Icon key format: `"sheetName:col:row"` (0-based)

### 16.2 Craft Weapons

80 craftable weapons (COMMON / EPIC / LEGENDARY). Each weapon has a `weapon_recipe` that lists required materials and quantities.

Crafting consumes the materials and creates an `equipped_item` in the player's inventory.

### 16.3 Refine Materials

90 material-to-material recipes. Lower tier materials can be refined into higher tier ones. Each `material_recipe` specifies inputs and outputs.

### 16.4 Daily Spin

Players receive 1 (or 2 with Double Spin) material spins per day. Spins grant random materials weighted by rarity.

---

## 17. The Shop

Three tabs: **Heroes**, **Summons**, **Abilities** (per hero), **Items**.

- Heroes and summons appear if not yet owned by the player.
- Abilities appear per-hero (tabs within the abilities section), filtered by what the player hasn't bought.
- Items are available for direct purchase.
- Buying costs gold. Buying a hero unlocks their portrait as a selectable avatar.

---

## 18. Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| `HomePage` | `/` | Dashboard: period stats, XP chart, team lineup, win rate ring |
| `BattlePage` | `/battle` | Battle log viewer with animated replay (`BattleAnimator`) |
| `TeamPage` | `/team` | Team assembly: hero slots, capacity bar, equipment quick-view, lineup manager |
| `HeroDetailPage` | `/hero/:id` | Individual hero: stats breakdown, equipment slots, stat purchase, seal UI |
| `ShopPage` | `/shop` | Purchase heroes, summons, abilities, items |
| `InventoryPage` | `/inventory` | Manage unequipped items and abilities, sell, inspect |
| `AccountPage` | `/account` | Profile: avatar, team name, upgrade purchases |
| `GuidePage` | `/guide` | In-game documentation of all mechanics (interactive sliders for formulas) |
| `BlacksmithPage` | `/blacksmith` | Crafting: materials, weapon forge, material refine |
| `ArenaPage` | `/arena` | Arena leaderboard, challenge buttons |

### Key Components

**`EquipmentTooltip`** (`components/Equipment/EquipmentTooltip.tsx`)
Reusable tooltip for items and abilities. Shows: stats grid (PA/MP/DEX/ELEM/MANA/STAM), all spell blocks (trigger, chance, duration, bonuses), tier, copies, sell price. Uses `createPortal` to render above all other elements.

**`BattleAnimator`** (`components/Battle/BattleAnimator.tsx`)
Animates battles round by round: hero portraits, damage numbers, spell events, stamina/DEX/mana bars, crit flashes.

**`Navbar`** (`components/Layout/Navbar.tsx`)
Top bar showing the player's hero lineup as portrait thumbnails with level badges and XP bars. NOT the same as `TeamSlot.tsx` on the Team page — always edit `Navbar.tsx` for the top bar.

**`TeamInspectBody`** (`components/Arena/TeamInspectBody.tsx`)
Popup shown when inspecting an Arena opponent's team. Shows hero portraits, gear slots with `EquipmentTooltip`, XP bars.

---

## 19. Backend Services

| Service | Responsibility |
|---------|---------------|
| `BattleService` | Runs the full battle loop. Builds `BattleLog`. Awards XP/gold. Calls `BattleCalculator`. |
| `ArenaService` | Builds opponent list. Validates challenge eligibility. Energy deduction. |
| `EquipmentService` | Get/equip/unequip items and abilities. Builds `HeroEquipmentResponse` with full spell data. |
| `ShopService` | Lists purchasable heroes/summons/abilities/items. Handles purchases. |
| `TeamService` | Manages team slot assignments and saved lineups. Builds team inspection responses. |
| `PlayerService` | Hero/summon management: sell, halve capacity, buy stats, allocate stats, change element/seal. |
| `DashboardService` | Aggregates XP logs and battle stats into period-based dashboard data. |
| `UpgradeService` | Validates and applies one-time upgrade purchases (gold/diamond deduction + flag setting). |
| `BlacksmithService` | Materials inventory, weapon crafting (recipe validation + material deduction + item creation), material refining. |
| `AccountService` | Profile image changes, team name changes (with cooldown), avatar unlocking. |
| `AuthService` | Register, confirm email, login (JWT), forgot/reset password. |
| `EnergyService` | Tick-based energy regeneration. Called periodically to top up energy. |
| `FriendService` | Friend requests, friend list (social feature). |
| `ChatService` | In-game chat (real-time messages). |

### `AbilitySpellBuilder` (util)
**The single source of truth** for converting `AbilityTemplate` → spell JSON maps. Injected into `EquipmentService`, `ShopService`, and `TeamService`. Any change to spell serialization format must be made here only.

### `BattleCalculator` (util)
Pure static math — no Spring, no DB. Takes stats maps and modifier records, returns `AttackBreakdown`. Deterministic given the same RNG seed (uses `ThreadLocalRandom`).

---

## 20. Database Schema

### Core Tables

```sql
player                  — accounts, gold, diamonds, energy, upgrade flags
hero_template           — hero blueprints (base stats, growth, cost, tier)
hero                    — player-owned hero instances (level, XP, bonus stats, streaks)
summon_template         — summon blueprints
summon                  — player-owned summon instances
item_template           — equipment blueprints (stats, cost, craftable flag)
ability_template        — ability blueprints (tier, stats, hero-specific)
equipped_item           — player's item copies (links to item_template, hero, slot)
equipped_ability        — player's ability copies (links to ability_template, hero, slot)
weapon_spell            — spells attached to item_templates
ability_spell           — spells attached to ability_templates (NEW table, multi-spell)
team_slot               — current team arrangement (hero/summon per slot)
team_setup              — saved lineup configurations
team_setup_slot         — slots within a team setup
battle_log              — full battle records (JSON round data)
hero_xp_log             — per-hero XP earned per battle (timestamp)
player_material         — blacksmith material quantities per player
material_template       — 120 material types (name, tier, icon_key)
weapon_recipe           — which materials craft which weapon
weapon_recipe_ingredient — material + quantity per weapon recipe
material_recipe         — which materials produce which material
material_recipe_ingredient — ingredient list for material recipes
```

### Important Notes on `ability_spell`
- **Created by Hibernate** from `AbilitySpell.java` entity (`@Table(name = "ability_spell")`).
- **Seeded by `data.sql`** via `INSERT INTO ability_spell ... SELECT ... FROM ability_template ... WHERE NOT EXISTS (...)`.
- **DO NOT** use the old inline `spell_name`, `spell_trigger`, etc. columns on `ability_template` for new code. They are legacy. Query `ability_spell` via `AbilitySpellRepository`.
- If `ability_spell` is empty despite data.sql having inserts, delete `backend/data/heromanager.mv.db` and restart to force a full re-seed.

---

## 21. Key Conventions & Patterns

### Backend

**Map-based JSON responses**
Most service methods return `Map<String, Object>` (or `List<Map<String, Object>>`), serialized to JSON by Jackson. DTOs (Java records) are used where the shape is fixed. The `LinkedHashMap` preserves insertion order in JSON.

**`Map.of()` vs `LinkedHashMap`**
`Map.of()` does NOT allow null values — will throw `NullPointerException`. Use `LinkedHashMap` when any value might be null (e.g. individual slot entries).

**Idempotent SQL**
All `data.sql` INSERTs use `NOT EXISTS` guards:
```sql
INSERT INTO foo (...) SELECT ... WHERE NOT EXISTS (SELECT 1 FROM foo WHERE ...);
```
`CREATE TABLE IF NOT EXISTS` for tables not managed by Hibernate.

**Naming strategy**
Spring Boot's `SpringPhysicalNamingStrategy` converts camelCase field names → snake_case column names. This applies to `@Column.name` and `@JoinColumn.name` attributes too. Example: `spellBonusPa` → `spell_bonus_pa`.

### Frontend

**TypeScript interfaces in `types/index.ts`**
All shared types live here. Never duplicate types across files.

**Gold symbol**
**Always** use `<Coins size={X} />` from `lucide-react` colored `#fbbf24`. Never use 🪙 emoji or any other symbol.

**Inline styles**
All component styles use `Record<string, React.CSSProperties>` objects defined at file bottom. The project does not use CSS modules or styled-components.

**EquipmentTooltip is universal**
One component renders ALL ability/item tooltips. It accepts `spells?: SpellInfo[]`. To add a new tooltip location, just render `<EquipmentTooltip>` with the correct props — never build a custom tooltip.

**Navbar ≠ TeamSlot**
The top hero lineup (portrait row) is in `Navbar.tsx`. The Team page slot cards are in `TeamPage.tsx`. These are completely separate components.

**Hero portrait paths**
Served as relative paths from `public/`. Rendered via `HeroPortrait` component. Path format: `Portraits/Naruto/Heroes/kakashi.gif`.

**H2 console (dev)**
Available at `http://localhost:8080/h2-console`. JDBC URL: `jdbc:h2:file:./data/heromanager`. Use for direct SQL inspection when debugging missing data.

---

*Last updated: 2026-03-20. Covers all features through the Blacksmith system and multi-spell ability system.*
