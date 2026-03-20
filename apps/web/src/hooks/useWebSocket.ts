import { useEffect, useRef, useCallback } from 'react'

interface WSMessage {
  event: string
  data: unknown
  timestamp: string
}

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const wsUrl = (import.meta.env.PUBLIC_WS_URL) || `ws://${window.location.hostname}:3001/ws`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage
        onMessageRef.current(msg)
      } catch { /* ignore malformed messages */ }
    }

    ws.onclose = () => {
      setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])
}
