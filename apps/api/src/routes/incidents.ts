import { FastifyInstance } from 'fastify'
import { getDb } from '../db/schema.js'
import { generateIncidentSummary } from '../ai/summarizer.js'

export async function incidentRoutes(app: FastifyInstance) {
  const db = getDb()

  app.get('/incidents', async (req) => {
    const query = req.query as { limit?: string; monitor_id?: string }
    const limit = Math.min(Number(query.limit) || 50, 200)
    const args: (string | number)[] = []

    let where = ''
    if (query.monitor_id) {
      where = 'WHERE i.monitor_id = ?'
      args.push(query.monitor_id)
    }
    args.push(limit)

    const result = await db.execute({
      sql: `SELECT i.*, m.name as monitor_name, m.url as monitor_url
      FROM incidents i JOIN monitors m ON m.id = i.monitor_id
      ${where} ORDER BY i.started_at DESC LIMIT ?`,
      args
    })
    return result.rows
  })

  app.get('/incidents/active', async () => {
    const result = await db.execute(`
      SELECT i.*, m.name as monitor_name, m.url as monitor_url
      FROM incidents i JOIN monitors m ON m.id = i.monitor_id
      WHERE i.resolved_at IS NULL ORDER BY i.started_at DESC
    `)
    return result.rows
  })

  app.post('/incidents/:id/summarize', async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db.execute({ sql: 'SELECT * FROM incidents WHERE id = ?', args: [id] })
    if (existing.rows.length === 0) return reply.status(404).send({ error: 'Incident not found' })

    const inc = existing.rows[0] as any
    if (!inc.resolved_at) return reply.status(400).send({ error: 'Incident not yet resolved' })

    const summary = await generateIncidentSummary(id)
    if (!summary) return reply.status(503).send({ error: 'AI service unavailable' })

    return { summary }
  })
}
