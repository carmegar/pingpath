import { FastifyInstance } from 'fastify'
import { getDb } from '../db/schema.js'

export async function incidentRoutes(app: FastifyInstance) {
  // List incidents
  app.get('/incidents', async (req, reply) => {
    const query = req.query as { limit?: string; monitor_id?: string }
    const limit = Math.min(Number(query.limit) || 50, 200)
    const db = getDb()

    let where = ''
    const params: unknown[] = []

    if (query.monitor_id) {
      where = 'WHERE i.monitor_id = ?'
      params.push(query.monitor_id)
    }

    params.push(limit)

    const incidents = db.prepare(`
      SELECT i.*, m.name as monitor_name, m.url as monitor_url
      FROM incidents i
      JOIN monitors m ON m.id = i.monitor_id
      ${where}
      ORDER BY i.started_at DESC
      LIMIT ?
    `).all(...params)

    return incidents
  })

  // Active incidents
  app.get('/incidents/active', async () => {
    const db = getDb()
    const incidents = db.prepare(`
      SELECT i.*, m.name as monitor_name, m.url as monitor_url
      FROM incidents i
      JOIN monitors m ON m.id = i.monitor_id
      WHERE i.resolved_at IS NULL
      ORDER BY i.started_at DESC
    `).all()
    return incidents
  })
}
