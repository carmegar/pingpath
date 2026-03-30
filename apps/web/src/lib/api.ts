const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {}
  if (options?.body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers as Record<string, string> },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || res.statusText)
  }
  return res.json()
}

export interface Monitor {
  id: string
  name: string
  url: string
  method: string
  interval_seconds: number
  expected_status: number
  timeout_ms: number
  is_public: number
  is_active: number
  created_at: string
  updated_at: string
  current_status: 'up' | 'down' | 'degraded' | null
  last_latency: number | null
  uptime_24h: number | null
}

export interface Check {
  id: number
  monitor_id: string
  status: 'up' | 'down' | 'degraded'
  status_code: number | null
  latency_ms: number
  error_message: string | null
  checked_at: string
}

export interface MonitorStats {
  total_checks: number
  up_checks: number
  uptime_percentage: number
  avg_latency: number
  min_latency: number
  max_latency: number
  down_count: number
  daily: { day: string; uptime: number }[]
}

export interface Incident {
  id: string
  monitor_id: string
  monitor_name: string
  monitor_url?: string
  type: string
  started_at: string
  resolved_at: string | null
  duration_seconds: number | null
  ai_summary?: string | null
}

export interface StatusData {
  overall: 'operational' | 'partial_outage' | 'major_outage'
  monitors: (Monitor & { daily: { day: string; uptime: number }[]; uptime_30d: number })[]
  incidents: Incident[]
}

export interface MonitorInput {
  name: string
  url: string
  method?: string
  interval_seconds?: number
  expected_status?: number
  timeout_ms?: number
  is_public?: boolean
  is_active?: boolean
}

export interface NotificationChannel {
  id: string
  type: 'discord' | 'telegram'
  config: Record<string, string>
  is_active: number
  created_at: string
}

export const api = {
  monitors: {
    list: () => request<Monitor[]>('/monitors'),
    get: (id: string) => request<Monitor>(`/monitors/${id}`),
    create: (data: MonitorInput) => request<Monitor>('/monitors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<MonitorInput>) => request<Monitor>(`/monitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/monitors/${id}`, { method: 'DELETE' }),
    checks: (id: string, period?: string) => request<Check[]>(`/monitors/${id}/checks${period ? `?period=${period}` : ''}`),
    stats: (id: string, period?: string) => request<MonitorStats>(`/monitors/${id}/stats${period ? `?period=${period}` : ''}`),
  },
  incidents: {
    list: (limit?: number) => request<Incident[]>(`/incidents${limit ? `?limit=${limit}` : ''}`),
    active: () => request<Incident[]>('/incidents/active'),
  },
  status: {
    get: () => request<StatusData>('/status'),
  },
  notifications: {
    channels: () => request<NotificationChannel[]>('/notifications/channels'),
    createChannel: (data: { type: string; config: Record<string, string> }) =>
      request<NotificationChannel>('/notifications/channels', { method: 'POST', body: JSON.stringify(data) }),
    deleteChannel: (id: string) =>
      request<void>(`/notifications/channels/${id}`, { method: 'DELETE' }),
    testChannel: (id: string) =>
      request<void>(`/notifications/test/${id}`, { method: 'POST' }),
    getLinked: (monitorId: string) =>
      request<string[]>(`/monitors/${monitorId}/notifications`),
    link: (monitorId: string, channelId: string) =>
      request<void>(`/monitors/${monitorId}/notifications/${channelId}`, { method: 'POST' }),
    unlink: (monitorId: string, channelId: string) =>
      request<void>(`/monitors/${monitorId}/notifications/${channelId}`, { method: 'DELETE' }),
  },
}
