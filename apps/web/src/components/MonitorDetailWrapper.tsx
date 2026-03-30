import MonitorDetail from './MonitorDetail'

export default function MonitorDetailWrapper() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')

  if (!id) {
    return (
      <div className="p-6 text-center text-text-secondary">
        <p>No monitor ID provided</p>
        <a href="/app" className="text-accent hover:underline mt-2 inline-block">Back to Dashboard</a>
      </div>
    )
  }

  return <MonitorDetail monitorId={id} />
}
