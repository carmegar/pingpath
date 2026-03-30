# PingPath - Vision del Proyecto

## Nombre: PingPath

**Tagline:** "Monitor de uptime y status page open-source, desplegado en CubePath"

## Problema que resuelve

Los desarrolladores necesitan saber si sus servicios web estan caidos antes de que sus usuarios se lo digan. Las soluciones existentes (UptimeRobot, BetterStack, Instatus) son de pago o limitadas en su plan gratuito.

## Solucion

PingPath es un servicio de monitoreo de uptime con status page publica que corre 24/7 en un VPS de CubePath. Permite:

- Monitorear endpoints HTTP/HTTPS con intervalos configurables
- Ver un dashboard con metricas en tiempo real (latencia, disponibilidad, historial)
- Status page publica para compartir con usuarios/clientes
- Notificaciones via Discord y Telegram cuando un servicio cae
- Badges embebibles para el README de proyectos

## Diferenciadores

1. **Self-hosted y open-source** - Tu data, tu servidor
2. **UI moderna y pulida** - La mejor experiencia de usuario posible
3. **Justifica el VPS** - Necesita un servidor corriendo cron jobs 24/7
4. **Util de verdad** - No es un proyecto de juguete, es una herramienta real

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | Astro + React (islas interactivas) |
| Styling | Tailwind CSS v4 |
| Graficos | Recharts |
| Backend API | Node.js + Fastify |
| Base de datos | SQLite (con @libsql/client) |
| Cron jobs | node-cron |
| Tiempo real | WebSockets (@fastify/websocket) |
| Notificaciones | Discord Webhooks, Telegram Bot API |
| Deploy | CubePath VPS |

## Repositorio

https://github.com/carmegar/pingpath

## Target

Desarrolladores que quieren monitorear sus side projects, APIs, o servicios sin pagar por soluciones premium.
