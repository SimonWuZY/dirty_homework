'use client'

import React, { useState, useEffect } from 'react'
import { Layout, Menu, theme, Tabs, message } from 'antd'
import { 
  BookOutlined, 
  MessageOutlined
} from '@ant-design/icons'
import ScriptManager from '../components/ScriptManager'
import ConversationManager from '../components/ConversationManager'

const { Header, Sider, Content } = Layout

export default function HomePage() {
  const [selectedKey, setSelectedKey] = useState('scripts')
  const [selectedScript, setSelectedScript] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const menuItems = [
    {
      key: 'scripts',
      icon: <BookOutlined />,
      label: '剧本管理',
    },
    {
      key: 'conversations',
      icon: <MessageOutlined />,
      label: '对话系统',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedKey(key)
  }

  const renderContent = () => {
    switch (selectedKey) {
      case 'scripts':
        return (
          <ScriptManager 
            onScriptSelect={setSelectedScript}
            selectedScript={selectedScript}
          />
        )
      case 'conversations':
        return (
          <ConversationManager 
            scriptId={selectedScript}
            characterId={selectedCharacter}
          />
        )
      default:
        return <div>请选择功能</div>
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center',
        background: colorBgContainer,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          color: '#1890ff'
        }}>
          剧本角色对话系统
        </div>
      </Header>
      
      <Layout>
        <Sider 
          width={200} 
          style={{ 
            background: colorBgContainer,
            borderRight: '1px solid #f0f0f0'
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
