import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Monitor, Check } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'
import MonitorCard from './MonitorCard'
import MonitorModal from './MonitorModal'

type Filter = 'all' | 'up' | 'down'

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [checksMap, setChecksMap] = useState<Record<string, number[]>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [showModal, setShowModal] = useState(false)

  const fetchData = async () => {
    try {
      const data = await api.monitors.list()
      setMonitors(data)

      const checksEntries = await Promise.all(
        data.map(async (m) => {
          try {
            const checks = await api.monitors.checks(m.id, '1h')
            return [m.id, checks.reverse().map((c: Check) => c.latency_ms)] as const
          } catch {
            return [m.id, []] as const
          }
        })
      )
      setChecksMap(Object.fromEntries(checksEntries))
    } catch (err) {
      console.error('Failed to fetch monitors:', err)
    } finally {
      setLoading(false)
    }
  }

  // WebSocket: refresh data on new checks or incidents
  useWebSocket(useCallback((msg) => {
    if (msg.event === 'new_check' || msg.event === 'incident_start' || msg.event === 'incident_resolve') {
      fetchData()
    }
  }, []))

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Fallback polling every 60s (WS handles real-time)
    return () => clearInterval(interval)
  }, [])

  const filtered = monitors.filter((m) => {
    if (filter === 'up') return m.current_status === 'up'
    if (filter === 'down') return m.current_status === 'down' || m.current_status === 'degraded'
    return true
  })

  const upCount = monitors.filter((m) => m.current_status === 'up').length
  const downCount = monitors.filter((m) => m.current_status === 'down' || m.current_status === 'degraded').length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Monitors</h1>
          <p className="text-sm text-text-secondary mt-1">
            {monitors.length} monitors &middot; {upCount} up &middot; {downCount} down
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Monitor
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-5 bg-surface rounded-lg p-1 w-fit">
        {(['all', 'up', 'down'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {f === 'all' ? `All (${monitors.length})` : f === 'up' ? `Up (${upCount})` : `Down (${downCount})`}
          </button>
        ))}
      </div>

      {/* Monitor List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-lg mb-2">No monitors found</p>
          <p className="text-sm">Create your first monitor to start tracking uptime</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <MonitorCard
              key={m.id}
              monitor={m}
              latencyHistory={checksMap[m.id] || []}
              onClick={() => window.location.href = `/monitor?id=${m.id}`}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MonitorModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchData() }}
        />
      )}
    </div>
  )
}
