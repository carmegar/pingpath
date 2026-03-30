# Changelog

All notable changes to PingPath will be documented in this file.

## [1.0.0] - 2026-03-20

### Added

**Backend (Fastify + TypeScript)**
- REST API with full CRUD for monitors (`/api/monitors`)
- SQLite database via `@libsql/client` with 5 tables: monitors, checks, incidents, notification_channels, monitor_notifications
- Cron-based health check system running every 60 seconds
- Automatic incident detection (down/degraded) and recovery tracking
- Discord webhook notifications on service outages and recoveries
- Telegram Bot API notifications
- SVG badge generation endpoint (`/api/status/badge/:id`)
- WebSocket server broadcasting real-time events: `new_check`, `incident_start`, `incident_resolve`
- Public status API endpoint (`/api/status`)
- Health check endpoint (`/api/health`)
- Configurable check intervals, expected status codes, and timeouts per monitor

**Frontend (Astro + React + Tailwind CSS v4)**
- Interactive dashboard with monitor list, status dots, sparkline graphs
- Monitor detail view with Recharts latency charts and availability bars
- Public status page with overall system status and incident history
- Incidents page with full history and duration tracking
- Modal form for creating new monitors
- Dark theme with custom color palette (indigo accent)
- Skeleton loading states and smooth animations
- Real-time updates via WebSocket hook with auto-reconnect
- Responsive sidebar navigation

**Infrastructure**
- pnpm monorepo with `apps/api` and `apps/web` workspaces
- Environment-based configuration (`.env.example` provided)
- Zero hardcoded secrets - all config via environment variables
- TypeScript strict mode across the entire codebase

### Fixed
- Migrated from `better-sqlite3` to `@libsql/client` to eliminate native C++ build dependency, enabling cross-platform compatibility (Windows, Linux, macOS) without requiring build tools
