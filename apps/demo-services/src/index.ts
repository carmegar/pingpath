import Fastify from 'fastify'

const app = Fastify({ logger: true })

// Track service states for chaos control
const serviceState = {
  api: { healthy: true, latencyMs: 0 },
  web: { healthy: true, latencyMs: 0 },
  slow: { healthy: true, latencyMs: 200 },
}

// --- Service 1: Simple API ---
app.get('/api/health', async (_req, reply) => {
  if (!serviceState.api.healthy) {
    return reply.status(503).send({ status: 'down', error: 'Service unavailable' })
  }
  if (serviceState.api.latencyMs > 0) {
    await sleep(serviceState.api.latencyMs)
  }
  return { status: 'ok', service: 'api', timestamp: new Date().toISOString() }
})

app.get('/api/data', async (_req, reply) => {
  if (!serviceState.api.healthy) {
    return reply.status(503).send({ error: 'Service unavailable' })
  }
  return { items: [{ id: 1, name: 'Demo' }], count: 1 }
})

// --- Service 2: Static Web ---
app.get('/web/health', async (_req, reply) => {
  if (!serviceState.web.healthy) {
    return reply.status(503).send({ status: 'down' })
  }
  if (serviceState.web.latencyMs > 0) {
    await sleep(serviceState.web.latencyMs)
  }
  return { status: 'ok', service: 'web', timestamp: new Date().toISOString() }
})

app.get('/web', async (_req, reply) => {
  if (!serviceState.web.healthy) {
    return reply.status(503).send('Service unavailable')
  }
  reply.header('Content-Type', 'text/html')
  return '<html><body><h1>Demo Static Site</h1><p>This is a demo service monitored by PingPath.</p></body></html>'
})

// --- Service 3: Slow API (variable latency) ---
app.get('/slow/health', async (_req, reply) => {
  if (!serviceState.slow.healthy) {
    return reply.status(503).send({ status: 'down' })
  }
  const latency = serviceState.slow.latencyMs + Math.random() * 100
  await sleep(latency)
  return { status: 'ok', service: 'slow-api', latency_ms: Math.round(latency), timestamp: new Date().toISOString() }
})

// --- Chaos endpoint (internal control) ---
app.get('/chaos/status', async () => serviceState)

// --- Chaos Engine ---
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function chaosLoop() {
  const services = ['api', 'web', 'slow'] as const
  const actions = ['kill', 'degrade', 'recover'] as const

  const tick = () => {
    const service = services[randomInt(0, services.length - 1)]
    const state = serviceState[service]

    if (!state.healthy) {
      // If already down, recover
      state.healthy = true
      state.latencyMs = service === 'slow' ? 200 : 0
      console.log(`[CHAOS] ${service} recovered`)
    } else {
      const action = actions[randomInt(0, 1)] // kill or degrade
      if (action === 'kill') {
        state.healthy = false
        console.log(`[CHAOS] ${service} killed`)
      } else {
        state.latencyMs = randomInt(3000, 8000) // degraded latency
        console.log(`[CHAOS] ${service} degraded (${state.latencyMs}ms latency)`)
      }
    }

    // Next chaos event in 10-20 minutes
    const nextMs = randomInt(10 * 60 * 1000, 20 * 60 * 1000)
    console.log(`[CHAOS] Next event in ${Math.round(nextMs / 60000)} minutes`)
    setTimeout(tick, nextMs)
  }

  // Start first chaos event after 5-10 minutes
  const initialDelay = randomInt(5 * 60 * 1000, 10 * 60 * 1000)
  console.log(`[CHAOS] First event in ${Math.round(initialDelay / 60000)} minutes`)
  setTimeout(tick, initialDelay)
}

// Start server
const port = Number(process.env.PORT) || 3002
const host = process.env.HOST || '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`Demo services running on http://${host}:${port}`)
  console.log('Endpoints: /api/health, /web/health, /slow/health')

  // Start chaos engine
  chaosLoop()
  console.log('Chaos engine started')
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
