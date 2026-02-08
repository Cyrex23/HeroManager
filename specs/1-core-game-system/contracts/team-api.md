# Team API Contract

**Base path**: `/api/team`
**Auth**: All endpoints require `Authorization: Bearer {jwt}` header.

## GET /api/team

Get current player's active team lineup.

**Response 200**:
```json
{
  "capacity": {
    "used": 35,
    "max": 100
  },
  "teamPower": 1245,
  "slots": [
    {
      "slotNumber": 1,
      "type": "hero",
      "hero": {
        "id": 1,
        "name": "Konohamaru Genin",
        "imagePath": "konohamaru-genin.jpg",
        "level": 3,
        "capacity": 5,
        "totalStats": {
          "physicalAttack": 8.6,
          "magicPower": 19.0,
          "dexterity": 3.4,
          "element": 3.4,
          "mana": 22.0,
          "stamina": 12.0
        }
      }
    },
    {
      "slotNumber": 2,
      "type": "hero",
      "hero": null
    },
    {
      "slotNumber": 7,
      "type": "summon",
      "summon": {
        "id": 1,
        "name": "Susanoo Spirit Summon",
        "imagePath": "susanoo-spirit-summon.jpg",
        "level": 2,
        "capacity": 15,
        "teamBonus": "+9 Magic Power"
      }
    }
  ]
}
```

**Notes**:
- `totalStats` includes base stats + growth + item bonuses + ability bonuses + summon bonus.
- `teamPower` is the sum of all equipped heroes' total stats (used for arena sorting).
- Slots 1-6 are hero slots, slot 7 is the summon slot.
- Empty slots have `hero: null` or `summon: null`.

---

## POST /api/team/equip-hero

Equip a hero from the roster to a team slot.

**Request body**:
```json
{
  "heroId": 5,
  "slotNumber": 2
}
```

**Response 200**:
```json
{
  "message": "Hero equipped successfully.",
  "capacity": { "used": 55, "max": 100 }
}
```

**Response 400** (Capacity exceeded):
```json
{
  "error": "CAPACITY_EXCEEDED",
  "message": "Not enough team capacity. Hero requires 20 but only 15 available."
}
```

**Response 400** (Slot occupied):
```json
{
  "error": "SLOT_OCCUPIED",
  "message": "Slot 2 already has a hero. Unequip first."
}
```

**Response 400** (Already equipped):
```json
{
  "error": "HERO_ALREADY_EQUIPPED",
  "message": "This hero is already in your team lineup."
}
```

---

## POST /api/team/unequip-hero

Remove a hero from the team back to the bench.

**Request body**:
```json
{
  "slotNumber": 2
}
```

**Response 200**:
```json
{
  "message": "Hero unequipped.",
  "capacity": { "used": 35, "max": 100 }
}
```

**Response 400** (Slot empty):
```json
{
  "error": "SLOT_EMPTY",
  "message": "No hero in slot 2 to unequip."
}
```

---

## POST /api/team/equip-summon

Equip a summon to the team's summon slot (slot 7).

**Request body**:
```json
{
  "summonId": 1
}
```

**Response 200**:
```json
{
  "message": "Summon equipped successfully.",
  "capacity": { "used": 50, "max": 100 }
}
```

**Response 400** (Capacity exceeded / already equipped): Same error format as equip-hero.

---

## POST /api/team/unequip-summon

Remove the summon from the team.

**Response 200**:
```json
{
  "message": "Summon unequipped.",
  "capacity": { "used": 35, "max": 100 }
}
```

---

## POST /api/team/reorder

Change the order of heroes in the lineup (affects battle order).

**Request body**:
```json
{
  "order": [3, 1, 5, 2, null, null]
}
```

Array of hero IDs in desired slot order (1-6). `null` for empty slots.

**Response 200**:
```json
{
  "message": "Team order updated."
}
```
