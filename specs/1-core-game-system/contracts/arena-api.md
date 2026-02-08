# Arena API Contract

**Base path**: `/api/arena`
**Auth**: All endpoints require `Authorization: Bearer {jwt}` header.

## GET /api/arena/opponents

List all opponents available for challenge.

**Query params** (optional):
- `page` (default: 0)
- `size` (default: 20)

**Response 200**:
```json
{
  "opponents": [
    {
      "playerId": 5,
      "username": "NinjaKing",
      "teamPower": 2340,
      "isOnline": true,
      "heroCount": 4,
      "hasPendingReturn": false,
      "energyCost": 5
    },
    {
      "playerId": 8,
      "username": "ShadowBlade",
      "teamPower": 1890,
      "isOnline": false,
      "heroCount": 3,
      "hasPendingReturn": true,
      "energyCost": 4
    }
  ],
  "totalPlayers": 42,
  "page": 0,
  "size": 20
}
```

**Notes**:
- Sorted by `teamPower` descending.
- Excludes the current player (FR-053).
- `energyCost`: 5 (online), 7 (offline), 4 (return challenge available).
- `hasPendingReturn`: true if this opponent has challenged the current player and the return hasn't been used yet.

---

## POST /api/arena/challenge

Initiate a battle against another player's team.

**Request body**:
```json
{
  "defenderId": 5
}
```

**Response 200**:
```json
{
  "battleId": 42,
  "result": "WIN",
  "goldEarned": 2,
  "energyCost": 5,
  "arenaEnergyRemaining": 110,
  "battleLog": {
    "challenger": {
      "username": "HeroMaster",
      "heroes": ["Kakashi", "Deidara", "Konohamaru Genin"]
    },
    "defender": {
      "username": "NinjaKing",
      "heroes": ["Hidan", "Minato", "Sakura"]
    },
    "rounds": [
      {
        "roundNumber": 1,
        "attackerHero": "Kakashi",
        "attackerLevel": 5,
        "attackerAttackValue": 14.23,
        "defenderHero": "Hidan",
        "defenderLevel": 4,
        "defenderAttackValue": 11.87,
        "winner": "attacker",
        "attackerStaminaModifier": 1.0
      },
      {
        "roundNumber": 2,
        "attackerHero": "Kakashi",
        "attackerLevel": 5,
        "attackerAttackValue": 11.45,
        "defenderHero": "Minato",
        "defenderLevel": 6,
        "defenderAttackValue": 18.92,
        "winner": "defender",
        "attackerStaminaModifier": 0.9
      },
      {
        "roundNumber": 3,
        "attackerHero": "Deidara",
        "attackerLevel": 3,
        "attackerAttackValue": 13.67,
        "defenderHero": "Minato",
        "defenderLevel": 6,
        "defenderAttackValue": 15.34,
        "winner": "defender",
        "defenderStaminaModifier": 0.9
      },
      {
        "roundNumber": 4,
        "attackerHero": "Konohamaru Genin",
        "attackerLevel": 2,
        "attackerAttackValue": 5.12,
        "defenderHero": "Minato",
        "defenderLevel": 6,
        "defenderAttackValue": 12.45,
        "winner": "defender",
        "defenderStaminaModifier": 0.81
      }
    ],
    "winner": "defender",
    "xpGained": {
      "challenger": {
        "Kakashi": 12
      },
      "defender": {
        "Minato": 28
      }
    },
    "summonXp": {
      "challenger": 0,
      "defender": 1
    }
  }
}
```

**Response 400** (Insufficient energy):
```json
{
  "error": "INSUFFICIENT_ENERGY",
  "message": "You need 5 Arena Energy but only have 3. Next energy in 4m 32s."
}
```

**Response 400** (Empty team):
```json
{
  "error": "EMPTY_TEAM",
  "message": "You need at least 1 hero in your team to battle."
}
```

**Response 400** (Self-challenge):
```json
{
  "error": "SELF_CHALLENGE",
  "message": "You cannot challenge your own team."
}
```

**Side effects**:
- Deducts arena energy (5 online / 7 offline / 4 return)
- Sets challenger's online status for 40 minutes
- Awards gold to both players (+2 winner, +1 loser)
- Awards XP to all heroes that defeated opponents
- Awards summon XP (+1 for winning team)
- Creates BattleLog entry
- If this was a return challenge, marks the original challenge's `returnChallengeUsed = true`

---

## GET /api/arena/battle-log

Get recent battles (for return challenge functionality).

**Query params** (optional):
- `page` (default: 0)
- `size` (default: 10)

**Response 200**:
```json
{
  "battles": [
    {
      "battleId": 42,
      "opponentUsername": "NinjaKing",
      "opponentId": 5,
      "result": "WIN",
      "goldEarned": 2,
      "wasChallenger": true,
      "canReturnChallenge": false,
      "returnEnergyCost": null,
      "createdAt": "2026-02-08T14:30:00Z"
    },
    {
      "battleId": 38,
      "opponentUsername": "ShadowBlade",
      "opponentId": 8,
      "result": "LOSS",
      "goldEarned": 1,
      "wasChallenger": false,
      "canReturnChallenge": true,
      "returnEnergyCost": 4,
      "createdAt": "2026-02-08T13:15:00Z"
    }
  ],
  "page": 0,
  "size": 10
}
```

**Notes**:
- `canReturnChallenge`: true only if current player was the defender AND `returnChallengeUsed` is false.
- Shows battles from both perspectives (as challenger and as defender).

---

## GET /api/arena/battle/{battleId}

Get full details of a specific battle.

**Response 200**: Same `battleLog` structure as the challenge response.

**Response 404**: Battle not found or not involving the current player.
