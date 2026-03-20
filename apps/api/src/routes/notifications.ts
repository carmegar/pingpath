import { FastifyInstance } from 'fastify'
import { getDb } from '../db/schema.js'
import { nanoid } from 'nanoid'

interface ChannelBody {
  type: 'discord' | 'telegram'
  config: Record<string, string>
  is_active?: boolean
}

export async function notificationRoutes(app: FastifyInstance) {
  // List channels
  app.get('/notifications/channels', async () => {
    const db = getDb()
    const channels = db.prepare('SELECT * FROM notification_channels ORDER BY created_at DESC').all()
    return channels.map((c: any) => ({ ...c, config: JSON.parse(c.config) }))
  })

  // Create channel
  app.post('/notifications/channels', async (req, reply) => {
    const body = req.body as ChannelBody
    if (!body.type || !body.config) {
      return reply.status(400).send({ error: 'type and config are required' })
    }

    const db = getDb()
    const id = nanoid(12)
    db.prepare('INSERT INTO notification_channels (id, type, config, is_active) VALUES (?, ?, ?, ?)').run(
      id, body.type, JSON.stringify(body.config), body.is_active !== false ? 1 : 0
    )

    const channel = db.prepare('SELECT * FROM notification_channels WHERE id = ?').get(id) as any
    return reply.status(201).send({ ...channel, config: JSON.parse(channel.config) })
  })

  // Delete channel
  app.delete('/notifications/channels/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const db = getDb()
    const result = db.prepare('DELETE FROM notification_channels WHERE id = ?').run(id)
    if (result.changes === 0) return reply.status(404).send({ error: 'Channel not found' })
    return { success: true }
  })

  // Link monitor to channel
  app.post('/monitors/:monitorId/notifications/:channelId', async (req, reply) => {
    const { monitorId, channelId } = req.params as { monitorId: string; channelId: string }
    const db = getDb()
    try {
      db.prepare('INSERT OR IGNORE INTO monitor_notifications (monitor_id, channel_id) VALUES (?, ?)').run(monitorId, channelId)
      return { success: true }
    } catch {
      return reply.status(400).send({ error: 'Invalid monitor or channel ID' })
    }
  })

  // Unlink monitor from channel
  app.delete('/monitors/:monitorId/notifications/:channelId', async (req, reply) => {
    const { monitorId, channelId } = req.params as { monitorId: string; channelId: string }
    const db = getDb()
    db.prepare('DELETE FROM monitor_notifications WHERE monitor_id = ? AND channel_id = ?').run(monitorId, channelId)
    return { success: true }
  })

  // Test a channel
  app.post('/notifications/test/:channelId', async (req, reply) => {
    const { channelId } = req.params as { channelId: string }
    const db = getDb()
    const channel = db.prepare('SELECT * FROM notification_channels WHERE id = ?').get(channelId) as any
    if (!channel) return reply.status(404).send({ error: 'Channel not found' })

    const config = JSON.parse(channel.config)
    try {
      if (channel.type === 'discord') {
        await fetch(config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🧪 PingPath Test Notification',
              description: 'This is a test notification from PingPath. Your channel is configured correctly!',
              color: 0x6366f1,
              timestamp: new Date().toISOString()
            }]
          })
        })
      } else if (channel.type === 'telegram') {
        await fetch(`https://api.telegram.org/bot${config.bot_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.chat_id,
            text: '🧪 *PingPath Test Notification*\nYour channel is configured correctly!',
            parse_mode: 'Markdown'
          })
        })
      }
      return { success: true }
    } catch (err: any) {
      return reply.status(500).send({ error: `Failed to send test: ${err.message}` })
    }
  })
}
