import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '剧本角色对话系统',
  description: '上传剧本，生成角色，进行智能对话',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: '#1890ff',
              borderRadius: 6,
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}
