import React from 'react'
import { Card, Typography } from 'antd'
import { Script } from '../lib/store'

const { Text } = Typography

interface ScriptSliderProps {
  scripts: Script[]
  currentScript: Script | null
  onScriptSelect: (script: Script) => void
  cardHeight?: number
}

const ScriptSlider: React.FC<ScriptSliderProps> = ({
  scripts,
  currentScript,
  onScriptSelect,
  cardHeight = 140
}) => {
  if (scripts.length === 0) {
    return null
  }

  return (
    <div className="script-slider" style={{ marginBottom: 20 }}>
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
              height: cardHeight,
              cursor: 'pointer',
              border: currentScript?.id === script.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
              backgroundColor: currentScript?.id === script.id ? '#f0f8ff' : 'white'
            }}
            onClick={() => onScriptSelect(script)}
            hoverable
          >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Text strong style={{ fontSize: 14 }}>
                {script.title}
              </Text>
              <div style={{ marginTop: 8, height: 40, overflow: 'hidden' }}>
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
  )
}

export default ScriptSlider 