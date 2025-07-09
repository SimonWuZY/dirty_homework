import { useState, useEffect, useCallback, useRef } from 'react'

interface SSEOptions {
  onMessage: (data: any) => void
  onError?: (error: any) => void
  onComplete?: () => void
}

export const useSSE = () => {
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const startSSEConnection = useCallback((url: string, options: SSEOptions) => {
    // 关闭已存在的连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // 创建新的 EventSource
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    // 连接建立
    eventSource.onopen = () => {
      setIsConnected(true)
    }

    // 接收消息
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        options.onMessage(data)
      } catch (error) {
        options.onError?.(error)
      }
    }

    // 错误处理
    eventSource.onerror = (error) => {
      setIsConnected(false)
      options.onError?.(error)
      eventSource.close()
      eventSourceRef.current = null
    }

    // 返回清理函数
    return () => {
      eventSource.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  return {
    startSSEConnection,
    closeConnection,
    isConnected
  }
} 