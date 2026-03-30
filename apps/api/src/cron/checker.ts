import cron from 'node-cron'
import { getDb } from '../db/schema.js'
import { nanoid } from 'nanoid'
import { sendNotification } from '../notifications/sender.js'
import { broadcast } from '../ws/broadcaster.js'
import { generateIncidentSummary } from '../ai/summarizer.js'

interface Monitor {
  id: string
  name: string
  url: string
  method: string
  interval_seconds: number
  expected_status: number
  timeout_ms: number
  is_active: number
}

interface CheckResult {
  status: 'up' | 'down' | 'degraded'
  status_code: number | null
  latency_ms: number
  error_message: string | null
}

async function checkMonitor(monitor: Monitor): Promise<CheckResult> {
  const start = performance.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

  try {
    const response = await fetch(monitor.url, {
      method: monitor.method,
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'PingPath/1.0 Uptime Monitor' }
    })
    clearTimeout(timeout)

    const latency = Math.round(performance.now() - start)
    const isExpectedStatus = response.status === monitor.expected_status

    if (!isExpectedStatus) {
      return { status: 'down', status_code: response.status, latency_ms: latency, error_message: `Expected ${monitor.expected_status}, got ${response.status}` }
    }

    const status = latency > 3000 ? 'degraded' : 'up'
    return { status, status_code: response.status, latency_ms: latency, error_message: null }
  } catch (err: any) {
    clearTimeout(timeout)
    const latency = Math.round(performance.now() - start)
    return { status: 'down', status_code: null, latency_ms: latency, error_message: err.name === 'AbortError' ? `Timeout after ${monitor.timeout_ms}ms` : err.message }
  }
}

async function handleStateChange(monitor: Monitor, previousStatus: string | null, newStatus: string): Promise<void> {
  const db = getDb()

  if ((newStatus === 'down' || newStatus === 'degraded') && previousStatus === 'up') {
    const incidentId = nanoid(12)
    await db.execute({
      sql: `INSERT INTO incidents (id, monitor_id, type, started_at) VALUES (?, ?, ?, datetime('now'))`,
      args: [incidentId, monitor.id, newStatus]
    })
    console.log(`INCIDENT: ${monitor.name} is ${newStatus}`)
    broadcast('incident_start', { monitor_id: monitor.id, monitor_name: monitor.name, status: newStatus })
    sendNotification(monitor, newStatus, 'started')
  }

  if (newStatus === 'up' && (previousStatus === 'down' || previousStatus === 'degraded')) {
    const openIncident = await db.execute({
      sql: `SELECT * FROM incidents WHERE monitor_id = ? AND resolved_at IS NULL ORDER BY started_at DESC LIMIT 1`,
      args: [monitor.id]
    })

    if (openIncident.rows.length > 0) {
      const inc = openIncident.rows[0] as any
      await db.execute({
        sql: `UPDATE incidents SET resolved_at = datetime('now'), duration_seconds = CAST((julianday('now') - julianday(started_at)) * 86400 AS INTEGER) WHERE id = ?`,
        args: [inc.id]
      })

      // Generate AI summary asynchronously (don't block the check cycle)
      generateIncidentSummary(inc.id).then((summary) => {
        if (summary) {
          console.log(`AI Summary for ${monitor.name}: ${summary}`)
          broadcast('incident_summary', { incident_id: inc.id, monitor_name: monitor.name, summary })
        }
      }).catch(console.error)
    }

    console.log(`RECOVERED: ${monitor.name} is back up`)
    broadcast('incident_resolve', { monitor_id: monitor.id, monitor_name: monitor.name })
    sendNotification(monitor, 'up', 'resolved')
  }
}

async function runChecks(): Promise<void> {
  const db = getDb()
  const result = await db.execute('SELECT * FROM monitors WHERE is_active = 1')
  const monitors = result.rows as unknown as Monitor[]

  for (const monitor of monitors) {
    const checkResult = await checkMonitor(monitor)

    await db.execute({
      sql: `INSERT INTO checks (monitor_id, status, status_code, latency_ms, error_message, checked_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [monitor.id, checkResult.status, checkResult.status_code, checkResult.latency_ms, checkResult.error_message]
    })

    broadcast('new_check', {
      monitor_id: monitor.id,
      monitor_name: monitor.name,
      status: checkResult.status,
      latency_ms: checkResult.latency_ms,
      status_code: checkResult.status_code,
    })

    const previous = await db.execute({
      sql: `SELECT status FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 1 OFFSET 1`,
      args: [monitor.id]
    })

    if (previous.rows.length > 0) {
      const prevStatus = (previous.rows[0] as any).status
      if (prevStatus !== checkResult.status) {
        await handleStateChange(monitor, prevStatus, checkResult.status)
      }
    }
  }
}

export function startCronJobs(): void {
  cron.schedule('* * * * *', async () => {
    try { await runChecks() } catch (err) { console.error('Error running checks:', err) }
  })

  cron.schedule('0 0 * * *', async () => {
    const db = getDb()
    await db.execute("DELETE FROM checks WHERE checked_at < datetime('now', '-30 days')")
    console.log('Cleaned up old checks')
  })

  console.log('Cron jobs started')
  runChecks().catch(console.error)
}
