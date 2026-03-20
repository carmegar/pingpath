import { useState } from 'react'

interface AvailabilityBarProps {
  daily: { day: string; uptime: number }[]
}

export default function AvailabilityBar({ daily }: AvailabilityBarProps) {
  const [tooltip, setTooltip] = useState<{ day: string; uptime: number; x: number } | null>(null)

  const getColor = (uptime: number) => {
    if (uptime >= 99.5) return 'bg-success'
    if (uptime >= 95) return 'bg-warning'
    return 'bg-error'
  }

  // Pad to 30 days
  const padded = [...Array(30)].map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    const day = date.toISOString().split('T')[0]
    const found = daily.find((d) => d.day === day)
    return found || { day, uptime: -1 }
  })

  return (
    <div className="relative">
      <div className="flex gap-[3px]">
        {padded.map((d, i) => (
          <div
            key={d.day}
            className={`flex-1 h-8 rounded-sm transition-all duration-150 cursor-pointer hover:scale-y-125 ${
              d.uptime < 0 ? 'bg-zinc-800' : getColor(d.uptime)
            }`}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setTooltip({ day: d.day, uptime: d.uptime, x: rect.left + rect.width / 2 })
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-text-secondary">
        <span>30 days ago</span>
        <span>Today</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute -top-10 transform -translate-x-1/2 bg-surface border border-border rounded-lg px-2 py-1 text-xs shadow-lg pointer-events-none z-10"
          style={{ left: `${((padded.findIndex((d) => d.day === tooltip.day)) / 29) * 100}%` }}
        >
          <span className="text-text-secondary">{tooltip.day}</span>{' '}
          <span className="font-medium">{tooltip.uptime < 0 ? 'No data' : `${tooltip.uptime}%`}</span>
        </div>
      )}
    </div>
  )
}
