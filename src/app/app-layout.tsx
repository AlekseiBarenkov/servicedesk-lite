import { useState } from 'react'
import type { ReactElement } from 'react'

import { DashboardOutlined, MenuOutlined, ReloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { App as AntApp, Button, Drawer, Grid, Layout, Menu, Popconfirm, Tag, Tooltip, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router'

import { resetDb } from '../data/storage/store'
import { describeError } from '../data/validation/rules'
import DbGate from './db-gate'
import { NAVIGATION_BG } from './theme'

const SIDER_WIDTH = 220
const HEADER_HEIGHT = 56

const NAVIGATION_ITEMS = [
  { key: '/overview', icon: <DashboardOutlined />, label: 'Обзор' },
  { key: '/requests', icon: <UnorderedListOutlined />, label: 'Заявки' },
]

const AppLayout = () => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const screens = Grid.useBreakpoint()
  const { message } = AntApp.useApp()
  const location = useLocation()
  const navigate = useNavigate()

  const isMobile = screens.md === false
  const activeSection = NAVIGATION_ITEMS.find((item) => location.pathname.startsWith(item.key))
  const selectedKeys = activeSection === undefined ? [] : [activeSection.key]

  const navigationMenu = (onNavigate: () => void): ReactElement => (
    <Menu
      theme="dark"
      mode="inline"
      items={NAVIGATION_ITEMS}
      selectedKeys={selectedKeys}
      style={{ borderInlineEnd: 'none' }}
      onClick={({ key }) => {
        navigate(key)
        onNavigate()
      }}
    />
  )

  const closeMenu = (): void => {
    setMenuOpen(false)
  }

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
      <a className="skip-link" href="#main-content">
        К содержимому
      </a>
      {!isMobile && (
        <Layout.Sider width={SIDER_WIDTH}>
          <div style={{ paddingTop: 8 }}>{navigationMenu(closeMenu)}</div>
        </Layout.Sider>
      )}
      <Layout>
        <Layout.Header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: HEADER_HEIGHT,
            paddingInline: isMobile ? 12 : 16,
            lineHeight: 1.4,
            background: '#ffffff',
            borderBottom: '1px solid #e6e9ee',
          }}
        >
          {isMobile && (
            <Button
              type="text"
              aria-label="Открыть меню"
              icon={<MenuOutlined />}
              onClick={() => {
                setMenuOpen(true)
              }}
            />
          )}
          <Typography.Title level={4} ellipsis style={{ margin: 0, flex: 1, minWidth: 0 }}>
            Диспетчерская
          </Typography.Title>
          <Tag color="blue" style={{ marginInlineEnd: 0, flexShrink: 0 }}>
            Демонстрационные данные
          </Tag>
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
        </Layout.Header>
        <Layout.Content id="main-content" tabIndex={-1} style={{ padding: isMobile ? 12 : 16 }}>
          <DbGate>
            <Outlet />
          </DbGate>
        </Layout.Content>
      </Layout>
      <Drawer
        placement="left"
        width={SIDER_WIDTH}
        open={isMenuOpen}
        onClose={closeMenu}
        closable={false}
        title={<span style={{ color: '#ffffff' }}>Диспетчерская</span>}
        styles={{
          header: { background: NAVIGATION_BG, borderBottom: 'none' },
          body: { background: NAVIGATION_BG, padding: 0 },
        }}
      >
        {navigationMenu(closeMenu)}
      </Drawer>
    </Layout>
  )
}

export default AppLayout
