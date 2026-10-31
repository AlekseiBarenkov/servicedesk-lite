import { App as AntApp, ConfigProvider } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import { BrowserRouter } from 'react-router'

import AppRoutes from './router'
import { themeConfig } from './theme'

const App = () => (
  <ConfigProvider locale={ruRU} theme={themeConfig}>
    <AntApp style={{ minHeight: '100vh' }}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AntApp>
  </ConfigProvider>
)

export default App
