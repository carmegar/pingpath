export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-20 text-center">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
              Open Source Uptime Monitor
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Know when your
            <br />
            <span className="text-accent">services go down</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10">
            PingPath monitors your endpoints 24/7, shows real-time latency graphs,
            and alerts you via Discord &amp; Telegram before your users notice.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/app"
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors text-sm"
            >
              Open Dashboard
            </a>
            <a
              href="/status"
              className="px-6 py-3 border border-border hover:bg-surface-hover rounded-xl font-medium transition-colors text-sm"
            >
              View Status Page
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-surface border border-border rounded-xl p-6 hover:border-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4 text-accent">
                {f.icon}
              </div>
              <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">AI-Powered Incident Summaries</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                When an incident resolves, PingPath uses a local AI model (Qwen2 0.5B via Ollama) to
                analyze error patterns, latency data, and status codes — generating a concise summary
                of what happened and the likely cause.
              </p>
              <div className="bg-bg/50 border border-border rounded-lg p-4">
                <p className="text-[10px] font-semibold text-accent uppercase mb-1.5">Example Summary</p>
                <p className="text-xs text-text-secondary italic">
                  "API Backend was down for 4 minutes (14:32 - 14:36). The service stopped responding
                  with ECONNREFUSED errors, suggesting the process crashed. It recovered automatically
                  after a restart."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-6 text-center">Built With</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {techStack.map((t) => (
            <span key={t} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-secondary">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-xs text-text-secondary">
          <p className="mb-2">
            <strong>PingPath</strong> &mdash; Self-hosted uptime monitor &amp; status page
          </p>
          <p>Deployed on <strong>CubePath</strong> &middot; Made for the CubePath 2026 Hackathon</p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'Real-time Monitoring',
    desc: 'HTTP/HTTPS health checks every 30-600 seconds with configurable intervals per endpoint.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    title: 'Public Status Page',
    desc: 'Share a beautiful status page with your users. 90-day uptime bars, incident timeline, light/dark theme.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    title: 'Instant Alerts',
    desc: 'Get notified via Discord webhooks or Telegram bot when services go down or recover.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  },
  {
    title: 'Latency Graphs',
    desc: 'Interactive response time charts powered by Recharts. See performance trends at a glance.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
  },
  {
    title: 'WebSocket Updates',
    desc: 'Dashboard updates in real-time via WebSockets. No need to refresh to see the latest status.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg>,
  },
  {
    title: 'SVG Badges',
    desc: 'Embed uptime badges in your README. Auto-generated SVGs with current status and uptime %.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
]

const techStack = [
  'Astro', 'React 19', 'Tailwind CSS v4', 'Recharts',
  'Fastify', 'TypeScript', 'SQLite', 'WebSockets',
  'Ollama (Qwen2)', 'CubePath VPS',
]
