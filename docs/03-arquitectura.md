# PingPath - Arquitectura

## Infraestructura (2x CubePath VPS Nano)

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│         VPS 1 ($5.50)       │     │         VPS 2 ($5.50)       │
│   1vCPU · 2GB · 40GB SSD   │     │   1vCPU · 2GB · 40GB SSD   │
│                             │     │                             │
│  ┌───────────────────────┐  │     │  ┌───────────────────────┐  │
│  │    PingPath API       │  │────>│  │   Demo API Service    │  │
│  │    (Fastify :3001)    │  │     │  │   (/api/health)       │  │
│  └───────────────────────┘  │     │  └───────────────────────┘  │
│  ┌───────────────────────┐  │     │  ┌───────────────────────┐  │
│  │  PingPath Web (Astro) │  │────>│  │   Demo Web Service    │  │
│  │  Static build / Nginx │  │     │  │   (/web/health)       │  │
│  └───────────────────────┘  │     │  └───────────────────────┘  │
│  ┌───────────────────────┐  │     │  ┌───────────────────────┐  │
│  │  Ollama (Qwen2 0.5B)  │  │────>│  │   Slow API Service    │  │
│  │  AI Summaries         │  │     │  │   (/slow/health)      │  │
│  └───────────────────────┘  │     │  └───────────────────────┘  │
│  ┌───────────────────────┐  │     │  ┌───────────────────────┐  │
│  │  SQLite Database      │  │     │  │   Chaos Engine        │  │
│  └───────────────────────┘  │     │  │   (kills/degrades)    │  │
│                             │     │  └───────────────────────┘  │
└─────────────────────────────┘     └─────────────────────────────┘
```

## Estructura del Monorepo

```
cubepath/
├── apps/
│   ├── api/                  # Backend - Fastify + TypeScript
│   │   ├── src/
│   │   │   ├── routes/       # Endpoints REST
│   │   │   ├── cron/         # Jobs de monitoreo
│   │   │   ├── ws/           # WebSocket server
│   │   │   ├── notifications/# Discord, Telegram
│   │   │   ├── ai/           # Ollama integration (Qwen2 0.5B)
│   │   │   ├── db/           # Schema y queries SQLite
│   │   │   └── index.ts      # Entry point
│   │   └── package.json
│   │
│   ├── web/                  # Frontend - Astro + React
│   │   ├── src/
│   │   │   ├── layouts/      # Layout principal + PublicLayout
│   │   │   ├── pages/        # Rutas Astro (/, /app, /status, /monitor, /incidents, /settings)
│   │   │   ├── components/   # Componentes React (islas)
│   │   │   ├── hooks/        # Custom hooks (useWebSocket)
│   │   │   └── lib/          # Utilidades, API client
│   │   └── package.json
│   │
│   └── demo-services/        # Demo services para VPS 2
│       ├── src/
│       │   └── index.ts      # 3 mock services + chaos engine
│       └── package.json
│
├── docs/                     # Documentacion del proyecto
├── package.json              # Root - pnpm workspaces
├── pnpm-workspace.yaml
└── README.md
```

## Base de Datos (SQLite)

### Tabla: monitors
| Campo | Tipo | Descripcion |
|-------|------|------------|
| id | TEXT (UUID) | PK |
| name | TEXT | Nombre del monitor |
| url | TEXT | URL a monitorear |
| method | TEXT | GET, POST, HEAD |
| interval_seconds | INTEGER | Frecuencia de check (default 60) |
| expected_status | INTEGER | Status HTTP esperado (default 200) |
| timeout_ms | INTEGER | Timeout en ms (default 5000) |
| is_public | BOOLEAN | Visible en status page |
| is_active | BOOLEAN | Si esta activo |
| created_at | DATETIME | Fecha de creacion |
| updated_at | DATETIME | Ultima modificacion |

### Tabla: checks
| Campo | Tipo | Descripcion |
|-------|------|------------|
| id | INTEGER | PK autoincrement |
| monitor_id | TEXT | FK a monitors |
| status | TEXT | 'up', 'down', 'degraded' |
| status_code | INTEGER | HTTP status recibido |
| latency_ms | INTEGER | Tiempo de respuesta |
| error_message | TEXT | Mensaje si fallo |
| checked_at | DATETIME | Timestamp del check |

### Tabla: incidents
| Campo | Tipo | Descripcion |
|-------|------|------------|
| id | TEXT (UUID) | PK |
| monitor_id | TEXT | FK a monitors |
| type | TEXT | 'down', 'degraded', 'recovery' |
| started_at | DATETIME | Inicio del incidente |
| resolved_at | DATETIME | Fin (null si activo) |
| duration_seconds | INTEGER | Duracion total |
| ai_summary | TEXT | Resumen generado por IA (Qwen2 0.5B) |

### Tabla: notification_channels
| Campo | Tipo | Descripcion |
|-------|------|------------|
| id | TEXT (UUID) | PK |
| type | TEXT | 'discord', 'telegram' |
| config | TEXT (JSON) | Webhook URL, chat ID, etc |
| is_active | BOOLEAN | Si esta activo |

### Tabla: monitor_notifications
| Campo | Tipo | Descripcion |
|-------|------|------------|
| monitor_id | TEXT | FK a monitors |
| channel_id | TEXT | FK a notification_channels |

## Paginas Web

| Ruta | Layout | Descripcion |
|------|--------|------------|
| `/` | PublicLayout | Landing page del proyecto |
| `/app` | Layout (sidebar) | Dashboard con lista de monitores |
| `/monitor?id=X` | Layout (sidebar) | Detalle de monitor con graficos |
| `/status` | PublicLayout | Status page publica (sin sidebar) |
| `/incidents` | Layout (sidebar) | Historial de incidentes |
| `/settings` | Layout (sidebar) | Configuracion de canales de notificacion |

## API Endpoints

### Monitors
- `GET /api/monitors` - Listar monitores
- `POST /api/monitors` - Crear monitor
- `GET /api/monitors/:id` - Detalle de monitor
- `PUT /api/monitors/:id` - Actualizar monitor
- `DELETE /api/monitors/:id` - Eliminar monitor
- `GET /api/monitors/:id/checks` - Historial de checks
- `GET /api/monitors/:id/stats` - Estadisticas (uptime %, avg latency)

### Status Page
- `GET /api/status` - Status publico (monitores publicos, incidentes 90 dias)
- `GET /api/status/badge/:id` - Badge SVG embebible

### Incidents
- `GET /api/incidents` - Listar incidentes
- `GET /api/incidents/active` - Incidentes activos
- `POST /api/incidents/:id/summarize` - Generar resumen IA de un incidente resuelto

### Notifications
- `GET /api/notifications/channels` - Listar canales
- `POST /api/notifications/channels` - Crear canal
- `DELETE /api/notifications/channels/:id` - Eliminar canal
- `POST /api/notifications/test/:channelId` - Probar canal
- `POST /api/monitors/:monitorId/notifications/:channelId` - Vincular monitor a canal
- `DELETE /api/monitors/:monitorId/notifications/:channelId` - Desvincular

### WebSocket
- `ws://host/ws` - Stream de eventos en tiempo real
  - `new_check` - Nuevo resultado de check
  - `incident_start` - Inicio de incidente
  - `incident_resolve` - Incidente resuelto
  - `incident_summary` - Resumen IA generado

