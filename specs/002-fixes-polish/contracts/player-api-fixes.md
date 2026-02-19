# API Contract Fixes: Player & Team

## GET /api/player/heroes

**Change**: Bug fix — add null safety and transactional session management.

### Fix Details

- Add `@Transactional(readOnly = true)` to `PlayerService.getHeroes()`
- Add null check on `hero.getTemplate()` — skip heroes with missing templates
- Fix `isEquipped` boolean serialization with `@JsonProperty("isEquipped")`

**Response shape**: Unchanged.

```json
{
  "heroes": [
    {
      "id": 1,
      "templateId": 1,
      "name": "Konohamaru Genin",
      "imagePath": "konohamaru-genin.jpg",
      "level": 1,
      "currentXp": 0,
      "xpToNextLevel": 10,
      "capacity": 5,
      "isEquipped": true,
      "teamSlot": 1,
      "stats": { "physicalAttack": 5.0, "magicPower": 8.0, ... },
      "bonusStats": { "physicalAttack": 0.0, ... },
      "equippedItems": [],
      "equippedAbilities": []
    }
  ]
}
```

## GET /api/team

**Change**: Bug fix — add null safety and transactional session management.

### Fix Details

- Add `@Transactional(readOnly = true)` to `TeamService.getTeamLineup()`
- Add null checks on `hero.getTemplate()` and `summon.getTemplate()`
- Skip slots with missing entity references gracefully

**Response shape**: Unchanged.

## GET /api/player/summons

**Change**: Bug fix — add null safety and transactional session management.

### Fix Details

- Add `@Transactional(readOnly = true)` to `PlayerService.getSummons()`
- Add null check on `summon.getTemplate()`

**Response shape**: Unchanged.
