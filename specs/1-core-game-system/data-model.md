# Data Model: HeroManager Core Game System

**Date**: 2026-02-08
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Entity Relationship Overview

```
Player 1──1 Team
Player 1──* Hero (roster)
Player 1──* Summon (roster)
Player 1──* BattleLog (as challenger or defender)
Player 1──1 ConfirmationToken

Team 1──* TeamSlot (max 6 heroes + 1 summon)

Hero *──1 HeroTemplate (defines base stats/growth)
Hero 1──* EquippedItem
Hero 1──* EquippedAbility

Summon *──1 SummonTemplate

EquippedItem *──1 ItemTemplate
EquippedAbility *──1 AbilityTemplate

AbilityTemplate *──1 HeroTemplate (hero-specific abilities)
```

## Entities

### Player

Represents a registered user account.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| email | String | Unique, not null, max 255 | Used for login and confirmation |
| username | String | Unique, not null, min 3, max 30 | Also serves as team name in arena |
| passwordHash | String | Not null | BCrypt encoded |
| emailConfirmed | Boolean | Not null, default false | Must be true to log in |
| gold | Integer | Not null, default 500 | Common currency |
| diamonds | Integer | Not null, default 0 | Premium currency (display only) |
| arenaEnergy | Integer | Not null, default 120 | Green energy, max 120 |
| worldEnergy | Integer | Not null, default 120 | Yellow energy, max 120 |
| lastEnergyUpdate | Timestamp | Not null | Used to calculate regen since last check |
| onlineUntil | Timestamp | Nullable | If now < onlineUntil → player is online |
| createdAt | Timestamp | Not null | |

**State transitions**: Unconfirmed → Confirmed (via email link) → Active player

---

### ConfirmationToken

Email confirmation token for account verification.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| token | String (UUID) | Unique, not null | Sent in confirmation email URL |
| playerId | Long | FK → Player, not null | |
| expiresAt | Timestamp | Not null | 24 hours after creation |
| confirmedAt | Timestamp | Nullable | Set when token is used |

**State transitions**: Created → Confirmed (used) / Expired (> 24h)

---

### HeroTemplate

Static definition of a hero type (seeded data). Players purchase instances from these templates.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| name | String | Unique, not null | e.g., "konohamaru-genin" |
| displayName | String | Not null | e.g., "Konohamaru Genin" |
| imagePath | String | Not null | e.g., "konohamaru-genin.jpg" |
| cost | Integer | Not null | Gold cost in shop (0 for starter) |
| capacity | Integer | Not null | Team capacity cost |
| basePa | Double | Not null | Base Physical Attack |
| baseMp | Double | Not null | Base Magic Power |
| baseDex | Double | Not null | Base Dexterity |
| baseElem | Double | Not null | Base Element |
| baseMana | Double | Not null | Base Mana |
| baseStam | Double | Not null | Base Stamina |
| growthPa | Double | Not null | PA growth per level |
| growthMp | Double | Not null | MP growth per level |
| growthDex | Double | Not null | Dex growth per level |
| growthElem | Double | Not null | Elem growth per level |
| growthMana | Double | Not null | Mana growth per level |
| growthStam | Double | Not null | Stam growth per level |
| isStarter | Boolean | Not null, default false | True for Konohamaru-Genin |

---

### SummonTemplate

Static definition of a summon type (seeded data).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| name | String | Unique, not null | e.g., "susanoo-spirit-summon" |
| displayName | String | Not null | |
| imagePath | String | Not null | |
| cost | Integer | Not null | Gold cost in shop |
| capacity | Integer | Not null | Team capacity cost |
| baseMana | Double | Not null | |
| baseMp | Double | Not null | |
| growthMana | Double | Not null | |
| growthMp | Double | Not null | |

---

### Hero

A player-owned instance of a hero, tracking level, XP, and equipped gear.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| playerId | Long | FK → Player, not null | Owner |
| templateId | Long | FK → HeroTemplate, not null | Defines base stats/growth |
| level | Integer | Not null, default 1 | Current level |
| currentXp | Integer | Not null, default 0 | XP accumulated toward next level |
| acquiredAt | Timestamp | Not null | |

**Unique constraint**: (playerId, templateId) — one hero per template per player

**Calculated stats** (not stored, computed on read):
- `stat = base + (growth * (level - 1))`
- Example: PA at level 5 = basePa + (growthPa * 4)

**XP to next level**: `level^2 * 10` (e.g., level 2 needs 40 XP, level 3 needs 90 XP)

---

### Summon

A player-owned instance of a summon.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| playerId | Long | FK → Player, not null | Owner |
| templateId | Long | FK → SummonTemplate, not null | Defines base stats/growth |
| level | Integer | Not null, default 1 | |
| currentXp | Integer | Not null, default 0 | |
| acquiredAt | Timestamp | Not null | |

