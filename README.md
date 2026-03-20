# PingPath

**Uptime Monitor & Status Page** - Monitor your services, visualize performance, and share public status pages.

Built for the [CubePath Hackathon 2026](https://github.com/midudev/hackaton-cubepath-2026) by [@carmegar](https://github.com/carmegar).

## Demo

> **Live demo:** *(Coming soon - deployed on CubePath)*

## Features

- **Real-time monitoring** - HTTP/HTTPS health checks every 60 seconds
- **Interactive dashboard** - Latency charts, uptime percentages, sparkline graphs
- **Public status page** - Share service status with your users
- **Incident tracking** - Automatic detection of outages and recoveries
- **Notifications** - Alerts via Discord webhooks and Telegram bots
- **Embeddable badges** - SVG status badges for your README
- **WebSocket updates** - Dashboard refreshes in real-time without polling
- **Dark theme** - Modern, clean UI designed for developers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Astro + React + Tailwind CSS v4 |
| Charts | Recharts |
| Backend | Node.js + Fastify + TypeScript |
| Database | SQLite (better-sqlite3) |
| Real-time | WebSockets (@fastify/websocket) |
| Cron | node-cron |
| Deploy | CubePath VPS |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/carmegar/pingpath.git
cd pingpath

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

### Development

```bash
# Run both frontend and backend in parallel
pnpm dev

# Or run them separately
pnpm dev:api   # Backend on http://localhost:3001
pnpm dev:web   # Frontend on http://localhost:3000
```

### Build

```bash
pnpm build
```

## How CubePath is Used

PingPath runs entirely on a CubePath VPS. The server hosts both the Fastify API backend and the Astro static frontend. The VPS runs 24/7 executing cron jobs that perform health checks every 60 seconds against monitored endpoints, storing results in a local SQLite database. WebSocket connections stream real-time updates to connected dashboards. This architecture requires a persistent server - something only possible with a VPS like CubePath.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/monitors` | List all monitors |
| POST | `/api/monitors` | Create a monitor |
| GET | `/api/monitors/:id` | Get monitor details |
| PUT | `/api/monitors/:id` | Update a monitor |
| DELETE | `/api/monitors/:id` | Delete a monitor |
| GET | `/api/monitors/:id/checks` | Check history |
| GET | `/api/monitors/:id/stats` | Monitor statistics |
| GET | `/api/status` | Public status data |
| GET | `/api/status/badge/:id` | SVG status badge |
| GET | `/api/incidents` | Incident history |
| WS | `/ws` | Real-time events |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `HOST` | API server host | `0.0.0.0` |
| `DB_PATH` | SQLite database path | `apps/api/data/pingpath.db` |
| `PUBLIC_API_URL` | API URL for frontend | `http://localhost:3001/api` |
| `PUBLIC_WS_URL` | WebSocket URL for frontend | `ws://localhost:3001/ws` |

## Project Structure

```
pingpath/
├── apps/
│   ├── api/          # Fastify backend
│   │   └── src/
│   │       ├── cron/           # Health check scheduler
│   │       ├── db/             # SQLite schema
│   │       ├── notifications/  # Discord & Telegram
│   │       ├── routes/         # REST API
│   │       └── ws/             # WebSocket broadcaster
│   └── web/          # Astro frontend
│       └── src/
│           ├── components/     # React components
│           ├── hooks/          # Custom hooks (useWebSocket)
│           ├── layouts/        # Astro layouts
│           ├── lib/            # API client
│           └── pages/          # Astro pages
├── docs/             # Project documentation
└── README.md
```

## License

MIT
