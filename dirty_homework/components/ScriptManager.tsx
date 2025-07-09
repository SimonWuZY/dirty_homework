'use client'

import React, { useState, useRef } from 'react'
import { 
  Input, 
  Button, 
  Upload, 
  message,
  Card,
  Typography,
  Space,
  Divider,
  Spin,
  Empty,
  Modal,
  Form
} from 'antd'
import { 
  UploadOutlined, 
  SearchOutlined,
  EditOutlined,
  UserOutlined
} from '@ant-design/icons'
import { scriptApi } from '../services/api'
import { useScriptStore, Script, Role } from '../lib/store'

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
  const [title, setTitle] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form] = Form.useForm()
  
  const {
    scripts,
    selectedScript: currentScript,
    loading,
    addScript,
    updateScript,
    selectScript,
    setScriptRoles,
    updateScriptRole,
    setLoading
  } = useScriptStore()

  // 处理文件上传
  const handleUpload = async (file: File) => {
    if (!title.trim()) {
      message.error('请先输入剧本标题')
      return
    }

    setLoading(true)
    try {
      const response = await scriptApi.upload(file)
      if (response.code === 0) {
        const newScript: Script = {
          id: response.data.script_id,
          title: title,
          content: response.data.script_content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roles: []
        }
        
        addScript(newScript)
        selectScript(newScript)
        onScriptSelect(newScript.id)
        setTitle('')
        message.success('剧本上传成功')
      } else {
        message.error(response.message || '上传失败')
      }
    } catch (error) {
      message.error('上传失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理剧本分析
  const handleAnalyze = async () => {
    if (!currentScript) {
      message.warning('请先选择一个剧本')
      return
    }

    setAnalyzing(true)
    try {
      const response = await scriptApi.analyze(currentScript.id)
      if (response.code === 0) {
        setScriptRoles(currentScript.id, response.data.roles)
        message.success('剧本分析完成')
      } else {
        message.error(response.message || '分析失败')
      }
    } catch (error) {
      message.error('分析失败')
    } finally {
      setAnalyzing(false)
    }
  }

  // 处理剧本内容更新
  const handleContentUpdate = (field: 'title' | 'content', value: string) => {
    if (!currentScript) return
    
    updateScript(currentScript.id, { [field]: value })
  }

  // 处理角色编辑
  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    form.setFieldsValue({
      name: role.name,
      character: role.character,
      language_habit: role.language_habit
    })
  }

  // 处理角色更新
  const handleUpdateRole = async (values: { name: string; character: string; language_habit: string }) => {
    if (!editingRole || !currentScript) return

    try {
      const response = await scriptApi.modifyRole({
        id: editingRole.id,
        ...values
      })

      if (response.code === 0) {
        // 更新 store 中的角色信息
        updateScriptRole(currentScript.id, editingRole.id, values)
        message.success('角色修改成功')
        setEditingRole(null)
      } else {
        message.error(response.message || '修改失败')
      }
    } catch (error) {
      message.error('修改失败')
    }
  }

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
        message.error('请选择 .txt 格式的文件')
        return
      }
      handleUpload(file)
    }
    // 清空 input 值，允许重复选择同一文件
    event.target.value = ''
  }

  // 选择剧本
  const handleScriptSelect = (script: Script) => {
    selectScript(script)
    onScriptSelect(script.id)
  }

  return (
    <div className="script-manager">
      {/* 顶部操作区域 */}
      <div className="top-actions" style={{ marginBottom: 20 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="请输入剧本标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={triggerFileSelect}
            loading={loading}
          >
            上传剧本
          </Button>
          <Button 
            icon={<SearchOutlined />}
            onClick={handleAnalyze}
            loading={analyzing}
            disabled={!currentScript}
          >
            分析剧本
          </Button>
        </Space.Compact>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* 历史剧本横向滚动区域 */}
      {scripts.length > 0 && (
        <div className="script-history" style={{ marginBottom: 20 }}>
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            overflowX: 'auto', 
            padding: '8px 0',
            scrollbarWidth: 'thin'
          }}>
            {scripts.map((script) => (
              <Card
                key={script.id}
                size="small"
                style={{
                  minWidth: 200,
                  height: 140,
                  cursor: 'pointer',
                  border: currentScript?.id === script.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                  backgroundColor: currentScript?.id === script.id ? '#f0f8ff' : 'white'
                }}
                onClick={() => handleScriptSelect(script)}
                hoverable
              >
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Text strong style={{ fontSize: 14 }}>
                    {script.title}
                  </Text>
                  <div style={{ marginTop: 8, flex: 1, overflow: 'hidden' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {script.content.length > 50 
                        ? `${script.content.substring(0, 50)}...` 
                        : script.content
                      }
                    </Text>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(script.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      {currentScript && (
        <div className="main-content" style={{ display: 'flex', gap: 10, height: 500 }}>
          {/* 左侧编辑区域 */}
          <div className="edit-area" style={{ flex: 1 }}>
            <Card title="剧本预览">
              <div style={{ marginBottom: 16 }}>
                <Text strong>剧本标题</Text>
                <Input
                  value={currentScript.title}
                  readOnly
                  style={{ marginTop: 8, backgroundColor: '#f5f5f5', cursor: 'default' }}
                />
              </div>
              
              <div>
                <Text strong>剧本内容</Text>
                <TextArea
                  value={currentScript.content}
                  readOnly
                  rows={15}
                  style={{ marginTop: 8, backgroundColor: '#f5f5f5', cursor: 'default', height: 288}}
                />
              </div>
            </Card>
          </div>

          {/* 右侧角色信息区域 */}
          <div className="roles-area" style={{ width: 300 }}>
            <Card 
              title={
                <Space>
                  <UserOutlined />
                  <span>角色信息</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <div style={{ 
                height: 400, 
                overflowY: 'auto',
                paddingRight: 8
              }}>
                {(currentScript.roles || []).length > 0 ? (
                  <div>
                    {(currentScript.roles || []).map((role, index) => (
                      <Card
                        key={role.id || index}
                        size="small"
                        style={{ marginBottom: 12 }}
                        extra={
                          <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            onClick={() => handleEditRole(role)}
                          />
                        }
                      >
                        <div>
                          <Text strong style={{ color: '#1890ff' }}>
                            {role.name}
                          </Text>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <strong>性格特征：</strong>
                            </Text>
                            <div style={{ marginTop: 4 }}>
                              <Text style={{ fontSize: 12 }}>
                                {role.character}
                              </Text>
                            </div>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <strong>语言习惯：</strong>
                            </Text>
                            <div style={{ marginTop: 4 }}>
                              <Text style={{ fontSize: 12 }}>
                                {role.language_habit}
                              </Text>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无角色信息，请点击分析剧本"
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 角色编辑弹窗 */}
      <Modal
        title="编辑角色"
        open={!!editingRole}
        onCancel={() => setEditingRole(null)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleUpdateRole}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="character"
            label="性格特征"
            rules={[{ required: true, message: '请输入性格特征' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="language_habit"
            label="语言习惯"
            rules={[{ required: true, message: '请输入语言习惯' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditingRole(null)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 空状态 */}
      {scripts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无剧本，请上传剧本文件"
          />
        </div>
      )}
    </div>
  )
}

export default ScriptManager 