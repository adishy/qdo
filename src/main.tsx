import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TaskProvider } from './lib/TaskContext'
import { SettingsProvider } from './lib/SettingsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <TaskProvider>
        <App />
      </TaskProvider>
    </SettingsProvider>
  </StrictMode>,
)
