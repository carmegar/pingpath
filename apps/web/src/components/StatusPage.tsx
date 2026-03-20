import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { StatusData } from '../lib/api'
import StatusDot from './StatusDot'
import AvailabilityBar from './AvailabilityBar'

const overallLabels = {
  operational: { text: 'All Systems Operational', color: 'text-success', bg: 'bg-success/10' },
  partial_outage: { text: 'Partial System Outage', color: 'text-warning', bg: 'bg-warning/10' },
  major_outage: { text: 'Major System Outage', color: 'text-error', bg: 'bg-error/10' },
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const status = await api.status.get()
        setData(status)
      } catch (err) {
        console.error('Failed to fetch status:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
      </div>
    )
  }

  if (!data) return null

  const overall = overallLabels[data.overall]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className={`${overall.bg} rounded-2xl p-8 text-center mb-8`}>
        <StatusDot
          status={data.overall === 'operational' ? 'up' : data.overall === 'partial_outage' ? 'degraded' : 'down'}
          size="lg"
        />
        <h1 className={`text-2xl font-bold mt-3 ${overall.color}`}>{overall.text}</h1>
        <p className="text-sm text-text-secondary mt-1">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {data.monitors.map((m) => (
          <div key={m.id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StatusDot status={m.current_status} />
                <span className="font-medium text-sm">{m.name}</span>
              </div>
              <span className="text-xs text-text-secondary">
                {m.uptime_30d != null ? `${m.uptime_30d}% uptime` : 'No data'}
              </span>
            </div>
            {m.daily && m.daily.length > 0 && <AvailabilityBar daily={m.daily} />}
          </div>
        ))}

        {data.monitors.length === 0 && (
          <p className="text-center text-text-secondary py-8">No public monitors configured</p>
        )}
      </div>

      {data.incidents.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Incident History</h2>
          <div className="space-y-3">
            {data.incidents.map((inc) => (
              <div key={inc.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot status={inc.resolved_at ? 'up' : 'down'} size="sm" />
                  <span className="font-medium text-sm">{inc.monitor_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    inc.resolved_at ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}>
                    {inc.resolved_at ? 'Resolved' : 'Ongoing'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  {new Date(inc.started_at + 'Z').toLocaleString()}
                  {inc.resolved_at && ` — Resolved after ${Math.round((inc.duration_seconds ?? 0) / 60)} min`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-text-secondary mt-12 pb-6">
        Powered by <strong>PingPath</strong> &middot; Deployed on CubePath
      </div>
    </div>
  )
}
