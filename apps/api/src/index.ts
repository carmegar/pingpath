import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { initDatabase } from './db/schema.js'
import { monitorRoutes } from './routes/monitors.js'
import { incidentRoutes } from './routes/incidents.js'
import { statusRoutes } from './routes/status.js'
import { notificationRoutes } from './routes/notifications.js'
import { startCronJobs } from './cron/checker.js'
import { addClient } from './ws/broadcaster.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(websocket)

// Initialize database
initDatabase()

// WebSocket endpoint
app.get('/ws', { websocket: true }, (socket) => {
  addClient(socket)
  socket.send(JSON.stringify({ event: 'connected', data: { message: 'PingPath WebSocket connected' }, timestamp: new Date().toISOString() }))
})

// Register routes
app.register(monitorRoutes, { prefix: '/api' })
app.register(incidentRoutes, { prefix: '/api' })
app.register(statusRoutes, { prefix: '/api' })
app.register(notificationRoutes, { prefix: '/api' })

// Health check
app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// Start cron jobs
startCronJobs()

const port = Number(process.env.PORT) || 3001
const host = process.env.HOST || '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`PingPath API running on http://${host}:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
