# PingPath - Contexto para Sesiones de Trabajo

## Resumen Rapido

**Proyecto:** PingPath - Monitor de uptime + status page publica
**Hackathon:** CubePath 2026 (midudev) - Entrega 31 marzo 2026
**Stack:** Astro + React + Tailwind (frontend) | Fastify + SQLite + node-cron (backend)
**Repo:** https://github.com/carmegar/pingpath
**Deploy:** CubePath VPS ($15 credito gratis)

## Que es CubePath

Servicio de VPS donde se despliega el proyecto. Requisito del hackathon.

## Criterios del Hackathon (por prioridad)

1. **Experiencia de usuario** - UI pulida, fluida, moderna. LO MAS IMPORTANTE.
2. **Creatividad** - Diferenciarse de soluciones existentes
3. **Utilidad** - Que resuelva un problema real
4. **Implementacion tecnica** - Codigo limpio y buena arquitectura

## Documentos de Referencia

| Archivo | Contenido |
|---------|-----------|
| `docs/01-vision.md` | Vision, problema, solucion, stack |
| `docs/02-plan-etapas.md` | Plan dia a dia con tareas |
| `docs/03-arquitectura.md` | Estructura, DB schema, API, flujos |
| `docs/04-ui-design.md` | Paleta, wireframes ASCII, componentes |
| `docs/05-contexto-sesion.md` | Este archivo - contexto rapido |
| `docs/06-changelog.md` | Changelog interno detallado por sesion |
| `CHANGELOG.md` | Changelog publico del proyecto |

## Estado Actual del Proyecto

> Actualizar este campo al final de cada sesion de trabajo

**Etapa actual:** Etapas 1, 2, 3 y 4 COMPLETADAS - Solo falta deploy (#14)
**Ultimo trabajo realizado:** Migracion de better-sqlite3 a @libsql/client por compatibilidad Windows
**Proximo paso:** Deploy en CubePath VPS (accion manual del usuario)

## Decisiones Tecnicas Clave

1. **Astro + React islas** - Astro para paginas estaticas (status page), React para partes interactivas (dashboard, graficos)
2. **SQLite via @libsql/client** - API async, sin dependencias nativas (reemplaza better-sqlite3)
3. **Fastify** - Mas rapido que Express, buen soporte TypeScript
4. **Monorepo con pnpm** - apps/api + apps/web en un solo repo
5. **WebSockets** - Dashboard se actualiza en tiempo real sin polling

## Notas Importantes

- El deploy DEBE ser en CubePath
- Repositorio DEBE ser publico
- README debe incluir capturas/GIFs y explicar uso de CubePath
- Fecha limite estricta: 31 marzo 23:59:59 CET
