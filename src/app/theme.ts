import type { ThemeConfig } from 'antd'

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#2563eb',
    colorBgLayout: '#f4f6f8',
    borderRadius: 6,
    fontFamily: "'Roboto', 'Segoe UI', system-ui, -apple-system, Arial, sans-serif",
  },
  components: {
    Layout: {
      siderBg: '#242a31',
      headerBg: '#ffffff',
      bodyBg: '#f4f6f8',
    },
    Menu: {
      darkItemBg: '#242a31',
      darkItemColor: '#c3cad3',
      darkItemHoverBg: '#2f3742',
      darkItemSelectedBg: '#2f6bd8',
      darkItemSelectedColor: '#ffffff',
    },
    Table: {
      cellPaddingBlock: 10,
      cellPaddingInline: 12,
      headerBg: '#fafbfc',
    },
  },
}
