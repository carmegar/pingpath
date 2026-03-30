import { getDb } from '../db/schema.js'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2:0.5b'

interface IncidentContext {
  monitor_name: string
  monitor_url: string
  type: string
  started_at: string
  resolved_at: string
  duration_seconds: number
  error_messages: string[]
  status_codes: (number | null)[]
  avg_latency: number | null
}

async function getIncidentContext(incidentId: string): Promise<IncidentContext | null> {
  const db = getDb()

  const incResult = await db.execute({
    sql: `SELECT i.*, m.name as monitor_name, m.url as monitor_url
    FROM incidents i JOIN monitors m ON m.id = i.monitor_id
    WHERE i.id = ?`,
    args: [incidentId]
  })

  if (incResult.rows.length === 0) return null
  const inc = incResult.rows[0] as any

  const checksResult = await db.execute({
    sql: `SELECT status_code, error_message, latency_ms FROM checks
    WHERE monitor_id = ? AND checked_at BETWEEN ? AND ?
    ORDER BY checked_at ASC`,
    args: [inc.monitor_id, inc.started_at, inc.resolved_at]
  })

  const errors = checksResult.rows
    .map((c: any) => c.error_message)
    .filter((e: string | null): e is string => !!e)

  const codes = checksResult.rows.map((c: any) => c.status_code)

  const latencies = checksResult.rows
    .map((c: any) => c.latency_ms)
    .filter((l: number) => l > 0)

  return {
    monitor_name: inc.monitor_name,
    monitor_url: inc.monitor_url,
    type: inc.type,
    started_at: inc.started_at,
    resolved_at: inc.resolved_at,
    duration_seconds: inc.duration_seconds,
    error_messages: [...new Set(errors)],
    status_codes: [...new Set(codes)],
    avg_latency: latencies.length > 0 ? Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length) : null,
  }
}

function buildPrompt(ctx: IncidentContext): string {
  const duration = ctx.duration_seconds < 60
    ? `${ctx.duration_seconds} seconds`
    : `${Math.round(ctx.duration_seconds / 60)} minutes`

  const errors = ctx.error_messages.length > 0
    ? `Errors: ${ctx.error_messages.join(', ')}`
    : 'No error messages captured.'

  const codes = ctx.status_codes.filter(c => c !== null).length > 0
    ? `HTTP status codes: ${ctx.status_codes.filter(c => c !== null).join(', ')}`
    : 'No HTTP responses received.'

  return `You are a concise incident analyst. Summarize this server incident in 2-3 sentences. Focus on what happened, the likely cause, and the impact.

Service: ${ctx.monitor_name} (${ctx.monitor_url})
Incident type: ${ctx.type}
Duration: ${duration}
${errors}
${codes}
${ctx.avg_latency ? `Average latency during incident: ${ctx.avg_latency}ms` : ''}

Write a brief, professional summary:`
}

export async function generateIncidentSummary(incidentId: string): Promise<string | null> {
  try {
    const ctx = await getIncidentContext(incidentId)
    if (!ctx) return null

    const prompt = buildPrompt(ctx)

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 150,
          num_ctx: 1024,
        }
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.error(`Ollama error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const summary = (data.response || '').trim()

    if (summary) {
      const db = getDb()
      await db.execute({
        sql: 'UPDATE incidents SET ai_summary = ? WHERE id = ?',
        args: [summary, incidentId]
      })
    }

    return summary
  } catch (err) {
    console.error('AI summary generation failed:', err)
    return null
  }
}
