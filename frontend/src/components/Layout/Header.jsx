import { useAuth } from '../../context/AuthContext'
import { LogOut, LayoutDashboard } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-20 flex items-center justify-between px-6 shadow-sm"
      style={{ background: 'linear-gradient(90deg, #1c3775 0%, #363063 100%)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
          <img src="/brand/liax-icon.png" alt="Liax" className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-white font-heading font-bold text-base leading-tight">Liax</p>
          <p className="text-white/60 text-xs">Dashboard ClickUp</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
            {(user?.full_name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-medium">{user?.full_name || user?.email}</p>
            <p className="text-white/60 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors p-2 rounded-lg hover:bg-white/10"
          title="Sair"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
