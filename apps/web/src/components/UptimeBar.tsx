import { useState } from 'react'

interface UptimeBarProps {
  daily: { day: string; uptime: number }[]
  days?: number
}

export default function UptimeBar({ daily, days = 90 }: UptimeBarProps) {
  const [tooltip, setTooltip] = useState<{ day: string; uptime: number; index: number } | null>(null)

  const getColor = (uptime: number) => {
    if (uptime >= 99.5) return 'bg-success'
    if (uptime >= 95) return 'bg-warning'
    if (uptime >= 0) return 'bg-error'
    return 'bg-zinc-800'
  }

  const padded = [...Array(days)].map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const day = date.toISOString().split('T')[0]
    const found = daily.find((d) => d.day === day)
    return found || { day, uptime: -1 }
  })

  const totalUptime = daily.length > 0
    ? (daily.reduce((sum, d) => sum + d.uptime, 0) / daily.length).toFixed(2)
    : null

  return (
    <div className="relative">
      <div className="flex gap-[2px]">
        {padded.map((d, i) => (
          <div
            key={d.day}
            className={`flex-1 h-8 rounded-[2px] transition-all duration-150 cursor-pointer hover:scale-y-[1.3] hover:brightness-110 ${getColor(d.uptime)}`}
            onMouseEnter={() => setTooltip({ day: d.day, uptime: d.uptime, index: i })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-text-secondary">
        <span>{days} days ago</span>
        {totalUptime && <span className="font-medium">{totalUptime}% uptime</span>}
        <span>Today</span>
      </div>

      {tooltip && (
        <div
          className="absolute -top-11 transform -translate-x-1/2 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-lg pointer-events-none z-10 whitespace-nowrap"
          style={{ left: `${(tooltip.index / (days - 1)) * 100}%` }}
        >
          <span className="text-text-secondary">{tooltip.day}</span>{' '}
          <span className="font-semibold">{tooltip.uptime < 0 ? 'No data' : `${tooltip.uptime}%`}</span>
        </div>
      )}
    </div>
  )
}
