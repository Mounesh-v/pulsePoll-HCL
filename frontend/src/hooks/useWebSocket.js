import { useEffect, useRef, useState } from 'react'
import { getPollWebSocketUrl } from '../services/api'

export function useWebSocket(pollId, { onMessage, enabled = true } = {}) {
  const [status, setStatus] = useState('idle')
  const [lastEvent, setLastEvent] = useState(null)
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!pollId || !enabled) {
      return undefined
    }

    let socket
    let reconnectTimer
    let attempt = 0
    let disposed = false

    const connect = () => {
      if (disposed) {
        return
      }

      setStatus(attempt === 0 ? 'connecting' : 'reconnecting')

      socket = new WebSocket(getPollWebSocketUrl(pollId))

      socket.onopen = () => {
        attempt = 0
        setStatus('open')
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastEvent(data)
          onMessageRef.current?.(data)
        } catch {
          setLastEvent(null)
        }
      }

      socket.onerror = () => {
        socket?.close()
      }

      socket.onclose = () => {
        if (disposed) {
          return
        }

        setStatus('closed')
        const delay = Math.min(1000 * 2 ** attempt, 10000)
        attempt += 1
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      disposed = true
      clearTimeout(reconnectTimer)

      if (socket) {
        socket.onclose = null
        socket.close()
      }
    }
  }, [pollId, enabled])

  return { status, lastEvent }
}

export default useWebSocket
