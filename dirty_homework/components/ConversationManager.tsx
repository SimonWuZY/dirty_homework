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
import { Conversation, Message } from '../types'
import { conversationApi } from '../services/api'
import { useScriptStore, Role, Script } from '../lib/store'
import ScriptSlider from './ScriptSlider'
import RoleSlider from './RoleSlider'

const { TextArea } = Input
const { Text } = Typography

const ConversationManager: React.FC = () => {
  // 状态管理
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  const { scripts, selectedScript, selectScript } = useScriptStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 获取对话列表
  const fetchConversations = async () => {
    if (!selectedScript) return
    
    setLoading(true)
    try {
      const response = await conversationApi.getAll()
      if (response.success && response.data) {
        const filteredConversations = response.data.filter(
          conv => conv.scriptId === selectedScript.id
        )
        setConversations(filteredConversations)
      }
    } catch (error) {
      message.error('获取对话列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedScript) {
      fetchConversations()
      setSelectedRole(null) // 重置选中的角色
    }
  }, [selectedScript])

  // 创建新对话
  const createNewConversation = async () => {
    if (!selectedScript || !selectedRole) {
      message.warning('请选择剧本和角色')
      return
    }

    try {
      const response = await conversationApi.create({
        title: `与${selectedRole.name}的对话`,
        scriptId: selectedScript.id,
        currentCharacter: {
          id: selectedRole.id,
          name: selectedRole.name,
          description: selectedRole.language_habit,
          personality: selectedRole.character,
          scriptId: selectedScript.id
        },
        messages: []
      })

      if (response.success && response.data) {
        setCurrentConversation(response.data)
        setMessages([])
        fetchConversations()
        message.success('对话创建成功')
      }
    } catch (error) {
      message.error('创建对话失败')
    }
  }

  // 发送消息
  const sendMessage = async () => {
    if (!inputValue.trim() || !currentConversation) return
    
    const newMessage: Partial<Message> = {
      content: inputValue.trim(),
      sender: 'user',
      type: 'user',
      timestamp: new Date().toISOString()
    }

    setSending(true)
    try {
      const response = await conversationApi.sendMessage(currentConversation.id, newMessage)
      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!])
        setInputValue('')
        
        // 等待AI回复
        setTimeout(async () => {
          try {
            const aiResponse = await conversationApi.sendMessage(currentConversation.id, {
              content: '', // 空内容表示请求AI回复
              sender: currentConversation.currentCharacter?.name || 'AI',
              type: 'character',
              timestamp: new Date().toISOString()
            })
            if (aiResponse.success && aiResponse.data) {
              setMessages(prev => [...prev, aiResponse.data!])
            }
          } catch (error) {
            message.error('AI回复失败')
          }
        }, 1000)
      }
    } catch (error) {
      message.error('发送消息失败')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="conversation-manager" style={{ padding: '20px 0' }}>
      {/* 剧本选择器 */}
      <ScriptSlider
        scripts={scripts}
        currentScript={selectedScript}
        onScriptSelect={selectScript}
        cardHeight={120}
      />

      {/* 角色选择器 */}
      {selectedScript && (
        <RoleSlider
          roles={selectedScript.roles}
          selectedRole={selectedRole}
          onRoleSelect={setSelectedRole}
          cardHeight={80}
        />
      )}

      {/* 对话区域 */}
      <div style={{ marginTop: 20 }}>
        {selectedScript && selectedRole ? (
          <Card style={{ height: 'calc(100vh - 400px)' }}>
            {/* 消息列表 */}
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
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{ 
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 8
                    }}>
                      <Avatar 
                        icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        style={{ 
                          backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a'
                        }}
                      />
                      <div>
                        <div style={{ 
                          backgroundColor: message.type === 'user' ? '#e6f7ff' : '#f6ffed',
                          padding: '8px 12px',
                          borderRadius: 8,
                          position: 'relative'
                        }}>
                          <Text>{message.content}</Text>
                        </div>
                        <div style={{ 
                          textAlign: message.type === 'user' ? 'right' : 'left',
                          marginTop: 4
                        }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
                locale={{
                  emptyText: (
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      description={
                        currentConversation 
                          ? "开始对话吧" 
                          : <Button type="primary" onClick={createNewConversation}>开始新对话</Button>
                      }
                    />
                  )
                }}
              />
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
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
                  disabled={sending}
                  style={{ borderRadius: '4px 0 0 4px' }}
                />
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  loading={sending}
                  disabled={!inputValue.trim() || !currentConversation}
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