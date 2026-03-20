import { FastifyInstance } from 'fastify'
import { getDb } from '../db/schema.js'
import { nanoid } from 'nanoid'

interface ChannelBody {
  type: 'discord' | 'telegram'
  config: Record<string, string>
  is_active?: boolean
}

export async function notificationRoutes(app: FastifyInstance) {
  const db = getDb()

  app.get('/notifications/channels', async () => {
    const result = await db.execute('SELECT * FROM notification_channels ORDER BY created_at DESC')
    return result.rows.map((c: any) => ({ ...c, config: JSON.parse(c.config) }))
  })

  app.post('/notifications/channels', async (req, reply) => {
    const body = req.body as ChannelBody
    if (!body.type || !body.config) return reply.status(400).send({ error: 'type and config are required' })

    const id = nanoid(12)
    await db.execute({
      sql: 'INSERT INTO notification_channels (id, type, config, is_active) VALUES (?, ?, ?, ?)',
      args: [id, body.type, JSON.stringify(body.config), body.is_active !== false ? 1 : 0]
    })

    const result = await db.execute({ sql: 'SELECT * FROM notification_channels WHERE id = ?', args: [id] })
    const channel = result.rows[0] as any
    return reply.status(201).send({ ...channel, config: JSON.parse(channel.config) })
  })

  app.delete('/notifications/channels/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const result = await db.execute({ sql: 'DELETE FROM notification_channels WHERE id = ?', args: [id] })
    if (result.rowsAffected === 0) return reply.status(404).send({ error: 'Channel not found' })
    return { success: true }
  })

  app.post('/monitors/:monitorId/notifications/:channelId', async (req, reply) => {
    const { monitorId, channelId } = req.params as { monitorId: string; channelId: string }
    try {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO monitor_notifications (monitor_id, channel_id) VALUES (?, ?)',
        args: [monitorId, channelId]
      })
      return { success: true }
    } catch {
      return reply.status(400).send({ error: 'Invalid monitor or channel ID' })
    }
  })

  app.delete('/monitors/:monitorId/notifications/:channelId', async (req, reply) => {
    const { monitorId, channelId } = req.params as { monitorId: string; channelId: string }
    await db.execute({
      sql: 'DELETE FROM monitor_notifications WHERE monitor_id = ? AND channel_id = ?',
      args: [monitorId, channelId]
    })
    return { success: true }
  })

  app.post('/notifications/test/:channelId', async (req, reply) => {
    const { channelId } = req.params as { channelId: string }
    const result = await db.execute({ sql: 'SELECT * FROM notification_channels WHERE id = ?', args: [channelId] })
    if (result.rows.length === 0) return reply.status(404).send({ error: 'Channel not found' })

    const channel = result.rows[0] as any
    const config = JSON.parse(channel.config)
    try {
      if (channel.type === 'discord') {
        await fetch(config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{ title: 'PingPath Test Notification', description: 'Your channel is configured correctly!', color: 0x6366f1, timestamp: new Date().toISOString() }]
          })
        })
      } else if (channel.type === 'telegram') {
        await fetch(`https://api.telegram.org/bot${config.bot_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: config.chat_id, text: '*PingPath Test Notification*\nYour channel is configured correctly!', parse_mode: 'Markdown' })
        })
      }
      return { success: true }
    } catch (err: any) {
      return reply.status(500).send({ error: `Failed to send test: ${err.message}` })
    }
  })
}
