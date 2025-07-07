'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  List, 
  Avatar, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message,
  Typography,
  Space,
  Empty,
  Tag,
  Divider
} from 'antd'
import { 
  UserOutlined, 
  EditOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { Character } from '../types'
import { characterApi } from '../services/api'

const { TextArea } = Input
const { Title, Text } = Typography

interface CharacterManagerProps {
  scriptId: string | null
  onCharacterSelect: (characterId: string | null) => void
  selectedCharacter: string | null
}

const CharacterManager: React.FC<CharacterManagerProps> = ({ 
  scriptId, 
  onCharacterSelect, 
  selectedCharacter 
}) => {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [form] = Form.useForm()

  const fetchCharacters = async () => {
    if (!scriptId) return
    
    setLoading(true)
    try {
      const response = await characterApi.getByScriptId(scriptId)
      if (response.success && response.data) {
        setCharacters(response.data)
      } else {
        message.error(response.message || '获取角色列表失败')
      }
    } catch (error) {
      message.error('获取角色列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCharacters()
  }, [scriptId])

  const handleSubmit = async (values: any) => {
    if (!editingCharacter) return
    
    try {
      const response = await characterApi.update(editingCharacter.id, values)
      if (response.success) {
        message.success('角色信息更新成功')
        setModalVisible(false)
        setEditingCharacter(null)
        form.resetFields()
        fetchCharacters()
      } else {
        message.error(response.message || '更新失败')
      }
    } catch (error) {
      message.error('更新失败')
    }
  }

  const openEditModal = (character: Character) => {
    setEditingCharacter(character)
    setModalVisible(true)
    form.setFieldsValue({
      name: character.name,
      description: character.description,
      personality: character.personality,
    })
  }

  if (!scriptId) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="请先选择一个剧本来查看角色"
      />
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>角色列表</Title>
        <Text type="secondary">
          共 {characters.length} 个角色
        </Text>
      </div>

      <List
        loading={loading}
        dataSource={characters}
        renderItem={(character) => (
          <Card
            style={{ 
              marginBottom: 16,
              border: selectedCharacter === character.id ? '2px solid #1890ff' : '1px solid #f0f0f0'
            }}
            hoverable
            onClick={() => onCharacterSelect(character.id)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <Avatar 
                size={64} 
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      {character.name}
                    </Title>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">角色描述：</Text>
                      <Text>{character.description}</Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">性格特点：</Text>
                      <Text>{character.personality}</Text>
                    </div>
                  </div>
                  
                  <Space>
                    <Button 
                      size="small" 
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(character)
                      }}
                    >
                      编辑
                    </Button>
                    <Button 
                      size="small" 
                      type="primary"
                      icon={<MessageOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onCharacterSelect(character.id)
                      }}
                    >
                      对话
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          </Card>
        )}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="该剧本暂无角色，请先解析剧本生成角色"
            />
          )
        }}
      />

      <Modal
        title="编辑角色信息"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingCharacter(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="角色描述"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入角色描述..."
            />
          </Form.Item>
          
          <Form.Item
            name="personality"
            label="性格特点"
            rules={[{ required: true, message: '请输入性格特点' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入性格特点..."
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                更新
              </Button>
              <Button onClick={() => {
                setModalVisible(false)
                setEditingCharacter(null)
                form.resetFields()
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CharacterManager 