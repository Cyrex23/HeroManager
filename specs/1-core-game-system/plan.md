# Implementation Plan: HeroManager Core Game System

**Branch**: `1-core-game-system` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/1-core-game-system/spec.md`

## Summary

Build the foundational HeroManager web application — a hero team management game inspired by NinjaManager. The system includes player registration with email confirmation, hero roster and team lineup management, a hero/item/ability shop, an energy-gated arena battle system with text-based combat logs, and a leveling/progression system. The backend is Java 17+ / Spring Boot 3.x with H2 (dev) / PostgreSQL (production) database, and the frontend is React 18+ with TypeScript.

## Technical Context

**Language/Version**: Java 17+ (backend), TypeScript 5.x (frontend)
**Primary Dependencies**: Spring Boot 3.x (Web, Data JPA, Security, Mail), React 18+, React Router v6, Vite
**Storage**: H2 embedded (development), PostgreSQL (production-ready via JPA abstraction)
**Testing**: Manual by users (no automated tests per project requirements)
**Target Platform**: Local desktop browser (localhost)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Battle calculation < 1 second, page loads < 2 seconds, energy regen accurate within 30s
**Constraints**: Local development only, single machine, no cloud deployment
**Scale/Scope**: Small user base (local testing), ~10 database tables, ~8 frontend pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Functionality-First | PASS | All work targets user-visible features; no premature optimization |
| II. API-Driven Architecture | PASS | REST API between Spring Boot backend and React frontend; JSON data format |
| III. Layered Backend | PASS | Controller → Service → Repository pattern; Entities + DTOs |
| IV. Component-Based Frontend | PASS | React pages + components, TypeScript mandatory, feature-organized |
| V. Pragmatic Quality | PASS | No automated tests; manual testing; documentation where useful |

**Post-Phase 1 Re-check**: All principles remain satisfied. The layered backend uses Spring conventions. The API contracts define clean boundaries. No unnecessary abstractions introduced.

## Project Structure

### Documentation (this feature)

```text
specs/1-core-game-system/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — entity definitions
├── quickstart.md        # Phase 1 output — setup instructions
├── contracts/           # Phase 1 output — API endpoint specs
│   ├── auth-api.md
│   ├── player-api.md
│   ├── team-api.md
│   ├── shop-api.md
│   ├── arena-api.md
│   └── equipment-api.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── pom.xml
└── src/main/java/com/heromanager/
    ├── HeroManagerApplication.java
    ├── config/
    │   ├── SecurityConfig.java
    │   ├── JwtConfig.java
    │   └── CorsConfig.java
    ├── controller/
    │   ├── AuthController.java
    │   ├── PlayerController.java
    │   ├── TeamController.java
    │   ├── ShopController.java
    │   ├── ArenaController.java
    │   └── EquipmentController.java
    ├── service/
    │   ├── AuthService.java
    │   ├── EmailService.java
    │   ├── PlayerService.java
    │   ├── TeamService.java
    │   ├── ShopService.java
    │   ├── ArenaService.java
    │   ├── BattleService.java
    │   ├── EnergyService.java
    │   └── EquipmentService.java
    ├── repository/
    │   ├── PlayerRepository.java
    │   ├── HeroRepository.java
    │   ├── SummonRepository.java
    │   ├── ItemRepository.java
    │   ├── AbilityRepository.java
    │   ├── BattleLogRepository.java
    │   └── HeroTemplateRepository.java
    ├── entity/
    │   ├── Player.java
    │   ├── Hero.java
    │   ├── HeroTemplate.java
    │   ├── Summon.java
    │   ├── SummonTemplate.java
    │   ├── TeamSlot.java
    │   ├── Item.java
    │   ├── ItemTemplate.java
    │   ├── Ability.java
    │   ├── AbilityTemplate.java
    │   ├── EquippedItem.java
    │   ├── EquippedAbility.java
    │   ├── BattleLog.java
    │   └── ConfirmationToken.java
    ├── dto/
    │   ├── RegisterRequest.java
    │   ├── LoginRequest.java
    │   ├── LoginResponse.java
    │   ├── PlayerResponse.java
    │   ├── HeroResponse.java
    │   ├── TeamResponse.java
    │   ├── ShopHeroResponse.java
    │   ├── BattleResultResponse.java
    │   ├── ArenaOpponentResponse.java
    │   └── EnergyResponse.java
    └── util/
        ├── JwtUtil.java
        └── BattleCalculator.java

backend/src/main/resources/
├── application.properties
├── application-dev.properties
└── data.sql                    # Seed data: hero templates, item templates, ability templates

frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/
    │   ├── client.ts            # Axios instance with JWT interceptor
    │   ├── authApi.ts
    │   ├── playerApi.ts
    │   ├── teamApi.ts
    │   ├── shopApi.ts
    │   ├── arenaApi.ts
    │   └── equipmentApi.ts
    ├── context/
    │   ├── AuthContext.tsx
    │   └── PlayerContext.tsx
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── ConfirmPage.tsx
    │   ├── TeamPage.tsx
    │   ├── ShopPage.tsx
    │   ├── ArenaPage.tsx
    │   ├── BattlePage.tsx
    │   └── HeroDetailPage.tsx
    ├── components/
    │   ├── Layout/
    │   │   ├── Navbar.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── EnergyBar.tsx
    │   ├── Hero/
    │   │   ├── HeroCard.tsx
    │   │   ├── HeroStats.tsx
    │   │   └── HeroPortrait.tsx
    │   ├── Team/
    │   │   ├── TeamSlot.tsx
    │   │   └── CapacityBar.tsx
    │   ├── Shop/
    │   │   ├── ShopHeroCard.tsx
    │   │   └── ShopItemCard.tsx
    │   ├── Arena/
    │   │   ├── OpponentRow.tsx
    │   │   ├── BattleLog.tsx
    │   │   └── ChallengeButton.tsx
    │   └── Equipment/
    │       ├── ItemSlot.tsx
    │       └── AbilitySlot.tsx
    ├── types/
    │   └── index.ts
    └── assets/
        └── heroes/              # Copy of hero images/gifs

Heroes/                          # Source hero assets (existing)
├── konohamaru-genin.jpg
├── deidara.gif
├── sakura.gif
├── ... (all hero images)
└── susanoo-spirit-summon.jpg
```

**Structure Decision**: Web application (Option 2) with separate `backend/` and `frontend/` directories. This aligns with Constitution Principle II (API-Driven Architecture) and Principle IV (Component-Based Frontend), enabling independent development of each layer.

## Complexity Tracking

No constitution violations to justify. The design follows all five principles without exceptions.
