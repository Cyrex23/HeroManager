# Equipment API Contract

**Base path**: `/api/equipment`
**Auth**: All endpoints require `Authorization: Bearer {jwt}` header.

## GET /api/equipment/hero/{heroId}

Get all equipment (items + abilities) for a specific hero.

**Response 200**:
```json
{
  "heroId": 3,
  "heroName": "Kakashi",
  "items": [
    {
      "slotNumber": 1,
      "equippedItemId": 5,
      "itemTemplateId": 1,
      "name": "Training Weights",
      "bonuses": { "physicalAttack": 3.0 },
      "sellPrice": 75
    },
    {
      "slotNumber": 2,
      "equippedItemId": null,
      "itemTemplateId": null,
      "name": null,
      "bonuses": null,
      "sellPrice": null
    },
    {
      "slotNumber": 3,
      "equippedItemId": null,
      "itemTemplateId": null,
      "name": null,
      "bonuses": null,
      "sellPrice": null
    }
  ],
  "abilities": [
    {
      "equippedAbilityId": 2,
      "abilityTemplateId": 11,
      "name": "Lightning Blade",
      "tier": 2,
      "bonuses": { "physicalAttack": 4.0, "magicPower": 3.0 }
    }
  ]
}
```

---

## POST /api/equipment/equip-item

Move an item from one hero/slot to another (or equip a newly purchased item).

**Request body**:
```json
{
  "heroId": 3,
  "itemTemplateId": 1,
  "slotNumber": 2
}
```

**Response 200**:
```json
{
  "message": "Training Weights equipped to slot 2."
}
```

**Response 400** (Duplicate on hero):
```json
{
  "error": "DUPLICATE_ITEM_ON_HERO",
  "message": "Kakashi already has Training Weights equipped."
}
```

**Response 400** (Team limit):
```json
{
  "error": "TEAM_ITEM_LIMIT",
  "message": "Your team already has 3 Training Weights equipped (maximum)."
}
```

**Response 400** (Slot occupied):
```json
{
  "error": "SLOT_OCCUPIED",
  "message": "Slot 2 already has an item. Unequip it first."
}
```

---

## POST /api/equipment/unequip-item

Remove an item from a hero's equipment slot.

**Request body**:
```json
{
  "heroId": 3,
  "slotNumber": 2
}
```

**Response 200**:
```json
{
  "message": "Training Weights unequipped from Kakashi."
}
```

---

## POST /api/equipment/sell-item

Sell an equipped item for 75% of its base cost.

**Request body**:
```json
{
  "heroId": 3,
  "slotNumber": 1
}
```

**Response 200**:
```json
{
  "message": "Training Weights sold for 75 gold.",
  "goldEarned": 75,
  "goldTotal": 575
}
```

**Response 400** (No item in slot):
```json
{
  "error": "NO_ITEM",
  "message": "No item in slot 1 to sell."
}
```

---

## POST /api/equipment/unequip-ability

Remove an ability from a hero.

**Request body**:
```json
{
  "heroId": 3,
  "abilityTemplateId": 11
}
```

**Response 200**:
```json
{
  "message": "Lightning Blade unequipped from Kakashi."
}
```

**Note**: Unequipping an ability does NOT refund gold. The ability is lost.
