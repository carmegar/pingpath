import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { StatusData, Incident } from '../lib/api'
import StatusDot from './StatusDot'
import UptimeBar from './UptimeBar'

const overallLabels = {
  operational: { text: 'All Systems Operational', color: 'text-success', bg: 'bg-success/10', icon: '✓' },
  partial_outage: { text: 'Partial System Outage', color: 'text-warning', bg: 'bg-warning/10', icon: '!' },
  major_outage: { text: 'Major System Outage', color: 'text-error', bg: 'bg-error/10', icon: '✕' },
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function groupIncidentsByDate(incidents: Incident[]): Record<string, Incident[]> {
  const groups: Record<string, Incident[]> = {}
  for (const inc of incidents) {
    const date = inc.started_at.split('T')[0]
    if (!groups[date]) groups[date] = []
    groups[date].push(inc)
  }
  return groups
}

function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('pingpath-theme')
    if (stored === 'light') {
      setDark(false)
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      localStorage.setItem('pingpath-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      localStorage.setItem('pingpath-theme', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-border hover:bg-surface-hover transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto px-4 space-y-4">
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const overall = overallLabels[data.overall]
  const incidentGroups = groupIncidentsByDate(data.incidents)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-accent animate-pulse-dot" />
            <span className="font-bold text-lg">PingPath</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Overall Status Banner */}
        <div className={`${overall.bg} rounded-2xl p-8 text-center mb-10`}>
          <div className="flex justify-center mb-3">
            <StatusDot
              status={data.overall === 'operational' ? 'up' : data.overall === 'partial_outage' ? 'degraded' : 'down'}
              size="lg"
            />
          </div>
          <h1 className={`text-2xl font-bold ${overall.color}`}>{overall.text}</h1>
          <p className="text-sm text-text-secondary mt-2">
            Last updated {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Monitors with Uptime Bars */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Current Status</h2>
          <div className="space-y-4">
            {data.monitors.map((m) => (
              <div key={m.id} className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <StatusDot status={m.current_status} />
                    <span className="font-semibold text-sm">{m.name}</span>
                  </div>
                  <span className="text-xs text-text-secondary font-medium">
                    {m.uptime_30d != null ? `${m.uptime_30d}%` : 'N/A'} uptime
                  </span>
                </div>
                {m.daily && m.daily.length > 0 && <UptimeBar daily={m.daily} days={90} />}
              </div>
            ))}

            {data.monitors.length === 0 && (
              <p className="text-center text-text-secondary py-12">No public monitors configured</p>
            )}
          </div>
        </section>

        {/* Incident Timeline */}
        {data.incidents.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Incident History</h2>
            <div className="space-y-6">
              {Object.entries(incidentGroups).map(([date, incidents]) => (
                <div key={date}>
                  <h3 className="text-xs font-medium text-text-secondary mb-3 pb-2 border-b border-border">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="space-y-3">
                    {incidents.map((inc) => (
                      <div key={inc.id} className="flex gap-3">
                        <div className="flex flex-col items-center pt-1">
                          <StatusDot status={inc.resolved_at ? 'up' : 'down'} size="sm" />
                          <div className="flex-1 w-px bg-border mt-1" />
                        </div>
                        <div className="pb-4 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{inc.monitor_name}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              inc.resolved_at ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                            }`}>
                              {inc.resolved_at ? 'RESOLVED' : 'ONGOING'}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            {new Date(inc.started_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {inc.resolved_at && (
                              <> — {new Date(inc.resolved_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' '}({formatDuration(inc.duration_seconds ?? 0)})</>
                            )}
                          </p>
                          {inc.ai_summary && (
                            <div className="mt-2 px-3 py-2 bg-accent/5 border border-accent/20 rounded-lg">
                              <div className="flex items-center gap-1.5 mb-1">
                                <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-[10px] font-semibold text-accent uppercase">AI Summary</span>
                              </div>
                              <p className="text-xs text-text-secondary leading-relaxed">{inc.ai_summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.incidents.length === 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Incident History</h2>
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-text-secondary text-sm">No incidents in the last 90 days</p>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center text-xs text-text-secondary">
          Powered by <strong>PingPath</strong> &middot; Deployed on <strong>CubePath</strong>
        </div>
      </footer>
    </div>
  )
}
