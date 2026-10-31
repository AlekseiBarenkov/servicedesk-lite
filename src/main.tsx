import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app/app'
import './app/global.css'

const container = document.getElementById('root')

if (container === null) {
  throw new Error('Не найден корневой элемент #root')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
