import { getDb } from '../db/schema.js'

interface Monitor {
  id: string
  name: string
  url: string
}

export async function sendNotification(
  monitor: Monitor,
  status: string,
  event: 'started' | 'resolved'
): Promise<void> {
  const db = getDb()

  // Get notification channels linked to this monitor
  const channels = db.prepare(`
    SELECT nc.* FROM notification_channels nc
    JOIN monitor_notifications mn ON mn.channel_id = nc.id
    WHERE mn.monitor_id = ? AND nc.is_active = 1
  `).all(monitor.id) as any[]

  for (const channel of channels) {
    const config = JSON.parse(channel.config)
    try {
      if (channel.type === 'discord') {
        await sendDiscord(config.webhook_url, monitor, status, event)
      } else if (channel.type === 'telegram') {
        await sendTelegram(config.bot_token, config.chat_id, monitor, status, event)
      }
    } catch (err) {
      console.error(`Failed to send ${channel.type} notification:`, err)
    }
  }
}

async function sendDiscord(
  webhookUrl: string,
  monitor: Monitor,
  status: string,
  event: 'started' | 'resolved'
): Promise<void> {
  const isDown = event === 'started'
  const color = isDown ? 0xef4444 : 0x22c55e
  const emoji = isDown ? '🔴' : '🟢'
  const title = isDown
    ? `${emoji} ${monitor.name} is ${status}`
    : `${emoji} ${monitor.name} is back up`

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title,
        description: `**URL:** ${monitor.url}`,
        color,
        timestamp: new Date().toISOString(),
        footer: { text: 'PingPath Monitor' }
      }]
    })
  })
}

async function sendTelegram(
  botToken: string,
  chatId: string,
  monitor: Monitor,
  status: string,
  event: 'started' | 'resolved'
): Promise<void> {
  const isDown = event === 'started'
  const emoji = isDown ? '🔴' : '🟢'
  const text = isDown
    ? `${emoji} *${monitor.name}* is ${status}\nURL: ${monitor.url}`
    : `${emoji} *${monitor.name}* is back up\nURL: ${monitor.url}`

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  })
}
