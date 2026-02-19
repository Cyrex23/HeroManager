# Data Model Changes: Core Game Fixes & Polish

**Date**: 2026-02-11
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Overview

This feature involves **no new entities** and **no schema changes**. All fixes target existing code logic, API responses, and frontend components. One new frontend component (HexStatDiagram) is added but it's purely presentational.

## Entity Changes

### Player (existing — behavior change only)

No schema change. Login logic now checks `onlineUntil` to determine if the player has been inactive for 3+ hours, and grants 20 minutes of online status if so.

| Field | Change | Notes |
|-------|--------|-------|
| onlineUntil | Behavior only | Now also set during login (not just arena challenges). Set to `now + 20min` if `onlineUntil` is null or more than 3 hours in the past. |

### ConfirmationToken (existing — behavior change only)

No schema change. The `confirm` endpoint now returns a 200 response when the token is already confirmed (instead of 400 error), making the endpoint idempotent.

| Field | Change | Notes |
|-------|--------|-------|
| confirmedAt | Behavior only | Endpoint now distinguishes "just confirmed" from "already confirmed" — both return 200. |

## API Response Changes

### GET /api/auth/confirm

**Before**: Returns 400 with error when token is already confirmed.
**After**: Returns 200 with `{ "message": "Email already confirmed...", "alreadyConfirmed": true }` for idempotent behavior.

### GET /api/player/heroes

**Before**: May fail with NPE if hero template is null.
**After**: Null-safe template access. `isEquipped` field serialized correctly (Jackson `@JsonProperty`).

### GET /api/team

**Before**: May fail with NPE if hero/summon template is null.
**After**: Null-safe template access with `@Transactional(readOnly = true)`.

## New Frontend Components

### HexStatDiagram (new)

Pure SVG presentational component. No data model impact.

**Props**:
- `stats`: Map of 6 stat names to numeric values (base stats)
- `growthStats`: Map of 6 stat names to growth rate values
- `maxValue`: Fixed maximum for axis scaling (default: 40)
- `size`: Diameter in pixels (compact: 180, full: 240)

**Rendering**:
- 6 axes at 60-degree intervals
- Filled polygon scaled by `value / maxValue * radius`
- Stat labels at each vertex: `"{name} {value} +{growth}"`
