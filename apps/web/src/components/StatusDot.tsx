interface StatusDotProps {
  status: 'up' | 'down' | 'degraded' | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' }
const colorMap = {
  up: 'bg-success',
  down: 'bg-error',
  degraded: 'bg-warning',
  null: 'bg-zinc-500',
}

export default function StatusDot({ status, size = 'md' }: StatusDotProps) {
  const sizeClass = sizeMap[size]
  const colorClass = colorMap[status ?? 'null']
  const pulse = status === 'up' ? 'animate-pulse-dot' : ''

  return (
    <span className={`inline-block rounded-full ${sizeClass} ${colorClass} ${pulse}`} />
  )
}