**Unique constraint**: (playerId, templateId)

**Bonus calculation**: Each hero on the team gets summon's current MP as a bonus.
- Summon MP at level = baseMp + (growthMp * (level - 1))

---

### TeamSlot

Maps heroes and summons to active team positions.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| playerId | Long | FK → Player, not null | |
| slotNumber | Integer | Not null, 1-7 | 1-6 = hero slots, 7 = summon slot |
| heroId | Long | FK → Hero, nullable | Set if hero slot |
| summonId | Long | FK → Summon, nullable | Set if summon slot (slot 7 only) |

**Constraints**:
- Exactly one of heroId/summonId is set per slot
- slotNumber 1-6: heroId only; slotNumber 7: summonId only
- Sum of all equipped heroes/summon capacity must be <= 100 (team capacity)
- Max 6 hero slots + 1 summon slot per player

---

### ItemTemplate

Static definition of an item type (seeded data).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| name | String | Unique, not null | e.g., "Training Weights" |
| cost | Integer | Not null | Gold cost |
| bonusPa | Double | Default 0 | |
| bonusMp | Double | Default 0 | |
| bonusDex | Double | Default 0 | |
| bonusElem | Double | Default 0 | |
| bonusMana | Double | Default 0 | |
| bonusStam | Double | Default 0 | |

---

### EquippedItem

Tracks which items are equipped to which heroes. Players "own" items by equipping them.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| heroId | Long | FK → Hero, not null | |
| itemTemplateId | Long | FK → ItemTemplate, not null | |
| slotNumber | Integer | Not null, 1-3 | Equipment slot on the hero |

**Constraints**:
- Unique (heroId, slotNumber) — one item per slot
- Unique (heroId, itemTemplateId) — no duplicate items on a hero
- Count of same itemTemplateId across all heroes of a player's team must be <= 3

---

### AbilityTemplate

Static definition of an ability type (seeded data). Hero-specific.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| name | String | Not null | e.g., "Power Strike" |
| heroTemplateId | Long | FK → HeroTemplate, not null | Which hero can use this |
| cost | Integer | Not null | 50, 200, 400, or 800 gold |
| tier | Integer | Not null, 1-4 | Price tier (1=50g, 2=200g, 3=400g, 4=800g) |
| bonusPa | Double | Default 0 | |
| bonusMp | Double | Default 0 | |
| bonusDex | Double | Default 0 | |
| bonusElem | Double | Default 0 | |
| bonusMana | Double | Default 0 | |
| bonusStam | Double | Default 0 | |

---

### EquippedAbility

Tracks which abilities are equipped to which heroes.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| heroId | Long | FK → Hero, not null | |
| abilityTemplateId | Long | FK → AbilityTemplate, not null | |

**Constraints**:
- Unique (heroId, abilityTemplateId) — no duplicate abilities on a hero
- The ability's heroTemplateId must match the hero's templateId
- No team-wide limit (unlike items)

---

### BattleLog

Record of a completed arena battle.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Long | PK, auto-generated | |
| challengerId | Long | FK → Player, not null | Who initiated the fight |
| defenderId | Long | FK → Player, not null | Who was challenged |
| winnerId | Long | FK → Player, not null | Who won |
| challengerGoldEarned | Integer | Not null | +2 for win, +1 for loss |
| defenderGoldEarned | Integer | Not null | +2 for win, +1 for loss |
| battleLog | Text (JSON) | Not null | Full text log of the battle |
| energyCost | Integer | Not null | 4, 5, or 7 AE spent |
| isReturnChallenge | Boolean | Not null, default false | True if this was a return challenge |
| returnChallengeUsed | Boolean | Not null, default false | True if defender has returned this |
| createdAt | Timestamp | Not null | |

**Battle log JSON structure** (stored in battleLog field):
```json
{
  "rounds": [
    {
      "roundNumber": 1,
      "attackerHero": "Kakashi",
      "attackerLevel": 5,
      "attackerAttackValue": 12.45,
      "defenderHero": "Deidara",
      "defenderLevel": 3,
      "defenderAttackValue": 9.87,
      "winner": "attacker",
      "staminaModifier": 1.0
    }
  ],
  "winner": "challenger",
  "xpGained": { "Kakashi": 14, "Hidan": 8 },
  "summonXp": { "challenger": 1, "defender": 0 }
}
```

## Seed Data

The following data is loaded on application startup via `data.sql`:

1. **9 HeroTemplates**: Konohamaru-Genin (starter) + 8 shop heroes with stats from research.md
2. **1 SummonTemplate**: Susanoo-Spirit-Summon
3. **10 ItemTemplates**: Starter item set from research.md
4. **36 AbilityTemplates**: 4 per hero (9 heroes x 4 abilities) from research.md
