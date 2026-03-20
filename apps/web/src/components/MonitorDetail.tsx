import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Monitor, MonitorStats, Check } from '../lib/api'
import StatusDot from './StatusDot'
import LatencyChart from './LatencyChart'
import AvailabilityBar from './AvailabilityBar'

interface MonitorDetailProps {
  monitorId: string
}

export default function MonitorDetail({ monitorId }: MonitorDetailProps) {
  const [monitor, setMonitor] = useState<Monitor | null>(null)
  const [stats, setStats] = useState<MonitorStats | null>(null)
  const [checks, setChecks] = useState<Check[]>([])
  const [period, setPeriod] = useState('24h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, s, c] = await Promise.all([
          api.monitors.get(monitorId),
          api.monitors.stats(monitorId, period),
          api.monitors.checks(monitorId, period),
        ])
        setMonitor(m)
        setStats(s)
        setChecks(c)
      } catch (err) {
        console.error('Failed to fetch monitor:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [monitorId, period])

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20" />)}
        </div>
        <div className="skeleton h-64" />
      </div>
    )
  }

  if (!monitor || !stats) {
    return (
      <div className="p-6 text-center text-text-secondary">
        <p>Monitor not found</p>
      </div>
    )
  }

  const statCards = [
    { label: 'Uptime', value: `${stats.uptime_percentage ?? 0}%`, color: 'text-success' },
    { label: 'Avg Latency', value: `${stats.avg_latency ?? 0}ms`, color: 'text-accent' },
    { label: 'Total Checks', value: String(stats.total_checks ?? 0), color: 'text-text-primary' },
    { label: 'Incidents', value: String(stats.down_count ?? 0), color: stats.down_count > 0 ? 'text-error' : 'text-text-primary' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/" className="text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {monitor.name}
              <StatusDot status={monitor.current_status} size="lg" />
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">{monitor.url}</p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-surface rounded-lg p-1">
          {['1h', '6h', '24h', '7d', '30d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                period === p ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-text-secondary mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Latency Chart */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <h3 className="text-sm font-medium mb-3">Response Time</h3>
        <LatencyChart checks={checks} />
      </div>

      {/* Availability Bar */}
      {stats.daily && stats.daily.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium mb-3">Availability (last 30 days)</h3>
          <AvailabilityBar daily={stats.daily} />
        </div>
      )}

      {/* Recent Checks Table */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Recent Checks</h3>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {checks.slice(0, 50).map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-1.5 px-2 rounded text-xs hover:bg-surface-hover">
              <StatusDot status={c.status} size="sm" />
              <span className="text-text-secondary w-36">
                {new Date(c.checked_at + 'Z').toLocaleString()}
              </span>
              <span className="w-12">{c.status_code ?? '--'}</span>
              <span className="w-16 text-right">{c.latency_ms}ms</span>
              {c.error_message && (
                <span className="text-error truncate">{c.error_message}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
