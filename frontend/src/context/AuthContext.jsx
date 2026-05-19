import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    authAPI.me().then(({ data }) => {
      const updated = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...data }
      localStorage.setItem('user', JSON.stringify(updated))
      setUser(updated)
    }).catch(() => {})
  }, [])

  async function login(email, password) {
    setLoading(true)
    try {
      const { data } = await authAPI.login(email, password)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
      return data
    } finally {
      setLoading(false)
    }
  }

  async function changePassword(current_password, new_password) {
    await authAPI.changePassword(current_password, new_password)
    const updated = { ...user, must_change_password: false }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
