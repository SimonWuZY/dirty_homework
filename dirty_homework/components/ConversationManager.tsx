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
  Select, 
  Divider,
  Empty,
  message,
  Spin
} from 'antd'
import { 
  SendOutlined, 
  UserOutlined,
  RobotOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { Conversation, Message, Character } from '../types'
import { conversationApi, characterApi } from '../services/api'

const { TextArea } = Input
const { Title, Text } = Typography
const { Option } = Select

interface ConversationManagerProps {
  scriptId: string | null
  characterId: string | null
}

const ConversationManager: React.FC<ConversationManagerProps> = ({ 
  scriptId, 
  characterId 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(characterId)
  const [userCharacter, setUserCharacter] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 获取对话列表
  const fetchConversations = async () => {
    if (!scriptId) return
    
    setLoading(true)
    try {
      const response = await conversationApi.getAll()
      if (response.success && response.data) {
        const filteredConversations = response.data.filter(
          conv => conv.scriptId === scriptId
        )
        setConversations(filteredConversations)
      }
    } catch (error) {
      message.error('获取对话列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取角色列表
  const fetchCharacters = async () => {
    if (!scriptId) return
    
    try {
      const response = await characterApi.getByScriptId(scriptId)
      if (response.success && response.data) {
        setCharacters(response.data)
      }
    } catch (error) {
      message.error('获取角色列表失败')
    }
  }

  useEffect(() => {
    fetchConversations()
    fetchCharacters()
  }, [scriptId])

  useEffect(() => {
    setSelectedCharacter(characterId)
  }, [characterId])

  // 创建新对话
  const createNewConversation = async () => {
    if (!scriptId || !selectedCharacter) {
      message.warning('请选择剧本和角色')
      return
    }

    try {
      const character = characters.find(c => c.id === selectedCharacter)
      const response = await conversationApi.create({
        title: `与${character?.name}的对话`,
        scriptId,
        currentCharacter: character,
        userCharacter: userCharacter ? characters.find(c => c.id === userCharacter) : undefined,
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

  // 加载对话
  const loadConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation)
    setSelectedCharacter(conversation.currentCharacter?.id || null)
    setUserCharacter(conversation.userCharacter?.id || null)
    
    try {
      const response = await conversationApi.getMessages(conversation.id)
      if (response.success && response.data) {
        setMessages(response.data)
      }
    } catch (error) {
      message.error('加载对话消息失败')
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

  if (!scriptId) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="请先选择一个剧本来开始对话"
      />
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: 16 }}>
      {/* 左侧对话列表 */}
      <div style={{ width: 300, display: 'flex', flexDirection: 'column' }}>
        <Card title="对话列表" size="small">
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>选择对话角色：</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="选择要对话的角色"
                  value={selectedCharacter}
                  onChange={setSelectedCharacter}
                >
                  {characters.map(character => (
                    <Option key={character.id} value={character.id}>
                      {character.name}
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div>
                <Text strong>扮演角色（可选）：</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="选择要扮演的角色"
                  value={userCharacter}
                  onChange={setUserCharacter}
                  allowClear
                >
                  {characters.map(character => (
                    <Option key={character.id} value={character.id}>
                      {character.name}
                    </Option>
                  ))}
                </Select>
              </div>
              
              <Button 
                type="primary" 
                icon={<MessageOutlined />}
                onClick={createNewConversation}
                disabled={!selectedCharacter}
                style={{ width: '100%' }}
              >
                开始新对话
              </Button>
            </Space>
          </div>
          
          <Divider />
          
          <List
            size="small"
            dataSource={conversations}
            renderItem={(conversation) => (
              <List.Item
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: currentConversation?.id === conversation.id ? '#f0f8ff' : 'transparent',
                  padding: 8,
                  borderRadius: 4
                }}
                onClick={() => loadConversation(conversation)}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<MessageOutlined />} size="small" />}
                  title={conversation.title}
                  description={new Date(conversation.updatedAt).toLocaleString()}
                />
              </List.Item>
            )}
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无对话" />
            }}
          />
        </Card>
      </div>

      {/* 右侧对话区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Card 
          title={currentConversation ? currentConversation.title : '对话区域'}
          size="small"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {currentConversation ? (
            <>
              {/* 消息列表 */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '16px 0',
                maxHeight: '400px'
              }}>
                <List
                  dataSource={messages}
                  renderItem={(message) => (
                    <List.Item style={{ border: 'none', padding: '8px 0' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: 12,
                        width: '100%'
                      }}>
                        <Avatar 
                          icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                          style={{ 
                            backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            backgroundColor: message.type === 'user' ? '#e6f7ff' : '#f6ffed',
                            padding: 12,
                            borderRadius: 8,
                            maxWidth: '80%',
                            wordBreak: 'break-word'
                          }}>
                            <Text>{message.content}</Text>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                  locale={{
                    emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="开始对话吧" />
                  }}
                />
                <div ref={messagesEndRef} />
              </div>

              {/* 输入区域 */}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    disabled={sending}
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={sending}
                    disabled={!inputValue.trim()}
                  >
                    发送
                  </Button>
                </Space.Compact>
              </div>
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="请选择或创建一个对话"
            />
          )}
        </Card>
      </div>
    </div>
  )
}

export default ConversationManager 