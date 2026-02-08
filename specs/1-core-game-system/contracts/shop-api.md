# Shop API Contract

**Base path**: `/api/shop`
**Auth**: All endpoints require `Authorization: Bearer {jwt}` header.

## GET /api/shop/heroes

List all heroes available for purchase.

**Response 200**:
```json
{
  "heroes": [
    {
      "templateId": 2,
      "name": "Deidara",
      "displayName": "Deidara",
      "imagePath": "deidara.gif",
      "cost": 400,
      "capacity": 20,
      "baseStats": {
        "physicalAttack": 8,
        "magicPower": 16,
        "dexterity": 5,
        "element": 12,
        "mana": 32,
        "stamina": 10
      },
      "growthStats": {
        "physicalAttack": 0.9,
        "magicPower": 1.8,
        "dexterity": 0.4,
        "element": 1.5,
        "mana": 1.8,
        "stamina": 0.8
      },
      "owned": false
    }
  ],
  "summons": [
    {
      "templateId": 1,
      "name": "Susanoo Spirit Summon",
      "imagePath": "susanoo-spirit-summon.jpg",
      "cost": 300,
      "capacity": 15,
      "baseStats": { "mana": 10, "magicPower": 5 },
      "growthStats": { "mana": 5, "magicPower": 4 },
      "owned": false
    }
  ]
}
```

**Notes**: `owned: true` means player already owns this hero/summon and cannot buy again.

---

## POST /api/shop/buy-hero

Purchase a hero from the shop.

**Request body**:
```json
{
  "templateId": 2
}
```

**Response 200**:
```json
{
  "message": "Deidara purchased successfully!",
  "heroId": 5,
  "goldRemaining": 100
}
```

**Response 400** (Insufficient gold):
```json
{
  "error": "INSUFFICIENT_GOLD",
  "message": "You need 400 gold but only have 100."
}
```

**Response 400** (Already owned):
```json
{
  "error": "ALREADY_OWNED",
  "message": "You already own Deidara."
}
```

---

## POST /api/shop/buy-summon

Purchase a summon from the shop.

**Request body**:
```json
{
  "templateId": 1
}
```

**Response 200**:
```json
{
  "message": "Susanoo Spirit Summon purchased!",
  "summonId": 1,
  "goldRemaining": 200
}
```

**Error responses**: Same format as buy-hero.

---

## GET /api/shop/items

List all items available for purchase.

**Response 200**:
```json
{
  "items": [
    {
      "templateId": 1,
      "name": "Training Weights",
      "cost": 100,
      "bonuses": { "physicalAttack": 3.0 }
    }
  ]
}
```

---

## POST /api/shop/buy-item

Purchase an item and equip it to a hero.

**Request body**:
```json
{
  "itemTemplateId": 1,
  "heroId": 3,
  "slotNumber": 1
}
```

**Response 200**:
```json
{
  "message": "Training Weights equipped to Kakashi.",
  "goldRemaining": 300
}
```

**Response 400** (Slot occupied / duplicate item on hero / team limit reached / insufficient gold):
```json
{
  "error": "DUPLICATE_ITEM",
  "message": "Kakashi already has Training Weights equipped."
}
```

---

## GET /api/shop/abilities?heroId={id}

List abilities available for a specific hero.

**Response 200**:
```json
{
  "heroName": "Kakashi",
  "abilities": [
    {
      "templateId": 10,
      "name": "Quick Strike",
      "cost": 50,
      "tier": 1,
      "bonuses": { "physicalAttack": 2.0, "dexterity": 1.0 },
      "owned": false
    },
    {
      "templateId": 11,
      "name": "Lightning Blade",
      "cost": 200,
      "tier": 2,
      "bonuses": { "physicalAttack": 4.0, "magicPower": 3.0 },
      "owned": true
    }
  ]
}
```

---

## POST /api/shop/buy-ability

Purchase and equip an ability to a hero.

**Request body**:
```json
{
  "abilityTemplateId": 10,
  "heroId": 3
}
```

**Response 200**:
```json
{
  "message": "Quick Strike learned by Kakashi.",
  "goldRemaining": 250
}
```

**Response 400** (Duplicate / wrong hero / insufficient gold):
```json
{
  "error": "DUPLICATE_ABILITY",
  "message": "Kakashi already knows Quick Strike."
}
```
