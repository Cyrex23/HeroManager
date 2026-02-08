# Quickstart Guide: HeroManager Core Game System

**Date**: 2026-02-08

## Prerequisites

- **Java 17+** (JDK) — [Download](https://adoptium.net/)
- **Maven 3.8+** — [Download](https://maven.apache.org/download.cgi) (or use Maven wrapper)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (for version control)
- **Gmail App Password** for `piratemanagerofficial@gmail.com` (for email sending)

### Gmail App Password Setup

1. Log in to `piratemanagerofficial@gmail.com`
2. Go to Google Account → Security → 2-Step Verification (enable if not already)
3. Go to Google Account → Security → App passwords
4. Generate a new app password for "Mail" on "Other (HeroManager)"
5. Copy the 16-character password — you'll need it for configuration

## Project Setup

### Backend (Spring Boot)

```bash
# From repository root
cd backend

# Configure email (create or edit application-dev.properties)
# Set the Gmail app password:
#   spring.mail.password=your-16-char-app-password

# Build and run
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend starts on **http://localhost:8080**.

**Key configuration** (`application-dev.properties`):

```properties
# Database (H2 embedded — auto-created)
spring.datasource.url=jdbc:h2:file:./data/heromanager
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=update
spring.h2.console.enabled=true

# H2 Console available at http://localhost:8080/h2-console
# JDBC URL: jdbc:h2:file:./data/heromanager
# Username: sa, Password: (empty)

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=piratemanagerofficial@gmail.com
spring.mail.password=YOUR_APP_PASSWORD_HERE
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# JWT
jwt.secret=your-256-bit-secret-key-for-local-dev-only
jwt.expiration=86400000

# App
app.base-url=http://localhost:3000
app.confirmation-url=http://localhost:3000/confirm
```

### Frontend (React + TypeScript)

```bash
# From repository root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend starts on **http://localhost:3000**.

## First Run Verification

1. **Start backend** → Check console for "Started HeroManagerApplication"
2. **Verify seed data** → Visit http://localhost:8080/h2-console, connect, and run:
   ```sql
   SELECT * FROM hero_template;  -- Should show 9 heroes
   SELECT * FROM item_template;  -- Should show 10 items
   SELECT * FROM summon_template; -- Should show 1 summon
   ```
3. **Start frontend** → Visit http://localhost:3000
4. **Register** → Create an account, check email for confirmation
5. **Confirm** → Click the link in the email
6. **Login** → Enter credentials
7. **Verify starter account** → Should see Konohamaru-Genin, 500 gold, 120/120 energy

## Development Workflow

1. Backend changes: Edit Java files → Spring Boot DevTools auto-restarts
2. Frontend changes: Edit TSX/TS files → Vite HMR auto-refreshes
3. API testing: Use browser dev tools Network tab or any REST client
4. Database inspection: http://localhost:8080/h2-console

## Common Issues

| Issue | Solution |
|-------|----------|
| Email not sending | Verify Gmail App Password is correct in application-dev.properties |
| CORS errors | Check CorsConfig.java allows `http://localhost:3000` |
| H2 console not accessible | Ensure `spring.h2.console.enabled=true` in dev profile |
| JWT token expired | Re-login; token expires after 24 hours |
| Port already in use | Kill existing process on 8080/3000 or change port in config |

## Key URLs

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Frontend application |
| http://localhost:8080 | Backend API |
| http://localhost:8080/h2-console | Database admin console |
| http://localhost:8080/api/auth/register | Registration endpoint |
| http://localhost:8080/api/auth/login | Login endpoint |
