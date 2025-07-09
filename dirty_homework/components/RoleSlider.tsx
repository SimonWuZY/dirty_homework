import React from 'react'
import { Card, Typography, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { Role } from '../lib/store'

const { Text } = Typography

interface RoleSliderProps {
  roles: Role[]
  selectedRole: Role | null
  onRoleSelect: (role: Role) => void
  cardHeight?: number
}

const RoleSlider: React.FC<RoleSliderProps> = ({
  roles,
  selectedRole,
  onRoleSelect,
  cardHeight = 100
}) => {
  if (!roles || roles.length === 0) {
    return null
  }

  return (
    <div className="role-slider" style={{ marginBottom: 20 }}>
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        overflowX: 'auto', 
        padding: '8px 0',
        scrollbarWidth: 'thin'
      }}>
        {roles.map((role) => (
          <Card
            key={role.id}
            size="small"
            style={{
              minWidth: 160,
              height: cardHeight,
              cursor: 'pointer',
              border: selectedRole?.id === role.id ? '2px solid #52c41a' : '1px solid #f0f0f0',
              backgroundColor: selectedRole?.id === role.id ? '#f6ffed' : 'white'
            }}
            onClick={() => onRoleSelect(role)}
            hoverable
          >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <Text strong style={{ fontSize: 14 }}>
                  {role.name}
                </Text>
              </div>
              <div style={{ marginTop: 8, flex: 1, overflow: 'hidden' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {role.character.length > 30 
                    ? `${role.character.substring(0, 30)}...` 
                    : role.character
                  }
                </Text>
                <Text type="secondary" style={{ marginLeft: 10, fontSize: 12 }}>
                  {role.language_habit.length > 30 
                    ? `${role.language_habit.substring(0, 30)}...` 
                    : role.language_habit
                  }
                </Text>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default RoleSlider 