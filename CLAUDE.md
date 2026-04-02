# Snap & Describe — Claude Code Conventions

## Project Overview

Universal Photo Explorer with AI Vision. Upload photos, get AI-powered descriptions, tags, and classifications. Chat with AI about your photos.

**Stack:** Fastify + Expo Router + Anthropic Claude Vision + MinIO + PostgreSQL + Drizzle ORM

## Project Structure

```
snap-and-describe/
├── apps/
│   ├── api/              # Fastify backend (TypeScript native via Node.js 24)
│   │   ├── src/
│   │   │   ├── types/           # Types entity (classification categories)
│   │   │   ├── images/          # Images entity, upload logic
│   │   │   ├── classifications/ # ImageClassifications entity
│   │   │   ├── conversations/   # Conversations + Messages entities
│   │   │   ├── vision/          # Claude Vision integration
│   │   │   ├── search/          # Search across descriptions and tags
│   │   │   ├── storage/         # MinIO client wrapper
│   │   │   ├── seed/            # Seed data service
│   │   │   ├── common/          # Shared utilities, code generator
│   │   │   ├── db/              # Drizzle schema, connection, migrations
│   │   │   └── server.ts        # Fastify app entry point
│   │   └── tests/               # Vitest tests
│   └── expo-router/      # Expo universal app (iOS + Android + Web)
│       ├── app/                  # File-based routing
│       ├── components/           # Shared components
│       ├── hooks/                # API hooks
│       └── types/                # TypeScript interfaces
├── docker-compose.yml    # PostgreSQL + MinIO + API + Expo Web
└── package.json          # Root convenience scripts
```

## Conventions

### TypeScript / Backend (Fastify)

- Run with Node.js 24 native TypeScript (`--experimental-strip-types`) — no compilation step
- Use Fastify with async/await handlers
- Drizzle ORM for database access — SQL-like, type-safe queries
- Organize by domain: each entity gets its own folder with schema, routes, and service
- Use UUID primary keys for all tables
- Auto-generate sequential codes (e.g., `IMG-2026-04-000001`) for human-readable identifiers
- Use `createdAt` / `updatedAt` timestamps on all tables

### TypeScript / Frontend (Expo Router)

- File-based routing under `app/`
- Universal components that work on iOS, Android, and Web
- Use Expo Camera on mobile, file picker on web
- API calls via custom hooks

### Database

- PostgreSQL 16 via Docker
- Drizzle ORM for schema definition and migrations
- JSON/JSONB columns for flexible metadata (tags, imageMetadata, properties)
- Foreign keys with proper relationships

### Testing

- Vitest for both API and Expo tests
- Mock external services (Claude API, MinIO) in tests

### Docker

- Docker Compose for local development: PostgreSQL + MinIO + API + Expo Web
- MinIO for S3-compatible local object storage
- MinIO Console at http://localhost:9001

## Common Commands

### Backend (from `apps/api/`)

```bash
node --experimental-strip-types src/server.ts     # Start API server
npx vitest                                         # Run tests
npx drizzle-kit generate                           # Generate migrations
npx drizzle-kit migrate                            # Apply migrations
```

### Frontend (from `apps/expo-router/`)

```bash
npx expo start --web                               # Start Expo web
npx expo start                                     # Start Expo (all platforms)
npx vitest                                         # Run tests
```

### Full Stack (from root)

```bash
docker compose up -d                               # Start all services
docker compose down                                # Stop all services
```

## Key Design Decisions

- **Fastify over NestJS** — lighter, faster, closer to bare Node.js
- **Drizzle over TypeORM/Prisma** — SQL-like syntax, zero overhead, fully TypeScript
- **Node.js 24 native TS** — no build step, faster development loop
- **MinIO over local filesystem** — S3-compatible, easy to switch to production S3/GCS
- **Claude Vision over Google Vision** — better natural language descriptions and follow-up conversations
- **PostgreSQL full-text search over Elasticsearch** — simpler setup, no extra service
- **Expo Router** — single codebase for web + mobile
