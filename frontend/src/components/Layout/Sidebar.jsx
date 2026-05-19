import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ListTodo, BarChart3, Users, RefreshCw, Database, Bug, Shield, Calendar, CheckCircle2, Eye, Settings2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard',            permission: 'dashboard' },
  { to: '/executive',         icon: BarChart3,       label: 'Métricas Executivas',  permission: 'executive' },
  { to: '/visao-geral',       icon: Eye,             label: 'Visão Geral',          permission: 'visao_geral' },
  { to: '/planejamento',      icon: Calendar,        label: 'Planejamento',         permission: 'planejamento' },
  { to: '/homologacao',       icon: CheckCircle2,    label: 'Homologação',          permission: 'homologacao' },
  { to: '/bugs-por-programa', icon: Bug,             label: 'Bugs por Programa',    permission: 'bugs_por_programa' },
  { to: '/tasks',             icon: ListTodo,        label: 'Tarefas',              permission: 'tasks' },
]

const adminLinks = [
  { to: '/admin/users', icon: Users, label: 'Usuários' },
  { to: '/admin/roles', icon: Shield, label: 'Perfis de Acesso' },
  { to: '/admin/config-visao', icon: Settings2, label: 'Config Visão' },
  { to: '/admin/sync', icon: RefreshCw, label: 'Sincronização' },
  { to: '/admin/database', icon: Database, label: 'Estrutura do Banco' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth()
  const W = 168
  const H = 36

  function canSeeLink(permission) {
    if (user?.role === 'admin') return true
    const perms = user?.permissions || []
    if (perms.length === 0) return false
    return perms.includes(permission)
  }

  return (
    <aside className={`fixed top-16 bottom-0 left-0 flex flex-col z-30 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
      style={{ background: 'linear-gradient(180deg, #1c3775 0%, #363063 100%)' }}>
      {/* Toggle button at top */}
      <div className="flex items-center justify-end px-4 py-4">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Principal</p>}
        {links.filter(({ permission }) => canSeeLink(permission)).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span className="text-sm">{label}</span>}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            {!collapsed && <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mt-5 mb-2">Admin</p>}
            {adminLinks.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span className="text-sm">{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

    </aside>
  )
}
