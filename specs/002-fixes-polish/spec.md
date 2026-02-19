# Feature Specification: Core Game Fixes & Polish

**Feature Branch**: `002-fixes-polish`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "Bug fixes and enhancements for HeroManager Core Game System"

## Clarifications

### Session 2026-02-11

- Q: What determines the maximum extent of each axis on the hexagonal diagram? → A: The diagram displays hero base stats with a fixed maximum scale across all stats and heroes, enabling consistent visual comparison between heroes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix Team Lineup & Hero Roster Display (Priority: P1)

After logging in, a player navigates to the Team page and sees their full team lineup with equipped heroes and a bench section showing all unequipped heroes. After purchasing new heroes from the shop, those heroes immediately appear in the bench roster and are available for equipping.

**Why this priority**: Core gameplay is broken — players cannot see or manage their team, which blocks all downstream features (equipping, arena battles). Additionally, purchased heroes not appearing in the bench means gold is spent with no visible result.

**Independent Test**: Log in with a confirmed account that has purchased heroes. Navigate to Team page. Verify team lineup loads without errors. Verify all unequipped heroes appear in the Bench Heroes section. Buy a new hero from the shop, return to team, and confirm the new hero appears in the bench.

**Acceptance Scenarios**:

1. **Given** a logged-in player with heroes, **When** they navigate to the Team page, **Then** the team lineup loads successfully showing equipped heroes in their slots and all unequipped heroes in the bench section.
2. **Given** a player who just purchased a hero from the shop, **When** they navigate to the Team page, **Then** the newly purchased hero appears in the Bench Heroes section ready to be equipped.
3. **Given** a newly registered player, **When** they navigate to the Team page after login, **Then** they see their starter hero (Konohamaru-Genin) already equipped in slot 1.

---

### User Story 2 - Starter Hero Assignment on Registration (Priority: P1)

When a new player registers and confirms their email, they receive a starter hero (Konohamaru-Genin) automatically placed in team slot 1. This hero is visible immediately upon first login on both the Team page and anywhere heroes are listed.

**Why this priority**: Without a starter hero, new players have an empty team and cannot engage in any gameplay (arena battles require at least one hero). This is a fundamental onboarding requirement.

**Independent Test**: Register a new account, confirm email, log in. Verify Konohamaru-Genin appears in team slot 1 on the Team page and in the player's hero roster.

**Acceptance Scenarios**:

1. **Given** a newly registered and confirmed player, **When** they log in for the first time, **Then** they have Konohamaru-Genin as a hero in their roster at level 1.
2. **Given** a newly registered and confirmed player, **When** they view their team, **Then** Konohamaru-Genin is equipped in team slot 1.
3. **Given** the starter hero is Konohamaru-Genin, **When** the player views it in their roster, **Then** it shows correct base stats, level 1, and 0 XP.

---

### User Story 3 - Email Confirmation Success Feedback (Priority: P1)

When a player clicks the email confirmation link, they are redirected to a confirmation page that clearly shows a success message indicating their email has been confirmed, along with a link to proceed to login. The page should not display confusing messages like "already used" when the confirmation just succeeded.

**Why this priority**: The current flow creates confusion — players successfully confirm but see an error-like message. This impacts first impressions and could cause players to think registration failed.

**Independent Test**: Register a new account, open the confirmation email, click the link. Verify the confirmation page shows a clear success message with a login link.

**Acceptance Scenarios**:

1. **Given** a player with a valid, unused confirmation token, **When** they click the confirmation link, **Then** the page displays a success message (e.g., "Email confirmed successfully!") and a link to login.
2. **Given** a player who has already confirmed their email, **When** they click the confirmation link again, **Then** the page displays a message indicating the email was already confirmed, with a login link.
3. **Given** an expired or invalid token, **When** the player visits the confirmation URL, **Then** the page displays an error message with an option to resend the confirmation email.

---

### User Story 4 - Shop Abilities Hero Dropdown (Priority: P1)

In the Shop's Abilities tab, a dropdown allows the player to select which hero they want to browse abilities for. This dropdown shows all heroes the player currently owns (both equipped and bench heroes), so they can buy hero-specific abilities for any of their heroes.

**Why this priority**: Without seeing owned heroes in the dropdown, players cannot purchase abilities — a core part of the equipment system.

**Independent Test**: Log in with multiple owned heroes. Navigate to Shop > Abilities tab. Verify the hero dropdown lists all owned heroes. Select a hero and confirm abilities are shown for that hero's template.

**Acceptance Scenarios**:

1. **Given** a player who owns multiple heroes, **When** they navigate to Shop > Abilities, **Then** the hero dropdown lists all owned heroes by name.
2. **Given** a player selects a hero from the dropdown, **When** abilities load, **Then** only abilities matching that hero's template are displayed with correct pricing and owned status.
3. **Given** a player who just bought a new hero, **When** they navigate to Shop > Abilities, **Then** the newly purchased hero appears in the dropdown immediately.

---

### User Story 5 - Login Grants Online Status (Priority: P2)

When a player logs in for the first time in 3 or more hours, they receive 20 minutes of online status. This makes them appear as "online" in other players' arena opponent lists, which affects challenge energy costs (5 AE for online vs 7 AE for offline).

**Why this priority**: Enhances arena gameplay by ensuring freshly active players appear online, creating a more dynamic arena environment. Lower priority than bugs since arena still functions without it.

