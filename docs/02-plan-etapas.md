# PingPath - Plan por Etapas

## Timeline: 20 marzo - 31 marzo (11 dias)

## Infraestructura: 2x CubePath VPS Nano ($11 total)

| VPS | Rol | Specs |
|-----|-----|-------|
| VPS 1 | PingPath (API + Web + Ollama) | 1vCPU, 2GB RAM, 40GB SSD |
| VPS 2 | Demo services + Chaos script | 1vCPU, 2GB RAM, 40GB SSD |

---

## ETAPA 1: Fundacion (Dia 1-2) - 20-21 marzo ✅

### Tareas
- [x] Inicializar monorepo con pnpm workspaces
- [x] Setup backend: Node.js + Fastify + TypeScript
- [x] Definir schema de BD (monitors, checks, incidents, ai_summary)
- [x] Implementar CRUD de monitores (API REST)
- [x] Implementar cron job que hace ping a endpoints
- [x] Guardar resultados de checks en SQLite

---

## ETAPA 2: Frontend - Dashboard (Dia 3-5) - 22-24 marzo ✅

### Tareas
- [x] Setup Astro con React y Tailwind
- [x] Layout principal (sidebar responsive + mobile hamburger menu)
- [x] Pagina Dashboard: lista de monitores con status
- [x] Pagina Detalle: graficos de latencia (Recharts), historial de checks
- [x] Formulario para agregar/editar monitores
- [x] Indicadores visuales: verde (up), rojo (down), amarillo (degraded)
- [x] Animaciones y transiciones suaves
- [x] Responsive design (mobile/tablet/desktop)

---

## ETAPA 3: Status Page Publica (Dia 6-7) - 25-26 marzo ✅

### Tareas
- [x] Status page publica con PublicLayout (sin sidebar)
- [x] Vista con todos los monitores publicos y su estado actual
- [x] Barras de disponibilidad 90 dias estilo GitHub/Atlassian (UptimeBar)
- [x] Timeline de incidentes agrupados por fecha con resumen IA
- [x] API badges SVG embebibles (GET /api/status/badge/:id)
- [x] Tema claro/oscuro con toggle y persistencia en localStorage

---

## ETAPA 4: Notificaciones + WebSockets + IA (Dia 8-9) - 27-28 marzo ✅

### Tareas
- [x] Integracion Discord webhook (notificacion de caida/recuperacion)
- [x] Integracion Telegram Bot API
- [x] WebSocket server para push de updates al dashboard
- [x] Dashboard se actualiza sin refrescar la pagina (useWebSocket hook)
- [x] Pagina Settings: CRUD de canales de notificacion + vinculacion a monitores
- [x] Servicio IA: endpoint interno que llama a Ollama (Qwen2 0.5B)
- [x] Al resolverse un incidente, generar resumen automatico (async)
- [x] Mostrar resumen IA en timeline de incidentes (dashboard + status page)
- [x] Endpoint POST /api/incidents/:id/summarize para generar resumen manual

---

## ETAPA 5: Demo Services + Deploy + Pulido (Dia 10-11) - 29-31 marzo

### Tareas

#### Codigo completado ✅
- [x] App demo-services: 3 microservicios mock + chaos engine
- [x] Landing page atractiva con features y highlight de IA
- [x] Reestructurar rutas: landing en /, dashboard en /app

#### Deploy completado ✅
- [x] Deploy PingPath (API + Web + Nginx) en VPS 1
- [x] Instalar Ollama + descargar Qwen2 0.5B en VPS 1
- [x] Deploy demo-services en VPS 2
- [x] Configurar monitores apuntando a servicios del VPS 2
- [x] Configurar notificaciones Discord
- [x] README.md final (descripcion, screenshots, instrucciones)
- [x] Capturas de pantalla del proyecto
- [x] Pruebas finales end-to-end
- [x] Subir issue #123 al repo del hackathon

---

## Prioridades si el tiempo aprieta

1. Backend + checks funcionando
2. Dashboard con graficos (ES LO QUE VEN LOS JUECES)
3. Status page publica
4. Notificaciones
5. Resumenes IA de incidentes
6. Demo services + chaos script en VPS 2
7. Badges y extras
