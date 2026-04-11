import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { NotificationProvider } from './components/NotificationContext.jsx'

document.documentElement.setAttribute('data-theme', 'dark');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ToastProvider>
  </StrictMode>,
)
