'use client'
import React, { useState, useEffect, useRef } from 'react'
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
import { useScriptStore, Role, Script } from '../lib/store'
import { useSSE } from '../lib/useSSE'
import ScriptSlider from './ScriptSlider'
import RoleSlider from './RoleSlider'
import { historyItem } from '../services/types'

const { TextArea } = Input
const { Text } = Typography

const ConversationManager: React.FC = () => {
  const [messages, setMessages] = useState<historyItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isReceiving, setIsReceiving] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  const { scripts, selectedScript, selectScript } = useScriptStore()
  const { startSSEConnection, closeConnection, isConnected } = useSSE()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 获取历史对话
  const fetchHistory = async () => {
    if (!selectedRole) return
    
    try {
      const response = await conversationApi.getHistory({
        role_id_user: 'user',
        role_id_assistant: selectedRole.id
      })
      
      if (response.code === 0 && response.data) {
        setMessages(response.data.history || [])
      } else {
        message.error(response.message || '获取历史对话失败')
      }
    } catch (error) {
      message.error('获取历史对话失败')
    }
  }

  // 发送消息并处理 SSE 响应
  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedRole) return
    
    // 添加用户消息到列表
    const userMessage: historyItem = {
      role: 'user',
      content: inputValue.trim()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsReceiving(true)

    try {
      // 开始 SSE 连接
      const sseUrl = `${process.env.REQUESTAPI}/chat`
      
      startSSEConnection(sseUrl, {
        onMessage: (data) => {
          if (data.content) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: data.content
            }])
          }
        },
        onError: (error) => {
          message.error('接收消息失败')
          console.log(error);
          setIsReceiving(false)
          closeConnection()
        }
      })

      // 发送用户消息
      await conversationApi.startSSE({
        role_id_user: 'user',
        role_id_assistant: selectedRole.id,
        content: inputValue.trim()
      })
      
      // 由于 startSSERsp 是空的，我们不需要处理响应
    } catch (error) {
      message.error('发送消息失败')
      setIsReceiving(false)
      closeConnection()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 处理角色选择
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    closeConnection() // 切换角色时关闭现有连接
    setMessages([])
    // 获取与新角色的历史对话
    fetchHistory()
  }

  // 处理剧本选择
  const handleScriptSelect = (script: Script) => {
    selectScript(script)
    closeConnection() // 切换剧本时关闭现有连接
    setSelectedRole(null)
    setMessages([])
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      closeConnection()
    }
  }, [])

  return (
    <div className="conversation-manager" style={{ padding: '20px 0' }}>
      <ScriptSlider
        scripts={scripts}
        currentScript={selectedScript}
        onScriptSelect={handleScriptSelect}
        cardHeight={120}
      />

      {selectedScript && (
        <RoleSlider
          roles={selectedScript.roles}
          selectedRole={selectedRole}
          onRoleSelect={handleRoleSelect}
          cardHeight={80}
        />
      )}

      <div style={{ marginTop: 20 }}>
        {selectedScript && selectedRole ? (
          <Card style={{ height: 'calc(100vh - 400px)' }}>
            <div style={{ 
              height: 'calc(100% - 100px)', 
              overflowY: 'auto',
              padding: '16px 0'
            }}>
              <List
                dataSource={messages}
                renderItem={(message) => (
                  <List.Item style={{ 
                    border: 'none', 
                    padding: '8px 16px',
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{ 
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 8
                    }}>
                      <Avatar 
                        icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        style={{ 
                          backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a'
                        }}
                      />
                      <div>
                        <div style={{ 
                          backgroundColor: message.role === 'user' ? '#e6f7ff' : '#f6ffed',
                          padding: '8px 12px',
                          borderRadius: 8,
                          position: 'relative'
                        }}>
                          <Text>{message.content}</Text>
                          {isReceiving && message.role === 'assistant' && (
                            <Spin size="small" style={{ marginLeft: 8 }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
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

            <div style={{ 
              borderTop: '1px solid #f0f0f0', 
              padding: '16px 0',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white'
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
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请先选择剧本和角色"
          />
        )}
      </div>
    </div>
  )
}

export default ConversationManager 