**Independent Test**: Log in after being offline for 3+ hours. Check that the player appears as "online" in the arena for 20 minutes. Verify other players see the reduced energy cost (5 AE) when challenging this player.

**Acceptance Scenarios**:

1. **Given** a player whose last activity was 3+ hours ago, **When** they log in, **Then** their online status is set for 20 minutes.
2. **Given** a player whose last activity was less than 3 hours ago, **When** they log in, **Then** their online status is not changed (preserves existing status).
3. **Given** a player who just logged in and received online status, **When** another player views the arena, **Then** the logged-in player appears with an "Online" badge and 5 AE challenge cost.

---

### User Story 6 - Hexagonal Growth Stats Diagram (Priority: P2)

On the Shop hero cards and hero detail pages, a hexagonal (radar) diagram visually displays a hero's six stats (Physical Attack, Magic Power, Dexterity, Element, Mana, Stamina) as a filled polygon. Each vertex of the hexagon represents one stat, with the stat name, base value, and growth rate displayed at each point. The filled area shows the relative distribution of the hero's stats at a glance.

**Why this priority**: Visual enhancement that significantly improves the hero browsing and comparison experience. Lower priority than functional bugs but adds meaningful value to the UI.

**Independent Test**: Navigate to the Shop and view a hero card. Verify the hexagonal diagram renders with 6 labeled vertices, correct stat values, growth rates, and a filled polygon shape. Compare with a different hero to verify the polygon shape changes based on different stat distributions.

**Acceptance Scenarios**:

1. **Given** a hero with known stats, **When** the hexagonal diagram is displayed, **Then** each of the 6 vertices is labeled with the stat name, base value, and growth rate (e.g., "Physical 30 +2").
2. **Given** a hero with uneven stat distribution, **When** the diagram renders, **Then** the filled polygon visually reflects the relative stat values (higher stats extend further from center).
3. **Given** any hero in the shop or hero detail page, **When** the diagram is displayed, **Then** the hexagon uses the dark theme styling consistent with the rest of the application.

---

### Edge Cases

- What happens if a player's hero data fails to load on the Team page? Display an error message with a retry option.
- What happens if the confirmation token is used simultaneously from two browser tabs? The first request succeeds, the second shows "already confirmed" with a login link.
- What happens if a player has no heroes at all (data corruption)? Show an empty state message on the Team page.
- What happens if login online-status grant occurs while the player is already online? Do not override — keep the longer remaining online duration.
- What happens if a hero has all stats at the same value? The hexagonal diagram renders as a regular hexagon.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST load and display the team lineup correctly when a player navigates to the Team page, showing equipped heroes in their slots and unequipped heroes in the bench.
- **FR-002**: System MUST show newly purchased heroes in the Bench Heroes section of the Team page immediately after purchase.
- **FR-003**: System MUST assign the Konohamaru-Genin hero to new players upon email confirmation and equip it in team slot 1.
- **FR-004**: System MUST display a clear success message on the email confirmation page when a valid token is confirmed, distinguishing between first-time confirmation and already-confirmed states.
- **FR-005**: System MUST populate the hero dropdown in the Shop Abilities tab with all heroes the player currently owns.
- **FR-006**: System MUST grant 20 minutes of online status when a player logs in and their last activity was 3 or more hours ago.
- **FR-007**: System MUST NOT override existing online status if the player's remaining online time exceeds 20 minutes at login.
- **FR-008**: System MUST render a hexagonal (radar) diagram showing 6 stats for heroes in the shop cards and hero detail pages.
- **FR-009**: The hexagonal diagram MUST display stat name, base value, and growth rate at each vertex of the hexagon.
- **FR-010**: The hexagonal diagram MUST use a filled polygon where each axis scales hero base stat values against a fixed maximum, enabling consistent visual comparison across all heroes.

### Key Entities

- **Player**: Extended with login-based online status logic (last activity timestamp check at 3-hour threshold).
- **Hero**: Starter hero (Konohamaru-Genin) assigned on confirmation, displayed in team and bench.
- **ConfirmationToken**: Confirmation flow enhanced to return distinct success vs already-confirmed states.
- **HexagonalDiagram**: Visual component rendering 6 stats as a radar chart with labels and filled polygon.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Team page loads successfully for all players — zero "Failed to load" errors during normal operation.
- **SC-002**: 100% of newly registered and confirmed players receive a starter hero visible on their first login.
- **SC-003**: Email confirmation page shows appropriate success/already-confirmed messages with zero ambiguous error states.
- **SC-004**: All owned heroes appear in the Shop Abilities dropdown within 1 second of page load.
- **SC-005**: Players logging in after 3+ hours of inactivity appear as "online" in the arena for 20 minutes.
- **SC-006**: Hexagonal stat diagrams render correctly for all 9 hero templates with accurate stat representation.

## Assumptions

- The "Failed to load team data" error is a frontend or API integration bug, not a fundamental architecture issue.
- The starter hero assignment logic (Konohamaru-Genin on confirmation) was specified in the original design but may have an implementation bug.
- The 3-hour threshold for login online status is based on the `onlineUntil` field — if `onlineUntil` is more than 3 hours in the past (or null), the player is considered inactive long enough to receive the login bonus.
- The hexagonal diagram will be implemented as an SVG component using the existing inline CSS styling approach (no external charting libraries).
- The hexagonal diagram reference image shows: stat names at each vertex, base values, growth rates (e.g., "+2"), and a semi-transparent filled polygon area.
