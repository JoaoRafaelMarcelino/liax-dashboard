import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppConfigProvider } from './context/AppConfigContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ExecutiveMetrics from './pages/ExecutiveMetrics'
import AdminUsers from './pages/AdminUsers'
import AdminSync from './pages/AdminSync'
import AdminDatabase from './pages/AdminDatabase'
import BugsByPrograma from './pages/BugsByPrograma'
import Tasks from './pages/Tasks'
import AdminRoles from './pages/AdminRoles'
import Planejamento from './pages/PlanejamentoMensal'
import Homologacao from './pages/Homologacao'
import VisaoGeral from './pages/VisaoGeral'
import ConfigVisao from './pages/ConfigVisao'

function ProtectedRoute({ children, adminOnly = false, permission = null }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.must_change_password) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (permission && user.role !== 'admin') {
    const perms = user.permissions || []
    if (!perms.includes(permission)) {
      if (perms.length === 1 && perms[0] === 'visao_geral') {
        return <Navigate to="/visao-geral" replace />
      }
      if (perms.includes('dashboard')) {
        return <Navigate to="/dashboard" replace />
      }
      if (perms.length > 0) {
        const routeMap = {
          'tasks': '/tasks',
          'visao_geral': '/visao-geral',
          'planejamento': '/planejamento',
          'homologacao': '/homologacao',
          'executive': '/executive',
          'bugs_por_programa': '/bugs-por-programa',
        }
        for (const p of perms) {
          if (routeMap[p]) return <Navigate to={routeMap[p]} replace />
        }
      }
      return <Navigate to="/login" replace />
    }
  }
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user && !user.must_change_password ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute permission="tasks"><Tasks /></ProtectedRoute>} />
      <Route path="/planejamento" element={<ProtectedRoute permission="planejamento"><Planejamento /></ProtectedRoute>} />
      <Route path="/homologacao" element={<ProtectedRoute permission="homologacao"><Homologacao /></ProtectedRoute>} />
      <Route path="/visao-geral" element={<ProtectedRoute permission="visao_geral"><VisaoGeral /></ProtectedRoute>} />
      <Route path="/admin/config-visao" element={<ProtectedRoute adminOnly><ConfigVisao /></ProtectedRoute>} />
      <Route path="/executive" element={<ProtectedRoute permission="executive"><ExecutiveMetrics /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/sync" element={<ProtectedRoute adminOnly><AdminSync /></ProtectedRoute>} />
      <Route path="/admin/database" element={<ProtectedRoute adminOnly><AdminDatabase /></ProtectedRoute>} />
      <Route path="/bugs-por-programa" element={<ProtectedRoute permission="bugs_por_programa"><BugsByPrograma /></ProtectedRoute>} />
      <Route path="/admin/roles" element={<ProtectedRoute adminOnly><AdminRoles /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppConfigProvider>
          <AppRoutes />
        </AppConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
