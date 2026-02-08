<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0
Bump rationale: Initial constitution creation (MAJOR - new governance established)

Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (5 principles)
  - Technology Stack
  - Development Workflow
  - Governance

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (no changes needed - generic)
  - .specify/templates/spec-template.md ✅ (no changes needed - generic)
  - .specify/templates/tasks-template.md ✅ (no changes needed - generic)

Follow-up TODOs: None
-->

# HeroManager Constitution

## Core Principles

### I. Functionality-First Development

All development prioritizes working features over theoretical perfection.

- Code MUST deliver user-visible functionality before optimization
- YAGNI (You Aren't Gonna Need It) applies to all abstractions
- Simple, working code is preferred over complex, "elegant" code
- Refactoring happens when pain is felt, not anticipated

**Rationale**: Ship working software. Premature abstraction wastes time and adds complexity without proven benefit.

### II. API-Driven Architecture

Frontend and backend communicate exclusively through well-defined REST APIs.

- Backend MUST expose RESTful endpoints for all frontend interactions
- API contracts SHOULD be defined before implementation when scope is clear
- JSON is the standard data format for all API communication
- Frontend MUST NOT directly access database or backend internals

**Rationale**: Clear API boundaries enable independent frontend/backend development and future flexibility.

### III. Layered Backend Structure

Spring Boot backend follows conventional layering for maintainability.

- Controllers handle HTTP concerns only (request/response mapping)
- Services contain business logic and orchestration
- Repositories handle data persistence
- Entities represent database models; DTOs represent API contracts
- Cross-cutting concerns (security, logging) use Spring mechanisms

**Rationale**: Conventional structure makes code predictable and onboarding straightforward.

### IV. Component-Based Frontend

React frontend organizes code by feature and reusable components.

- Pages represent routes/screens
- Components are reusable UI building blocks
- Services handle API communication
- TypeScript is mandatory for type safety
- State management approach chosen per-feature based on complexity

**Rationale**: Component architecture promotes reuse and keeps features isolated.

### V. Pragmatic Quality

Quality measures are applied proportionally to risk and value.

- Tests are OPTIONAL during initial development
- Tests SHOULD be added for complex business logic when stable
- Tests SHOULD be added when bugs are found (regression prevention)
- Code review focuses on functionality and obvious issues, not style nitpicking
- Documentation is written when it saves future time, not as ceremony

**Rationale**: Quality investment should match the value it protects. Early-stage code changes rapidly; heavy testing wastes effort.

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Backend Runtime | Java 17+ | LTS version preferred |
| Backend Framework | Spring Boot 3.x | Web, Data JPA, Security as needed |
| Database | TBD | PostgreSQL recommended for production |
| Frontend Runtime | Node.js 18+ | For build tooling |
| Frontend Framework | React 18+ | With TypeScript |
| Build Tools | Maven (backend), npm/Vite (frontend) | Standard tooling |

## Development Workflow

### Branch Strategy

- `main` branch contains stable, deployable code
- Feature branches follow pattern: `feature/short-description`
- Bug fix branches follow pattern: `fix/short-description`

### Commit Guidelines

- Commits SHOULD be atomic (one logical change)
- Commit messages SHOULD be descriptive but concise
- Format: `type: description` (e.g., `feat: add hero creation endpoint`)

### Definition of Done

A feature is complete when:
1. The functionality works as specified
2. The code compiles without errors
3. Basic manual testing confirms expected behavior
4. Code is merged to the appropriate branch

## Governance

### Authority

This constitution defines the development standards for HeroManager. All contributors MUST follow these principles.

### Amendments

- Amendments require documenting the change and rationale
- Version increments follow semantic versioning:
  - MAJOR: Principle removal or fundamental change
  - MINOR: New principle or significant expansion
  - PATCH: Clarifications and minor wording changes

### Compliance

- Code reviews SHOULD verify alignment with these principles
- Deviations MUST be justified in PR descriptions
- When principles conflict with practical needs, document the tradeoff

**Version**: 1.0.0 | **Ratified**: 2026-02-06 | **Last Amended**: 2026-02-06
