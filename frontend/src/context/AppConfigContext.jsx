import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { configAPI } from '../services/api'

const AppConfigContext = createContext({ visionTabs: [], reload: () => {} })

export function AppConfigProvider({ children }) {
  const { user } = useAuth()
  const [visionTabs, setVisionTabs] = useState([])

  function loadConfig() {
    configAPI.get('vision_tabs').then(vt => {
      setVisionTabs(vt.data.value || [])
    }).catch(() => {})
  }

  useEffect(() => {
    if (!user) return
    loadConfig()
  }, [user])

  return (
    <AppConfigContext.Provider value={{ visionTabs, reload: loadConfig }}>
      {children}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig() {
  return useContext(AppConfigContext)
}
