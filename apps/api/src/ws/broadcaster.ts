interface WSClient {
  readyState: number
  send: (data: string) => void
  on: (event: string, cb: () => void) => void
}

const clients = new Set<WSClient>()

export function addClient(ws: WSClient): void {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
  ws.on('error', () => clients.delete(ws))
}

export function broadcast(event: string, data: unknown): void {
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() })
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message)
    }
  }
}
