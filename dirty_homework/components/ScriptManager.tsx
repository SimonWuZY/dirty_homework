'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Upload, 
  Modal, 
  Form, 
  Input, 
  List, 
  Space, 
  Popconfirm, 
  message,
  Typography,
  Tag,
  Empty
} from 'antd'
import { 
  PlusOutlined, 
  UploadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { Script } from '../types'
import { scriptApi } from '../services/api'

const { TextArea } = Input
const { Title, Text } = Typography

interface ScriptManagerProps {
  onScriptSelect: (scriptId: string | null) => void
  selectedScript: string | null
}

const ScriptManager: React.FC<ScriptManagerProps> = ({ 
  onScriptSelect, 
  selectedScript 
}) => {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingScript, setEditingScript] = useState<Script | null>(null)
  const [form] = Form.useForm()

  const fetchScripts = async () => {
    setLoading(true)
    try {
      const response = await scriptApi.getAll()
      if (response.success && response.data) {
        setScripts(response.data)
      }
    } catch (error) {
      message.error('获取剧本列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScripts()
  }, [])

  const handleUpload = async (file: File) => {
    try {
      const response = await scriptApi.upload(file)
      if (response.success) {
        message.success('剧本上传成功')
        fetchScripts()
      }
    } catch (error) {
      message.error('上传失败')
    }
    return false
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingScript) {
        const response = await scriptApi.update(editingScript.id, values)
        if (response.success) {
          message.success('剧本更新成功')
          setModalVisible(false)
          setEditingScript(null)
          form.resetFields()
          fetchScripts()
        }
      } else {
        const response = await scriptApi.create(values)
        if (response.success) {
          message.success('剧本创建成功')
          setModalVisible(false)
          form.resetFields()
          fetchScripts()
        }
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDelete = async (scriptId: string) => {
    try {
      const response = await scriptApi.delete(scriptId)
      if (response.success) {
        message.success('删除成功')
        if (selectedScript === scriptId) {
          onScriptSelect(null)
        }
        fetchScripts()
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleParse = async (scriptId: string) => {
    try {
      const response = await scriptApi.parse(scriptId)
      if (response.success) {
        message.success('角色解析成功')
        fetchScripts()
      }
    } catch (error) {
      message.error('解析失败')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingScript(null)
            setModalVisible(true)
            form.resetFields()
          }}
        >
          创建剧本
        </Button>
        <Upload
          accept=".txt"
          beforeUpload={handleUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>
            上传剧本
          </Button>
        </Upload>
      </div>

      <List
        loading={loading}
        dataSource={scripts}
        renderItem={(script) => (
          <Card
            style={{ 
              marginBottom: 16,
              border: selectedScript === script.id ? '2px solid #1890ff' : '1px solid #f0f0f0'
            }}
            hoverable
            onClick={() => onScriptSelect(script.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {script.title}
                </Title>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    <CalendarOutlined /> {new Date(script.createdAt).toLocaleDateString()}
                  </Text>
                  {script.characters && script.characters.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">角色数量: </Text>
                      <Tag color="blue">{script.characters.length}</Tag>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text ellipsis={{ tooltip: script.content }}>
                    {script.content.substring(0, 200)}...
                  </Text>
                </div>
              </div>
              
              <Space>
                {script.characters && script.characters.length === 0 && (
                  <Button 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleParse(script.id)
                    }}
                  >
                    解析角色
                  </Button>
                )}
                <Button 
                  size="small" 
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingScript(script)
                    setModalVisible(true)
                    form.setFieldsValue({
                      title: script.title,
                      content: script.content,
                    })
                  }}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除这个剧本吗？"
                  onConfirm={(e) => {
                    e?.stopPropagation()
                    handleDelete(script.id)
                  }}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </Card>
        )}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无剧本，请创建或上传剧本"
            />
          )
        }}
      />

      <Modal
        title={editingScript ? '编辑剧本' : '创建剧本'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingScript(null)
          form.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="剧本标题"
            rules={[{ required: true, message: '请输入剧本标题' }]}
          >
            <Input placeholder="请输入剧本标题" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="剧本内容"
            rules={[{ required: true, message: '请输入剧本内容' }]}
          >
            <TextArea 
              rows={15} 
              placeholder="请输入剧本内容..."
              showCount
              maxLength={10000}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingScript ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false)
                setEditingScript(null)
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

export default ScriptManager 