### Health
- `GET /api/health` - Health check del API

### Demo Services (VPS 2, puerto 3002)
- `GET /api/health` - Health del API mock
- `GET /web/health` - Health del web mock
- `GET /slow/health` - Health del API lenta (latencia variable)
- `GET /chaos/status` - Estado actual del chaos engine

## Flujo de Monitoreo

```
[node-cron cada 60 segundos]
    │
    ▼
[Fetch URL del monitor]
    │
    ▼
[Guardar resultado en checks]
    │
    ▼
[Evaluar: cambio de estado?]
    │
    ├── Caida: Crear incidente
    │       │
    │       ▼
    │   [Enviar notificacion Discord/Telegram]
    │
    ├── Recuperacion: Resolver incidente
    │       │
    │       ├── [Enviar notificacion]
    │       │
    │       └── [Generar resumen IA (async)]
    │               │
    │               ▼
    │           [Ollama: Qwen2 0.5B]
    │               │
    │               ▼
    │           [Guardar ai_summary en incidents]
    │               │
    │               ▼
    │           [Broadcast incident_summary via WS]
    │
    └── Siempre:
            │
            ▼
        [Emitir new_check via WebSocket]
```

## Integracion IA

**Modelo:** Qwen2 0.5B (Q4_0 quantization) via Ollama
**RAM estimada:** ~0.8GB (cabe en VPS Nano de 2GB)
**Cuando se ejecuta:** Solo al resolverse un incidente (on-demand)
**Tiempo de respuesta:** ~5-15 segundos por resumen en 1 vCPU

**Configuracion Ollama para uso minimo de recursos:**
```bash
OLLAMA_KEEP_ALIVE=0          # Descarga modelo tras cada uso
OLLAMA_NUM_PARALLEL=1        # Sin concurrencia
OLLAMA_MAX_LOADED_MODELS=1   # Un solo modelo en memoria
```

**Input al modelo:** Datos del incidente (nombre, URL, duracion, mensajes de error, codigos HTTP, latencia promedio)
**Output:** Resumen de 2-3 oraciones con causa probable

## Chaos Engine (VPS 2)

El chaos engine corre como parte de demo-services y simula fallos reales:

- **Kill:** Responde 503 durante 2-3 minutos
- **Degrade:** Inyecta latencia de 3-8 segundos (dispara status "degraded")
- **Recover:** Restaura servicio a estado normal

Los eventos ocurren cada 10-20 minutos de forma aleatoria, generando incidentes reales que PingPath detecta, notifica y resume con IA.
