import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  function toggle() {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem('sidebar-collapsed', next.toString())
      return next
    })
  }

  const perms = user?.permissions || []
  const isVisaoGeralOnly = perms.length === 1 && perms[0] === 'visao_geral'

  return (
    <div className="min-h-screen bg-liax-bg flex">
      <Header />
      {!isVisaoGeralOnly && <Sidebar collapsed={collapsed} onToggle={toggle} />}
      <main className={`flex-1 min-h-screen overflow-x-hidden transition-all duration-300 ${isVisaoGeralOnly ? 'ml-0' : collapsed ? 'ml-20' : 'ml-64'} mt-16`}>
        <div className={isVisaoGeralOnly ? 'p-8 h-full' : 'p-8 max-w-screen-2xl mx-auto'}>
          {children}
        </div>
      </main>
    </div>
  )
}
