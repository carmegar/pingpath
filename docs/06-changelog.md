# PingPath - Changelog

## Sesion 1 - 20 marzo 2026

### Etapa 1 completada: Fundacion del proyecto

#### Tareas completadas
- [x] Inicializar monorepo con pnpm workspaces
- [x] Setup backend: Fastify + TypeScript
- [x] Definir schema de BD SQLite
- [x] Implementar CRUD de monitores (API REST)
- [x] Implementar cron job de health checks + notificaciones

#### Archivos creados

**Root (monorepo)**
- `package.json` - Root con scripts dev/build para ambos workspaces
- `pnpm-workspace.yaml` - Define apps/* como workspaces
- `tsconfig.base.json` - Config TypeScript compartida
- `.gitignore` - Ignora node_modules, dist, .env, *.db

**Backend (apps/api)**
- `package.json` - Dependencias: fastify, better-sqlite3, node-cron, nanoid
- `tsconfig.json` - Extiende base config
- `src/index.ts` - Entry point: Fastify server, registra rutas, inicia cron
- `src/db/schema.ts` - SQLite schema (monitors, checks, incidents, notification_channels, monitor_notifications) + getDb singleton
- `src/routes/monitors.ts` - CRUD completo + endpoints de checks y stats con metricas agregadas
- `src/routes/incidents.ts` - Lista incidentes + incidentes activos
- `src/routes/status.ts` - Status page publica + badge SVG dinamico
- `src/routes/notifications.ts` - CRUD canales, link/unlink monitor-canal, test de canal
- `src/cron/checker.ts` - Cron job cada 60s: fetch URLs, guarda checks, detecta cambios de estado, crea/resuelve incidentes, limpieza diaria de checks viejos
- `src/notifications/sender.ts` - Envio de notificaciones a Discord (webhooks embed) y Telegram (Bot API)

**Frontend (apps/web)**
- `package.json` - Placeholder con dependencias: astro, react, tailwind, recharts

#### Estado de compilacion
- TypeScript compila sin errores (tsc --noEmit OK)
- Dependencias instaladas con pnpm

#### Proximo paso
Etapa 2: Setup frontend Astro + React + Tailwind, y construir el Dashboard principal.

---

## Sesion 2 - 20 marzo 2026

### Etapa 2 completada: Frontend + Dashboard + Status Page

#### Tareas completadas
- [x] Setup frontend: Astro + React + Tailwind CSS v4
- [x] Dashboard principal con lista de monitores
- [x] Vista detalle de monitor con graficos (Recharts)
- [x] Formulario para agregar/editar monitores (modal)
- [x] Status page publica

#### Archivos creados

**Frontend Config**
- `apps/web/astro.config.mjs` - Astro con React + Tailwind CSS v4 via Vite plugin
- `apps/web/tsconfig.json` - Extiende astro/tsconfigs/strict con JSX React
- `apps/web/src/styles/global.css` - Tema oscuro con custom properties (@theme), animaciones (pulse-dot, shimmer/skeleton)

**Libreria**
- `apps/web/src/lib/api.ts` - Cliente API tipado con todos los interfaces (Monitor, Check, MonitorStats, Incident, StatusData) y metodos (monitors CRUD, checks, stats, incidents, status)

**Layout**
- `apps/web/src/layouts/Layout.astro` - Layout con sidebar (Dashboard, Status, Incidents, Settings), Google Fonts Inter, footer CubePath

**Componentes React (islas interactivas)**
- `StatusDot.tsx` - Dot de estado con colores y pulse animation (up=verde, down=rojo, degraded=amarillo)
- `SparkLine.tsx` - SVG sparkline con area gradient para mini graficos de latencia
- `MonitorCard.tsx` - Card de monitor con StatusDot, SparkLine, uptime %, latencia, URL
- `Dashboard.tsx` - Lista de monitores con filtros (All/Up/Down), auto-refresh 30s, skeleton loading, boton nuevo monitor
- `MonitorModal.tsx` - Modal para crear monitor: nombre, URL, metodo, intervalo, status esperado, publico
- `MonitorDetail.tsx` - Vista detalle: stat cards, LatencyChart, AvailabilityBar, tabla de checks recientes, selector de periodo
- `MonitorDetailWrapper.tsx` - Wrapper client:only que lee ID de query params
- `LatencyChart.tsx` - Grafico de area con Recharts (latencia vs tiempo), tooltips, ejes
- `AvailabilityBar.tsx` - 30 barras de disponibilidad diaria con tooltip hover, colores por nivel
- `StatusPage.tsx` - Status publica: banner overall, monitores con AvailabilityBar, historial de incidentes
- `IncidentsList.tsx` - Lista de incidentes con estado, timestamps, duracion

**Paginas Astro**
- `pages/index.astro` - Dashboard (client:load)
- `pages/monitor.astro` - Detalle de monitor (client:only="react")
- `pages/status.astro` - Status page publica (client:load)
- `pages/incidents.astro` - Historial de incidentes (client:load)

#### Estado de compilacion
- `astro build` exitoso: 4 paginas generadas en 4.63s
- Sin errores de TypeScript ni de build

#### Decisiones tecnicas
- Ruta de detalle usa query params (`/monitor?id=xxx`) en vez de ruta dinamica para mantener output:static
- `client:only="react"` en MonitorDetailWrapper para evitar SSR de `window`
- Auto-refresh cada 30s en Dashboard y StatusPage via setInterval
- Paleta oscura con custom properties en @theme de Tailwind v4

#### Proximo paso
Etapa 3-4: WebSockets para tiempo real, badges SVG, notificaciones. Luego deploy en CubePath.

---

## Sesion 3 - 20 marzo 2026

### Etapas 3-4 completadas: WebSocket + .env + README

#### Tareas completadas
- [x] WebSocket server (broadcaster) integrado en Fastify
- [x] Broadcast de eventos: new_check, incident_start, incident_resolve
- [x] Hook useWebSocket en frontend para actualizaciones en tiempo real
- [x] Dashboard se refresca automaticamente via WebSocket
- [x] README.md completo con documentacion, stack, API endpoints, estructura
- [x] .env.example en root y en apps/web con todas las variables
- [x] Cero claves hardcodeadas, todo via env vars

#### Archivos creados/modificados

**Nuevos**
- `apps/api/src/ws/broadcaster.ts` - Gestor de clientes WS, broadcast de eventos
- `apps/web/src/hooks/useWebSocket.ts` - Hook React para conexion WS con auto-reconnect
- `.env.example` - Variables de entorno del backend
- `apps/web/.env.example` - Variables de entorno del frontend
- `README.md` - Documentacion completa del proyecto

**Modificados**
- `apps/api/src/index.ts` - Integrado @fastify/websocket + endpoint /ws
- `apps/api/src/cron/checker.ts` - Broadcast de eventos en cada check y cambio de estado
- `apps/web/src/components/Dashboard.tsx` - Integrado useWebSocket para refresh en tiempo real

#### Estado de compilacion
- Backend: `tsc --noEmit` OK
- Frontend: `astro build` OK (4 paginas, 5.02s)

#### Proximo paso
Tarea #14: Deploy en CubePath VPS (requiere accion manual del usuario).
