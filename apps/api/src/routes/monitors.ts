import { FastifyInstance } from 'fastify'
import { getDb } from '../db/schema.js'
import { nanoid } from 'nanoid'

interface MonitorBody {
  name: string
  url: string
  method?: string
  interval_seconds?: number
  expected_status?: number
  timeout_ms?: number
  is_public?: boolean
  is_active?: boolean
}

export async function monitorRoutes(app: FastifyInstance) {
  // List all monitors
  app.get('/monitors', async (req, reply) => {
    const db = getDb()
    const monitors = db.prepare(`
      SELECT m.*,
        (SELECT status FROM checks WHERE monitor_id = m.id ORDER BY checked_at DESC LIMIT 1) as current_status,
        (SELECT latency_ms FROM checks WHERE monitor_id = m.id ORDER BY checked_at DESC LIMIT 1) as last_latency,
        (SELECT COUNT(*) FROM checks WHERE monitor_id = m.id AND status = 'up' AND checked_at > datetime('now', '-24 hours')) * 100.0 /
          NULLIF((SELECT COUNT(*) FROM checks WHERE monitor_id = m.id AND checked_at > datetime('now', '-24 hours')), 0) as uptime_24h
      FROM monitors m
      ORDER BY m.created_at DESC
    `).all()
    return monitors
  })

  // Create monitor
  app.post('/monitors', async (req, reply) => {
    const body = req.body as MonitorBody
    if (!body.name || !body.url) {
      return reply.status(400).send({ error: 'name and url are required' })
    }

    const db = getDb()
    const id = nanoid(12)
    const stmt = db.prepare(`
      INSERT INTO monitors (id, name, url, method, interval_seconds, expected_status, timeout_ms, is_public, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      body.name,
      body.url,
      body.method || 'GET',
      body.interval_seconds || 60,
      body.expected_status || 200,
      body.timeout_ms || 5000,
      body.is_public ? 1 : 0,
      body.is_active !== false ? 1 : 0
    )

    const monitor = db.prepare('SELECT * FROM monitors WHERE id = ?').get(id)
    return reply.status(201).send(monitor)
  })

  // Get single monitor
  app.get('/monitors/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const db = getDb()
    const monitor = db.prepare(`
      SELECT m.*,
        (SELECT status FROM checks WHERE monitor_id = m.id ORDER BY checked_at DESC LIMIT 1) as current_status,
        (SELECT latency_ms FROM checks WHERE monitor_id = m.id ORDER BY checked_at DESC LIMIT 1) as last_latency
      FROM monitors m WHERE m.id = ?
    `).get(id)

    if (!monitor) return reply.status(404).send({ error: 'Monitor not found' })
    return monitor
  })

  // Update monitor
  app.put('/monitors/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as Partial<MonitorBody>
    const db = getDb()

    const existing = db.prepare('SELECT * FROM monitors WHERE id = ?').get(id)
    if (!existing) return reply.status(404).send({ error: 'Monitor not found' })

    const fields: string[] = []
    const values: unknown[] = []

    if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name) }
    if (body.url !== undefined) { fields.push('url = ?'); values.push(body.url) }
    if (body.method !== undefined) { fields.push('method = ?'); values.push(body.method) }
    if (body.interval_seconds !== undefined) { fields.push('interval_seconds = ?'); values.push(body.interval_seconds) }
    if (body.expected_status !== undefined) { fields.push('expected_status = ?'); values.push(body.expected_status) }
    if (body.timeout_ms !== undefined) { fields.push('timeout_ms = ?'); values.push(body.timeout_ms) }
    if (body.is_public !== undefined) { fields.push('is_public = ?'); values.push(body.is_public ? 1 : 0) }
    if (body.is_active !== undefined) { fields.push('is_active = ?'); values.push(body.is_active ? 1 : 0) }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')")
      values.push(id)
      db.prepare(`UPDATE monitors SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    }

    const updated = db.prepare('SELECT * FROM monitors WHERE id = ?').get(id)
    return updated
  })

  // Delete monitor
  app.delete('/monitors/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const db = getDb()
    const result = db.prepare('DELETE FROM monitors WHERE id = ?').run(id)
    if (result.changes === 0) return reply.status(404).send({ error: 'Monitor not found' })
    return { success: true }
  })

  // Get checks for a monitor
  app.get('/monitors/:id/checks', async (req, reply) => {
    const { id } = req.params as { id: string }
    const query = req.query as { limit?: string; period?: string }
    const limit = Math.min(Number(query.limit) || 100, 1000)
    const db = getDb()

    let timeFilter = ''
    if (query.period) {
      const periods: Record<string, string> = {
        '1h': '-1 hours',
        '6h': '-6 hours',
        '24h': '-24 hours',
        '7d': '-7 days',
        '30d': '-30 days',
      }
      const offset = periods[query.period]
      if (offset) timeFilter = `AND checked_at > datetime('now', '${offset}')`
    }

    const checks = db.prepare(`
      SELECT * FROM checks
      WHERE monitor_id = ? ${timeFilter}
      ORDER BY checked_at DESC
      LIMIT ?
    `).all(id, limit)

    return checks
  })

  // Get stats for a monitor
  app.get('/monitors/:id/stats', async (req, reply) => {
    const { id } = req.params as { id: string }
    const query = req.query as { period?: string }
    const db = getDb()

    const period = query.period || '24h'
    const periods: Record<string, string> = {
      '1h': '-1 hours',
      '6h': '-6 hours',
      '24h': '-24 hours',
      '7d': '-7 days',
      '30d': '-30 days',
    }
    const offset = periods[period] || '-24 hours'

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_checks,
        SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_checks,
        ROUND(SUM(CASE WHEN status = 'up' THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) as uptime_percentage,
        ROUND(AVG(latency_ms), 0) as avg_latency,
        MIN(latency_ms) as min_latency,
        MAX(latency_ms) as max_latency,
        SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down_count
      FROM checks
      WHERE monitor_id = ? AND checked_at > datetime('now', ?)
    `).get(id, offset)

    // Daily availability for the bar chart (last 30 days)
    const daily = db.prepare(`
      SELECT
        date(checked_at) as day,
        ROUND(SUM(CASE WHEN status = 'up' THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) as uptime
      FROM checks
      WHERE monitor_id = ? AND checked_at > datetime('now', '-30 days')
      GROUP BY date(checked_at)
      ORDER BY day ASC
    `).all(id)

    return { ...(stats as Record<string, unknown>), daily }
  })
}
