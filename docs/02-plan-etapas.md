# PingPath - Plan por Etapas

## Timeline: 20 marzo - 31 marzo (11 dias)

---

## ETAPA 1: Fundacion (Dia 1-2) - 20-21 marzo

### Objetivos
- Estructura del monorepo
- Backend base con API REST
- Base de datos SQLite con schema inicial
- Sistema de cron jobs para health checks

### Tareas
- [x] Inicializar monorepo con pnpm workspaces
- [x] Setup backend: Node.js + Fastify + TypeScript
- [x] Definir schema de BD (monitors, checks, incidents)
- [x] Implementar CRUD de monitores (API REST)
- [x] Implementar cron job que hace ping a endpoints
- [x] Guardar resultados de checks en SQLite
- [ ] Tests basicos del backend (pospuesto)

### Entregable
Backend funcional que monitorea URLs y guarda resultados.

---

## ETAPA 2: Frontend - Dashboard (Dia 3-5) - 22-24 marzo

### Objetivos
- Astro + React para islas interactivas
- Dashboard principal con lista de monitores
- Graficos de latencia y uptime por monitor
- Vista detalle de cada monitor

### Tareas
- [x] Setup Astro con React y Tailwind
- [x] Layout principal (sidebar + content)
- [x] Pagina Dashboard: lista de monitores con status
- [x] Pagina Detalle: graficos de latencia (Recharts), historial de checks
- [x] Formulario para agregar/editar monitores
- [x] Indicadores visuales: verde (up), rojo (down), amarillo (degraded)
- [x] Animaciones y transiciones suaves
- [ ] Responsive design (pendiente pulido)

### Entregable
Dashboard completo y funcional conectado al backend.

---

## ETAPA 3: Status Page Publica (Dia 6-7) - 25-26 marzo

### Objetivos
- Pagina publica de status (sin auth)
- Historial de incidentes
- Badges embebibles

### Tareas
- [ ] Ruta publica /status/:slug
- [ ] Vista de status page con todos los monitores configurados como publicos
- [ ] Timeline de incidentes (ultimos 90 dias)
- [ ] Barra de disponibilidad estilo GitHub/Atlassian
- [ ] API para generar badges SVG (uptime %, status)
- [ ] Tema claro/oscuro en status page

### Entregable
Status page publica lista para compartir.

---

## ETAPA 4: Notificaciones + WebSockets (Dia 8-9) - 27-28 marzo

### Objetivos
- Alertas cuando un servicio cae o se recupera
- Actualizaciones en tiempo real en el dashboard

### Tareas
- [ ] Integracion Discord webhook (notificacion de caida/recuperacion)
- [ ] Integracion Telegram Bot API
- [ ] WebSocket server para push de updates al dashboard
- [ ] Dashboard se actualiza sin refrescar la pagina
- [ ] Configuracion de canales de notificacion por monitor

### Entregable
Sistema de alertas funcional + dashboard en tiempo real.

---

## ETAPA 5: Pulido + Deploy (Dia 10-11) - 29-31 marzo

### Objetivos
- Deploy completo en CubePath
- README con documentacion
- Pulido de UX/UI
- Registro en el hackathon

### Tareas
- [ ] Deploy en CubePath VPS
- [ ] Configurar dominio/subdominio si es posible
- [ ] README.md completo (descripcion, screenshots, como usar CubePath)
- [ ] Capturas de pantalla y GIF del proyecto
- [ ] Pruebas finales end-to-end
- [ ] Optimizacion de performance
- [ ] Landing page atractiva
- [ ] Subir issue al repo del hackathon

### Entregable
Proyecto desplegado, documentado y registrado.

---

## Prioridades si el tiempo aprieta

Si no llegamos a todo, priorizamos en este orden:
1. Backend + checks funcionando
2. Dashboard con graficos (ES LO QUE VEN LOS JUECES)
3. Status page publica
4. Notificaciones
5. Badges y extras
