import { FastifyInstance } from 'fastify'
import { getDb } from '../db/schema.js'

export async function statusRoutes(app: FastifyInstance) {
  // Public status page data
  app.get('/status', async () => {
    const db = getDb()

    const monitors = db.prepare(`
      SELECT m.id, m.name, m.url,
        (SELECT status FROM checks WHERE monitor_id = m.id ORDER BY checked_at DESC LIMIT 1) as current_status,
        (SELECT latency_ms FROM checks WHERE monitor_id = m.id ORDER BY checked_at DESC LIMIT 1) as last_latency,
        (SELECT ROUND(SUM(CASE WHEN status = 'up' THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2)
         FROM checks WHERE monitor_id = m.id AND checked_at > datetime('now', '-30 days')) as uptime_30d
      FROM monitors m
      WHERE m.is_public = 1 AND m.is_active = 1
      ORDER BY m.name ASC
    `).all()

    // Get daily availability per public monitor (last 30 days)
    const monitorsWithDaily = monitors.map((m: any) => {
      const daily = db.prepare(`
        SELECT
          date(checked_at) as day,
          ROUND(SUM(CASE WHEN status = 'up' THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) as uptime
        FROM checks
        WHERE monitor_id = ? AND checked_at > datetime('now', '-30 days')
        GROUP BY date(checked_at)
        ORDER BY day ASC
      `).all(m.id)
      return { ...m, daily }
    })

    // Recent incidents
    const incidents = db.prepare(`
      SELECT i.*, m.name as monitor_name
      FROM incidents i
      JOIN monitors m ON m.id = i.monitor_id
      WHERE m.is_public = 1
      ORDER BY i.started_at DESC
      LIMIT 20
    `).all()

    // Overall status
    const hasDown = monitors.some((m: any) => m.current_status === 'down')
    const hasDegraded = monitors.some((m: any) => m.current_status === 'degraded')
    const overall = hasDown ? 'major_outage' : hasDegraded ? 'partial_outage' : 'operational'

    return { overall, monitors: monitorsWithDaily, incidents }
  })

  // SVG Badge
  app.get('/status/badge/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const db = getDb()

    const monitor = db.prepare(`
      SELECT m.name,
        (SELECT status FROM checks WHERE monitor_id = m.id ORDER BY checked_at DESC LIMIT 1) as current_status,
        (SELECT ROUND(SUM(CASE WHEN status = 'up' THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 1)
         FROM checks WHERE monitor_id = m.id AND checked_at > datetime('now', '-30 days')) as uptime
      FROM monitors m WHERE m.id = ? AND m.is_public = 1
    `).get(id) as any

    if (!monitor) return reply.status(404).send({ error: 'Monitor not found' })

    const isUp = monitor.current_status === 'up'
    const color = isUp ? '#22c55e' : '#ef4444'
    const statusText = isUp ? 'up' : 'down'
    const uptime = monitor.uptime ? `${monitor.uptime}%` : 'N/A'

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a"><rect width="200" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#a)">
    <rect width="100" height="20" fill="#555"/>
    <rect x="100" width="100" height="20" fill="${color}"/>
    <rect width="200" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11">
    <text x="50" y="15" fill="#010101" fill-opacity=".3">uptime</text>
    <text x="50" y="14">uptime</text>
    <text x="150" y="15" fill="#010101" fill-opacity=".3">${statusText} | ${uptime}</text>
    <text x="150" y="14">${statusText} | ${uptime}</text>
  </g>
</svg>`

    reply.header('Content-Type', 'image/svg+xml')
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    return svg
  })
}
