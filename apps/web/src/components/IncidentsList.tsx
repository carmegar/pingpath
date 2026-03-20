import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Incident } from '../lib/api'
import StatusDot from './StatusDot'

export default function IncidentsList() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.incidents.list(100)
        setIncidents(data)
      } catch (err) {
        console.error('Failed to fetch incidents:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Incidents</h1>

      {incidents.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-lg mb-1">No incidents recorded</p>
          <p className="text-sm">All systems have been running smoothly</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StatusDot status={inc.resolved_at ? 'up' : 'down'} size="sm" />
                  <span className="font-semibold text-sm">{inc.monitor_name}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  inc.resolved_at ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {inc.resolved_at ? 'Resolved' : 'Ongoing'}
                </span>
              </div>
              <div className="text-xs text-text-secondary space-y-0.5">
                <p>Started: {new Date(inc.started_at + 'Z').toLocaleString()}</p>
                {inc.resolved_at && (
                  <p>
                    Resolved: {new Date(inc.resolved_at + 'Z').toLocaleString()}
                    {' '}({Math.round((inc.duration_seconds ?? 0) / 60)} min)
                  </p>
                )}
                {inc.monitor_url && <p className="opacity-60">{inc.monitor_url}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
