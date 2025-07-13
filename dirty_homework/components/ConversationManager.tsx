'use client'
import React, { useState } from 'react'
import {
  Card,
  Typography,
  Space,
  Empty,
  Tag
} from 'antd'
import { useScriptStore, Role, Script } from '../lib/store'
import ScriptSlider from './ScriptSlider'
import RoleSlider from './RoleSlider'
import ChatBox from './ChatBox'

const { Text } = Typography

interface SelectedRole {
  role: Role
  order: 1 | 2  // 1: 绿色（用户角色），2: 蓝色（助手角色）
}

const ConversationManager: React.FC = () => {
  const [selectedRoles, setSelectedRoles] = useState<SelectedRole[]>([])
  const [conversationMode, setConversationMode] = useState<'single' | 'dual'>('single')

  const { scripts, selectedScript, selectScript } = useScriptStore()

  // 获取用户角色（第一个选择的角色）
  const getUserRole = (): Role | null => {
    const userRole = selectedRoles.find(r => r.order === 1)
    return userRole ? userRole.role : null
  }

  // 获取助手角色（第二个选择的角色，或单选模式下的唯一角色）
  const getAssistantRole = (): Role | null => {
    if (conversationMode === 'single') {
      // 单选模式下，助手角色就是order为1的角色
      const assistantRole = selectedRoles.find(r => r.order === 1)
      return assistantRole ? assistantRole.role : null
    } else {
      // 双选模式下，助手角色是order为2的角色
      const assistantRole = selectedRoles.find(r => r.order === 2)
      return assistantRole ? assistantRole.role : null
    }
  }

  // 处理角色选择
  const handleRoleSelect = (role: Role) => {
    // 检查是否已经选择了这个角色
    const existingIndex = selectedRoles.findIndex(r => r.role.id === role.id)

    if (existingIndex !== -1) {
      // 如果已经选择了，则取消选择
      const newSelectedRoles = selectedRoles.filter(r => r.role.id !== role.id)

      // 调整剩余角色的order
      if (newSelectedRoles.length === 1) {
        // 如果剩余一个角色，将其设置为order: 1（用户角色/单选模式）
        setSelectedRoles([{ role: newSelectedRoles[0].role, order: 1 }])
        setConversationMode('single')
      } else if (newSelectedRoles.length === 0) {
        // 如果没有剩余角色
        setSelectedRoles([])
        setConversationMode('single')
      } else {
        // 如果剩余多个角色，保持原有order
        setSelectedRoles(newSelectedRoles)
      }
    } else {
      // 如果没有选择，则添加
      if (selectedRoles.length === 0) {
        // 第一个选择的角色
        setSelectedRoles([{ role, order: 1 }])
        setConversationMode('single')
      } else if (selectedRoles.length === 1) {
        // 第二个选择的角色
        setSelectedRoles(prev => [...prev, { role, order: 2 }])
        setConversationMode('dual')
      } else {
        // 如果已经选择了两个角色，替换第一个
        setSelectedRoles([{ role, order: 1 }, selectedRoles[1]])
      }
    }
  }

  // 处理剧本选择
  const handleScriptSelect = (script: Script) => {
    selectScript(script)
    setSelectedRoles([])
    setConversationMode('single')
  }

  // 获取角色在选择中的颜色
  const getRoleColor = (roleId: string): string | undefined => {
    const selectedRole = selectedRoles.find(r => r.role.id === roleId)
    if (!selectedRole) return undefined
    return selectedRole.order === 1 ? '#52c41a' : '#1890ff' // 绿色和蓝色
  }

  // 获取对话模式描述
  const getConversationModeDescription = () => {
    const userRole = getUserRole()
    const assistantRole = getAssistantRole()

    if (conversationMode === 'single' && assistantRole) {
      return `游客与 ${assistantRole.name} 对话`
    } else if (conversationMode === 'dual' && userRole && assistantRole) {
      return `${userRole.name} 与 ${assistantRole.name} 对话`
    }
    return '请选择对话角色'
  }

  return (
    <div className="conversation-manager" style={{ padding: '20px 0' }}>
      {/* 剧本选择区域 */}
      <ScriptSlider
        scripts={scripts}
        currentScript={selectedScript}
        onScriptSelect={handleScriptSelect}
        cardHeight={120}
      />

      {/* 角色选择和对话模式显示 */}
      {selectedScript && (
        <div style={{ marginTop: 20 }}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>对话模式: </Text>
                <Text>{getConversationModeDescription()}</Text>
              </div>
              <div>
                {selectedRoles.length === 1 ? (
                  <Tag
                    key={selectedRoles[0].role.id}
                    color="blue"
                    style={{ marginLeft: 8 }}
                  >
                    助手: {selectedRoles[0].role.name}
                  </Tag>
                ) : (
                  selectedRoles.map(({ role, order }) => (
                    <Tag
                      key={role.id}
                      color={order === 1 ? 'green' : 'blue'}
                      style={{ marginLeft: 8 }}
                    >
                      {order === 1 ? '用户' : '助手'}: {role.name}
                    </Tag>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* 角色选择滑动条 */}
          <RoleSlider
            roles={selectedScript.roles}
            selectedRole={null}
            onRoleSelect={handleRoleSelect}
            cardHeight={80}
            customRoleStyle={(role: Role) => ({
              border: getRoleColor(role.id) ? `3px solid ${getRoleColor(role.id)}` : '1px solid #d9d9d9',
              backgroundColor: getRoleColor(role.id) ? `${getRoleColor(role.id)}10` : undefined
            })}
          />
        </div>
      )}

      {/* 对话区域 */}
      <div style={{ marginTop: 20 }}>
        {selectedScript && getAssistantRole() ? (
          <ChatBox
            userRole={getUserRole()}
            assistantRole={getAssistantRole()!}
            conversationMode={conversationMode}
            height={600}
          />
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