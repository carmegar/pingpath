# PingPath - Diseno de UI

## Paleta de Colores

### Tema Oscuro (principal)
- Background: `#0a0a0b` (casi negro)
- Surface: `#141416` (cards, sidebar)
- Border: `#27272a` (zinc-800)
- Text primary: `#fafafa`
- Text secondary: `#a1a1aa` (zinc-400)
- Accent/Primary: `#6366f1` (indigo-500)
- Success/Up: `#22c55e` (green-500)
- Error/Down: `#ef4444` (red-500)
- Warning/Degraded: `#f59e0b` (amber-500)

## Paginas

### 1. Dashboard Principal
```
┌─────────────────────────────────────────────────┐
│ 🟢 PingPath                      [+ New Monitor]│
├────────┬────────────────────────────────────────┤
│        │                                        │
│ NAV    │  Monitors (5)          All | Up | Down │
│        │                                        │
│ Dash   │  ┌──────────────────────────────────┐  │
│ Status │  │ 🟢 API Production    99.9%  23ms │  │
│ Alerts │  │ ▁▂▁▁▃▁▁▂▁▁▁▁▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │  │
│ Config │  └──────────────────────────────────┘  │
│        │  ┌──────────────────────────────────┐  │
│        │  │ 🔴 Payment Service   94.2% 340ms │  │
│        │  │ ▁▂▁█▁▁▃▁▁█▁▁▁▁█▁▁▁▁▁▁▁▁▁▁▁▁█▁ │  │
│        │  └──────────────────────────────────┘  │
│        │  ┌──────────────────────────────────┐  │
│        │  │ 🟢 Landing Page      100%   45ms │  │
│        │  │ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │  │
│        │  └──────────────────────────────────┘  │
└────────┴────────────────────────────────────────┘
```

### 2. Detalle de Monitor
```
┌─────────────────────────────────────────────────┐
│ ← Back    API Production              🟢 UP     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐│
│  │ Uptime  │ │ Avg Lat │ │ Checks  │ │ Down  ││
│  │  99.9%  │ │  23ms   │ │  1,440  │ │   2   ││
│  └─────────┘ └─────────┘ └─────────┘ └───────┘│
│                                                 │
│  Latency (last 24h)                             │
│  ┌─────────────────────────────────────────┐    │
│  │    ╱╲                                   │    │
│  │   ╱  ╲    ╱╲                            │    │
│  │──╱────╲──╱──╲──────────────────────     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Availability (last 30 days)                    │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓              │
│                                                 │
│  Recent Checks                                  │
│  12:00  🟢 200  23ms                            │
│  11:59  🟢 200  21ms                            │
│  11:58  🔴 500  340ms  "Internal Server Error"  │
└─────────────────────────────────────────────────┘
```

### 3. Status Page Publica
```
┌─────────────────────────────────────────────────┐
│                                                 │
│          PingPath Status                        │
│     🟢 All Systems Operational                  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  API Production                                 │
│  🟢 Operational          Uptime 99.9%           │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░▓▓▓▓▓▓▓▓▓▓▓▓▓▓             │
│  Last 30 days                                   │
│                                                 │
│  Payment Service                                │
│  🔴 Major Outage         Uptime 94.2%           │
│  ▓▓▓▓▓▓░▓▓▓░▓▓▓▓▓▓▓▓▓▓░▓▓▓▓▓▓▓▓▓             │
│                                                 │
│  ─────── Incident History ───────               │
│                                                 │
│  Mar 20, 2026 - Payment Service Down            │
│  Resolved after 12 minutes                      │
│                                                 │
│         Powered by PingPath                     │
└─────────────────────────────────────────────────┘
```

## Componentes Clave

### MonitorCard
- Status dot con pulse animation cuando esta UP
- Mini sparkline de latencia (ultimos 30 checks)
- Uptime % y latencia promedio
- Click para ir al detalle

### AvailabilityBar
- 30 o 90 barras verticales, una por dia
- Verde = 100%, amarillo = 95-99%, rojo = <95%, gris = sin data
- Tooltip al hover con fecha y porcentaje exacto

### LatencyChart
- Grafico de linea con area sombreada
- Zoom por periodo: 1h, 6h, 24h, 7d, 30d
- Marcadores rojos en puntos de caida

### StatusBadge
- SVG embebible estilo shields.io
- `![Status](https://pingpath.cubepath.app/api/status/badge/monitor-id)`
- Variantes: uptime %, status actual

## Animaciones
- Transiciones suaves entre paginas (View Transitions de Astro)
- Pulse en status dots
- Skeleton loaders mientras cargan datos
- Numeros que animan al cambiar (count up)
- Graficos que se dibujan progresivamente
