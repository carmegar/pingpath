# PingPath - Arquitectura

## Estructura del Monorepo

```
cubepath/
├── apps/
│   ├── api/                  # Backend - Fastify + TypeScript
│   │   ├── src/
│   │   │   ├── routes/       # Endpoints REST
│   │   │   ├── services/     # Logica de negocio
│   │   │   ├── cron/         # Jobs de monitoreo
│   │   │   ├── ws/           # WebSocket server
│   │   │   ├── notifications/# Discord, Telegram
│   │   │   ├── db/           # Schema y queries SQLite
│   │   │   └── index.ts      # Entry point
│   │   └── package.json
│   │
│   └── web/                  # Frontend - Astro + React
│       ├── src/
│       │   ├── layouts/      # Layout principal
│       │   ├── pages/        # Rutas Astro
│       │   ├── components/   # Componentes React (islas)
│       │   ├── hooks/        # Custom hooks (useWebSocket, etc)
│       │   └── lib/          # Utilidades, API client
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
- `GET /api/status` - Status publico de todos los monitores publicos
- `GET /api/status/badge/:id` - Badge SVG

### Incidents
- `GET /api/incidents` - Listar incidentes
- `GET /api/incidents/active` - Incidentes activos

### Notifications
- `GET /api/notifications/channels` - Listar canales
- `POST /api/notifications/channels` - Crear canal
- `POST /api/notifications/test/:channelId` - Probar canal

### WebSocket
- `ws://host/ws` - Stream de eventos en tiempo real (new_check, incident_start, incident_resolve)

## Flujo de Monitoreo

```
[node-cron cada N segundos]
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
    ├── Si: Crear/resolver incidente
    │       │
    │       ▼
    │   [Enviar notificacion]
    │
    └── Siempre:
            │
            ▼
        [Emitir evento WebSocket]
```
