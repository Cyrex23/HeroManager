# Player API Contract

**Base path**: `/api/player`
**Auth**: All endpoints require `Authorization: Bearer {jwt}` header.

## GET /api/player/me

Get current player's account summary.

**Response 200**:
```json
{
  "id": 1,
  "username": "HeroMaster",
  "gold": 500,
  "diamonds": 0,
  "arenaEnergy": 115,
  "arenaEnergyMax": 120,
  "worldEnergy": 120,
  "worldEnergyMax": 120,
  "nextEnergyTickSeconds": 342,
  "isOnline": true,
  "onlineMinutesRemaining": 28
}
```

**Notes**:
- `arenaEnergy` and `worldEnergy` are calculated at request time using the timestamp-based regeneration formula.
- `nextEnergyTickSeconds` is seconds until the next +1 energy (for either type, whichever is lower). Returns `null` if both at max.
- `isOnline` is derived from `onlineUntil > now()`.

---

## GET /api/player/heroes

Get all heroes in the player's roster (both equipped and bench).

**Response 200**:
```json
{
  "heroes": [
    {
      "id": 1,
      "templateId": 1,
      "name": "Konohamaru Genin",
      "imagePath": "konohamaru-genin.jpg",
      "level": 3,
      "currentXp": 45,
      "xpToNextLevel": 90,
      "capacity": 5,
      "isEquipped": true,
      "teamSlot": 1,
      "stats": {
        "physicalAttack": 6.6,
        "magicPower": 10.0,
        "dexterity": 3.4,
        "element": 3.4,
        "mana": 22.0,
        "stamina": 12.0
      },
      "bonusStats": {
        "physicalAttack": 0,
        "magicPower": 9.0,
        "dexterity": 0,
        "element": 0,
        "mana": 0,
        "stamina": 0
      },
      "equippedItems": [
        { "slotNumber": 1, "itemId": 1, "name": "Training Weights", "bonusPa": 3.0 }
      ],
      "equippedAbilities": [
        { "abilityId": 1, "name": "Power Strike", "bonusPa": 2.0 }
      ]
    }
  ]
}
```

**Notes**:
- `stats` = base + (growth * (level - 1)). Does NOT include item/ability/summon bonuses.
- `bonusStats` = sum of item bonuses + ability bonuses + summon bonus (if on team with summon).
- `xpToNextLevel` = level^2 * 10.

---

## GET /api/player/summons

Get all summons in the player's roster.

**Response 200**:
```json
{
  "summons": [
    {
      "id": 1,
      "templateId": 1,
      "name": "Susanoo Spirit Summon",
      "imagePath": "susanoo-spirit-summon.jpg",
      "level": 2,
      "currentXp": 3,
      "xpToNextLevel": 40,
      "capacity": 15,
      "isEquipped": true,
      "stats": {
        "mana": 15.0,
        "magicPower": 9.0
      },
      "teamBonus": "+9 Magic Power to all team heroes"
    }
  ]
}
```
