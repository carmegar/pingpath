import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Check } from '../lib/api'

interface LatencyChartProps {
  checks: Check[]
}

export default function LatencyChart({ checks }: LatencyChartProps) {
  if (checks.length === 0) {
    return <div className="h-48 flex items-center justify-center text-text-secondary text-sm">No data yet</div>
  }

  const data = [...checks].reverse().map((c) => ({
    time: new Date(c.checked_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: c.latency_ms,
    status: c.status,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}ms`}
          width={50}
        />
        <Tooltip
          contentStyle={{
            background: '#141416',
            border: '1px solid #27272a',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#fafafa'
          }}
          formatter={(value: number) => [`${value}ms`, 'Latency']}
        />
        <Area
          type="monotone"
          dataKey="latency"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#latencyGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#6366f1' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
