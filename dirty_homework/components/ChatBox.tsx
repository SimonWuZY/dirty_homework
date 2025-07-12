import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Avatar, 
  Typography, 
  Space, 
  Empty,
  message,
  Spin
} from 'antd'
import { 
  SendOutlined, 
  UserOutlined,
  RobotOutlined
} from '@ant-design/icons'
import { conversationApi } from '../services/api'
import { historyItem, startSSEReq } from '../services/types'
import { Role } from '../lib/store'

const { TextArea } = Input
const { Text } = Typography

interface ChatBoxProps {
  userRole: Role | null  // 用户角色，null表示游客模式
  assistantRole: Role    // 助手角色
  conversationMode: 'single' | 'dual'
  height?: number
}

const ChatBox: React.FC<ChatBoxProps> = ({
  userRole,
  assistantRole,
  conversationMode,
  height = 600
}) => {
  const [messages, setMessages] = useState<historyItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isReceiving, setIsReceiving] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sseControllerRef = useRef<AbortController | null>(null)
  const streamingMessageRef = useRef<string>('')
  const isCompletingRef = useRef<boolean>(false)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // 获取历史对话
  const fetchHistory = useCallback(async () => {
    try {
      const response = await conversationApi.getHistory({
        role_id_user: userRole?.id || '', // 游客模式时为空字符串
        role_id_assistant: assistantRole.id
      })
      
      if (response.code === 0 && response.data) {
        setMessages(response.data.history || [])
      } else {
        message.error(response.message || '获取历史对话失败')
      }
    } catch (error) {
      message.error('获取历史对话失败')
    }
  }, [userRole?.id, assistantRole.id])

  // 初始化时获取历史对话
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // 角色变化时重新获取历史对话
  useEffect(() => {
    setMessages([])
    setStreamingMessage('')
    streamingMessageRef.current = ''
    fetchHistory()
  }, [userRole?.id, assistantRole.id, fetchHistory])

  // 完成消息处理
  const completeMessage = useCallback(() => {
    if (!streamingMessageRef.current || isCompletingRef.current) return
    
    isCompletingRef.current = true
    
    // 先将流式消息添加到历史记录
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: streamingMessageRef.current
    }])
    
    // 等待状态更新后再清空流式消息
    setTimeout(() => {
      setStreamingMessage('')
      streamingMessageRef.current = ''
      setIsReceiving(false)
      isCompletingRef.current = false
    }, 100)
  }, [])

  // SSE 流式处理
  const startSSEConnection = async (requestData: startSSEReq) => {
    try {
      // 取消之前的请求
      if (sseControllerRef.current) {
        sseControllerRef.current.abort()
      }

      // 创建新的 AbortController
      const controller = new AbortController()
      sseControllerRef.current = controller

      // 重置流式消息状态
      streamingMessageRef.current = ''
      setStreamingMessage('')
      isCompletingRef.current = false

      const response = await fetch(`${process.env.REQUESTAPI}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      // 开始读取流
      while (true) {
        const { value, done } = await reader.read()
        
        if (done) {
          // 流结束处理
          completeMessage()
          break
        }

        // 解码数据
        const chars = new TextDecoder().decode(value)
        
        // 按双换行符分割数据块
        const dataBlocks = chars.split('\n\n')
        
        // 处理每个数据块
        for (const block of dataBlocks) {
          if (!block.trim() || isCompletingRef.current) continue
          
          // 分析数据块的行
          const lines = block.split('\n')
          let eventType = ''
          let dataContent = ''
          
          // 解析事件类型和数据内容
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim()
            } else if (line.startsWith('data:')) {
              dataContent = line.substring(5).trim()
            }
          }
          
          // 只处理 message 事件
          if (eventType === 'message' && dataContent) {
            try {
              const jsonObject = JSON.parse(dataContent)
              
              // 检查是否有 choices 数组
              if (jsonObject.choices && jsonObject.choices.length > 0) {
                const choice = jsonObject.choices[0]
                
                // 检查是否结束
                if (choice.finish_reason === 'stop') {
                  // 消息结束处理
                  completeMessage()
                  return
                }
                
                // 提取增量内容
                if (choice.delta && choice.delta.content && !isCompletingRef.current) {
                  const content = choice.delta.content
                  streamingMessageRef.current += content
                  setStreamingMessage(streamingMessageRef.current)
                }
              }
            } catch (parseError) {
              console.warn('JSON parse error:', parseError, 'Data:', dataContent)
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('SSE request was aborted')
      } else {
        console.error('SSE error:', error)
        message.error('接收消息失败')
      }
      setIsReceiving(false)
      setStreamingMessage('')
      streamingMessageRef.current = ''
      isCompletingRef.current = false
    }
  }

  // 停止 SSE 连接
  const stopSSEConnection = () => {
    if (sseControllerRef.current) {
      sseControllerRef.current.abort()
      sseControllerRef.current = null
    }
    setIsReceiving(false)
    setStreamingMessage('')
    streamingMessageRef.current = ''
    isCompletingRef.current = false
  }

  // 发送消息
  const sendMessage = async () => {
    if (!inputValue.trim() || isReceiving) return
    
    // 添加用户消息到列表
    const userMessage: historyItem = {
      role: 'user',
      content: inputValue.trim()
    }
    
    setMessages(prev => [...prev, userMessage])
    const messageContent = inputValue.trim()
    setInputValue('')
    setIsReceiving(true)

    // 构建请求数据
    const requestData: startSSEReq = {
      role_id_user: userRole?.id || '', // 游客模式时为空字符串
      role_id_assistant: assistantRole.id,
      content: messageContent
    }

    console.log('发送SSE请求:', requestData)

    // 开始 SSE 连接
    await startSSEConnection(requestData)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopSSEConnection()
    }
  }, [])

  // 渲染消息列表（修复时序问题）
  const renderMessages = () => {
    const allMessages = [...messages]
    
    // 如果正在接收消息且有流式内容且未完成，显示流式消息
    if (isReceiving && streamingMessage && !isCompletingRef.current) {
      allMessages.push({
        role: 'assistant',
        content: streamingMessage
      })
    }
    
    return allMessages
  }

  return (
    <Card 
      style={{ 
        height: height,
        display: 'flex',
        flexDirection: 'column'
      }}
      bodyStyle={{ 
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 消息显示区域 - 固定高度，可滚动 */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <List
          dataSource={renderMessages()}
          renderItem={(message, index) => {
            const isLastAssistantMessage = isReceiving && 
              message.role === 'assistant' && 
              index === renderMessages().length - 1
              
            return (
              <List.Item style={{ 
                border: 'none', 
                padding: '8px 0',
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start'
              }}>
                <div style={{ 
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  minHeight: 'auto'
                }}>
                  <Avatar 
                    icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{ 
                      backgroundColor: message.role === 'user' ? '#52c41a' : '#1890ff',
                      flexShrink: 0,
                      marginTop: 4
                    }}
                  />
                  <div style={{ 
                    flex: 1,
                    minWidth: 0,
                    wordBreak: 'break-word'
                  }}>
                    <div style={{ 
                      backgroundColor: message.role === 'user' ? '#f6ffed' : '#e6f7ff',
                      padding: '12px 16px',
                      borderRadius: 12,
                      position: 'relative',
                      lineHeight: 1.5
                    }}>
                      <Text style={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        display: 'block'
                      }}>
                        {message.content}
                      </Text>
                      {isLastAssistantMessage && (
                        <Spin size="small" style={{ marginLeft: 8, verticalAlign: 'middle' }} />
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            )
          }}
          locale={{
            emptyText: (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="开始对话吧"
              />
            )
          }}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 - 固定在底部 */}
      <div style={{ 
        padding: '16px',
        backgroundColor: 'white',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={isReceiving}
            style={{ borderRadius: '4px 0 0 4px' }}
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={sendMessage}
            loading={isReceiving}
            disabled={!inputValue.trim() || isReceiving}
            style={{ borderRadius: '0 4px 4px 0' }}
          >
            发送
          </Button>
        </Space.Compact>
      </div>
    </Card>
  )
}

export default ChatBox 