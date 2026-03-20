import { useState } from 'react'
import { api } from '../lib/api'

interface MonitorModalProps {
  onClose: () => void
  onCreated: () => void
}

export default function MonitorModal({ onClose, onCreated }: MonitorModalProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [interval, setInterval] = useState(60)
  const [expectedStatus, setExpectedStatus] = useState(200)
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.monitors.create({
        name,
        url,
        method,
        interval_seconds: interval,
        expected_status: expectedStatus,
        is_public: isPublic,
      })
      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">New Monitor</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API"
              required
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/health"
              required
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              >
                <option>GET</option>
                <option>POST</option>
                <option>HEAD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Interval (sec)</label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              >
                <option value={30}>30s</option>
                <option value={60}>1 min</option>
                <option value={300}>5 min</option>
                <option value={600}>10 min</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Expected Status</label>
              <input
                type="number"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-border accent-accent"
                />
                <span className="text-sm">Public on status page</span>
              </label>
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
