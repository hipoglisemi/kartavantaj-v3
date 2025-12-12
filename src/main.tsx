import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ConsoleProtection from './utils/consoleProtection'

// Güvenlik uyarısı göster
ConsoleProtection.showSecurityMessage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
