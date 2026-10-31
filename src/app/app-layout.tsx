import { useState } from 'react'

import {
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { App as AntApp, Button, Layout, Menu, Popconfirm, Tag, Tooltip, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router'

import { resetDb } from '../data/storage/store'
import { describeError } from '../data/validation/rules'
import DbGate from './db-gate'

const SIDER_WIDTH = 220

const NAVIGATION_ITEMS = [
  { key: '/overview', icon: <DashboardOutlined />, label: 'Обзор' },
  { key: '/requests', icon: <UnorderedListOutlined />, label: 'Заявки' },
]

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { message } = AntApp.useApp()
  const location = useLocation()
  const navigate = useNavigate()

  const activeSection = NAVIGATION_ITEMS.find((item) => location.pathname.startsWith(item.key))
  const selectedKeys = activeSection === undefined ? [] : [activeSection.key]

  const handleReset = async (): Promise<void> => {
    try {
      await resetDb()
      message.success('Данные демо сброшены')
    } catch (error) {
      message.error(describeError(error))
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        width={SIDER_WIDTH}
        collapsible
        collapsed={collapsed}
        collapsedWidth={0}
        breakpoint="md"
        trigger={null}
        onBreakpoint={(broken) => {
          setCollapsed(broken)
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          items={NAVIGATION_ITEMS}
          selectedKeys={selectedKeys}
          style={{ paddingTop: 8, borderInlineEnd: 'none' }}
          onClick={({ key }) => {
            navigate(key)
          }}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            height: 'auto',
            paddingBlock: 12,
            paddingInline: 16,
            background: '#ffffff',
            borderBottom: '1px solid #e6e9ee',
            lineHeight: 1.4,
          }}
        >
          <Button
            type="text"
            aria-label={collapsed ? 'Показать меню' : 'Скрыть меню'}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
          />
          <Typography.Title level={4} style={{ margin: 0 }}>
            ServiceDesk Lite
          </Typography.Title>
          <Tag color="blue" style={{ marginInlineEnd: 0 }}>
            Демонстрационные данные
          </Tag>
          <div style={{ marginLeft: 'auto' }}>
            <Popconfirm
              title="Сбросить данные демо?"
              description="Заявки и клиенты будут заменены начальными данными."
              okText="Сбросить"
              cancelText="Отмена"
              okButtonProps={{ danger: true }}
              onConfirm={() => {
                void handleReset()
              }}
            >
              <Tooltip title="Сбросить демо">
                <Button aria-label="Сбросить демо" icon={<ReloadOutlined />} />
              </Tooltip>
            </Popconfirm>
          </div>
        </Layout.Header>
        <Layout.Content style={{ padding: 16 }}>
          <DbGate>
            <Outlet />
          </DbGate>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
