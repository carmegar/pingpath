import type { Monitor } from '../lib/api'
import StatusDot from './StatusDot'
import SparkLine from './SparkLine'

interface MonitorCardProps {
  monitor: Monitor
  latencyHistory?: number[]
  onClick: () => void
}

export default function MonitorCard({ monitor, latencyHistory = [], onClick }: MonitorCardProps) {
  const uptime = monitor.uptime_24h != null ? monitor.uptime_24h.toFixed(1) : '--'
  const latency = monitor.last_latency != null ? `${monitor.last_latency}ms` : '--'
  const statusLabel = monitor.current_status ?? 'pending'

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface border border-border rounded-xl p-4 hover:bg-surface-hover hover:border-accent/30 transition-all duration-200 group cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <StatusDot status={monitor.current_status} />
          <span className="font-semibold text-sm">{monitor.name}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          statusLabel === 'up' ? 'bg-success/10 text-success' :
          statusLabel === 'down' ? 'bg-error/10 text-error' :
          statusLabel === 'degraded' ? 'bg-warning/10 text-warning' :
          'bg-zinc-500/10 text-zinc-400'
        }`}>
          {statusLabel.toUpperCase()}
        </span>
      </div>

      <div className="mb-3">
        <SparkLine data={latencyHistory} width={280} height={28} color={
          monitor.current_status === 'down' ? '#ef4444' :
          monitor.current_status === 'degraded' ? '#f59e0b' : '#6366f1'
        } />
      </div>

      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span>Uptime <strong className="text-text-primary">{uptime}%</strong></span>
        <span>Latency <strong className="text-text-primary">{latency}</strong></span>
        <span className="ml-auto text-[10px] truncate max-w-[180px] opacity-60">{monitor.url}</span>
      </div>
    </button>
  )
}
