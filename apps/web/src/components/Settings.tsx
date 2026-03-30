import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { NotificationChannel, Monitor } from '../lib/api'

function ChannelForm({ onCreated }: { onCreated: () => void }) {
  const [type, setType] = useState<'discord' | 'telegram'>('discord')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const config = type === 'discord'
        ? { webhook_url: webhookUrl }
        : { bot_token: botToken, chat_id: chatId }
      await api.notifications.createChannel({ type, config })
      setWebhookUrl('')
      setBotToken('')
      setChatId('')
      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-sm">Add Notification Channel</h3>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'discord' | 'telegram')}
          className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
        >
          <option value="discord">Discord</option>
          <option value="telegram">Telegram</option>
        </select>
      </div>

      {type === 'discord' ? (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Webhook URL</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            required
            className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Bot Token</label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              required
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Chat ID</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-1001234567890"
              required
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </>
      )}

      {error && <p className="text-error text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Channel'}
      </button>
    </form>
  )
}

export default function Settings() {
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [ch, mon] = await Promise.all([
        api.notifications.channels(),
        api.monitors.list(),
      ])
      setChannels(ch)
      setMonitors(mon)
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    try {
      await api.notifications.deleteChannel(id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete channel:', err)
    }
  }

  const handleTest = async (id: string) => {
    try {
      await api.notifications.testChannel(id)
      alert('Test notification sent!')
    } catch (err: any) {
      alert(`Test failed: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-40" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Notification Channels */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Notification Channels</h2>

        {channels.length > 0 && (
          <div className="space-y-3 mb-6">
            {channels.map((ch) => (
              <div key={ch.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    ch.type === 'discord' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {ch.type.toUpperCase()}
                  </span>
                  <span className="text-sm text-text-secondary truncate max-w-xs">
                    {ch.type === 'discord'
                      ? ch.config.webhook_url?.slice(0, 50) + '...'
                      : `Chat: ${ch.config.chat_id}`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(ch.id)}
                    className="px-3 py-1 text-xs border border-border rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleDelete(ch.id)}
                    className="px-3 py-1 text-xs text-error border border-error/20 rounded-lg hover:bg-error/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <ChannelForm onCreated={fetchData} />
      </section>

      {/* Monitor-Channel Linking */}
      {channels.length > 0 && monitors.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Monitor Notifications</h2>
          <p className="text-sm text-text-secondary mb-4">
            Link notification channels to specific monitors. When a monitor goes down, linked channels will be notified.
          </p>
          <div className="space-y-3">
            {monitors.map((m) => (
              <MonitorChannelLinks key={m.id} monitor={m} channels={channels} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function MonitorChannelLinks({ monitor, channels }: { monitor: Monitor; channels: NotificationChannel[] }) {
  const [linked, setLinked] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // We don't have a direct endpoint to get linked channels for a monitor,
    // so we track locally after user interactions
    setLoaded(true)
  }, [])

  const toggle = async (channelId: string) => {
    try {
      if (linked.has(channelId)) {
        await api.notifications.unlink(monitor.id, channelId)
        setLinked((prev) => { const next = new Set(prev); next.delete(channelId); return next })
      } else {
        await api.notifications.link(monitor.id, channelId)
        setLinked((prev) => new Set(prev).add(channelId))
      }
    } catch (err) {
      console.error('Failed to toggle notification link:', err)
    }
  }

  if (!loaded) return null

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="font-medium text-sm mb-3">{monitor.name}</p>
      <div className="flex flex-wrap gap-2">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => toggle(ch.id)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              linked.has(ch.id)
                ? 'bg-accent/10 border-accent text-accent'
                : 'border-border text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {ch.type === 'discord' ? 'Discord' : 'Telegram'} {linked.has(ch.id) ? '✓' : '+'}
          </button>
        ))}
      </div>
    </div>
  )
}
