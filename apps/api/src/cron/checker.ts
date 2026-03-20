import cron from 'node-cron'
import { getDb } from '../db/schema.js'
import { nanoid } from 'nanoid'
import { sendNotification } from '../notifications/sender.js'
import { broadcast } from '../ws/broadcaster.js'

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
      return {
        status: 'down',
        status_code: response.status,
        latency_ms: latency,
        error_message: `Expected ${monitor.expected_status}, got ${response.status}`
      }
    }

    // Consider degraded if latency > 3 seconds
    const status = latency > 3000 ? 'degraded' : 'up'
    return { status, status_code: response.status, latency_ms: latency, error_message: null }
  } catch (err: any) {
    clearTimeout(timeout)
    const latency = Math.round(performance.now() - start)
    return {
      status: 'down',
      status_code: null,
      latency_ms: latency,
      error_message: err.name === 'AbortError' ? `Timeout after ${monitor.timeout_ms}ms` : err.message
    }
  }
}

function handleStateChange(monitor: Monitor, previousStatus: string | null, newStatus: string): void {
  const db = getDb()

  // Going down or degraded
  if ((newStatus === 'down' || newStatus === 'degraded') && previousStatus === 'up') {
    const incidentId = nanoid(12)
    db.prepare(`
      INSERT INTO incidents (id, monitor_id, type, started_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(incidentId, monitor.id, newStatus)

    console.log(`🔴 INCIDENT: ${monitor.name} is ${newStatus}`)
    broadcast('incident_start', { monitor_id: monitor.id, monitor_name: monitor.name, status: newStatus })
    sendNotification(monitor, newStatus, 'started')
  }

  // Recovering
  if (newStatus === 'up' && (previousStatus === 'down' || previousStatus === 'degraded')) {
    const openIncident = db.prepare(`
      SELECT * FROM incidents
      WHERE monitor_id = ? AND resolved_at IS NULL
      ORDER BY started_at DESC LIMIT 1
    `).get(monitor.id) as any

    if (openIncident) {
      db.prepare(`
        UPDATE incidents
        SET resolved_at = datetime('now'),
            duration_seconds = CAST((julianday('now') - julianday(started_at)) * 86400 AS INTEGER)
        WHERE id = ?
      `).run(openIncident.id)
    }

    console.log(`🟢 RECOVERED: ${monitor.name} is back up`)
    broadcast('incident_resolve', { monitor_id: monitor.id, monitor_name: monitor.name })
    sendNotification(monitor, 'up', 'resolved')
  }
}

async function runChecks(): Promise<void> {
  const db = getDb()
  const monitors = db.prepare('SELECT * FROM monitors WHERE is_active = 1').all() as Monitor[]

  for (const monitor of monitors) {
    const result = await checkMonitor(monitor)

    // Save check
    db.prepare(`
      INSERT INTO checks (monitor_id, status, status_code, latency_ms, error_message, checked_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(monitor.id, result.status, result.status_code, result.latency_ms, result.error_message)

    // Get previous status
    const previous = db.prepare(`
      SELECT status FROM checks
      WHERE monitor_id = ? AND id != (SELECT MAX(id) FROM checks WHERE monitor_id = ?)
      ORDER BY checked_at DESC LIMIT 1
    `).get(monitor.id, monitor.id) as { status: string } | undefined

    // Broadcast new check to WebSocket clients
    broadcast('new_check', {
      monitor_id: monitor.id,
      monitor_name: monitor.name,
      status: result.status,
      latency_ms: result.latency_ms,
      status_code: result.status_code,
    })

    // Handle state changes
    if (previous && previous.status !== result.status) {
      handleStateChange(monitor, previous.status, result.status)
    }
  }
}

export function startCronJobs(): void {
  // Run checks every 60 seconds
  cron.schedule('* * * * *', async () => {
    try {
      await runChecks()
    } catch (err) {
      console.error('Error running checks:', err)
    }
  })

  // Cleanup old checks (keep last 30 days)
  cron.schedule('0 0 * * *', () => {
    const db = getDb()
    db.prepare("DELETE FROM checks WHERE checked_at < datetime('now', '-30 days')").run()
    console.log('🧹 Cleaned up old checks')
  })

  console.log('⏰ Cron jobs started')

  // Run first check immediately
  runChecks().catch(console.error)
}
