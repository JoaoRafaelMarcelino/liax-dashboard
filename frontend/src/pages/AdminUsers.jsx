import { useState, useEffect } from 'react'
import { usersAPI, rolesAPI } from '../services/api'
import { Button } from '../components/UI/Button'
import { AlertModal, ConfirmModal } from '../components/UI/FeedbackModal'
import { UserPlus, Pencil, Trash2, KeyRound, Loader2, X, Check } from 'lucide-react'

function UserModal({ user, roles, onClose, onSave }) {
  const [form, setForm] = useState(user || { email: '', full_name: '', role_id: 2 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-liax-card w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-liax-text-dark text-lg">
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} className="text-liax-neutral hover:text-liax-text-dark">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <div>
              <label className="block text-sm font-semibold text-liax-neutral mb-1.5">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="liax-input"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-liax-neutral mb-1.5">Nome Completo</label>
            <input
              type="text"
              value={form.full_name || ''}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="liax-input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-liax-neutral mb-1.5">Perfil</label>
            <select
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}
              className="liax-input"
            >
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {!user && (
            <p className="text-xs text-liax-neutral bg-liax-bg-light rounded-xl px-3 py-2">
              Senha padrão: <strong>1i4x@Mudar</strong> — O usuário deverá alterá-la no primeiro acesso.
            </p>
          )}
          {error && <p className="text-liax-error text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1 justify-center">
              <Check size={15} />
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | user object
  const [confirm, setConfirm] = useState(null)
  const [alert, setAlert] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([usersAPI.list(), rolesAPI.list()])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(form) {
    if (modal === 'create') {
      await usersAPI.create(form)
    } else {
      await usersAPI.update(modal.id, form)
    }
    load()
  }

  async function handleDelete(id) {
    await usersAPI.delete(id)
    setConfirm(null)
    load()
  }

  async function handleResetPassword(id) {
    await usersAPI.resetPassword(id)
    setAlert({
      title: 'Senha redefinida',
      message: 'Senha redefinida para:\n1i4x@Mudar',
    })
  }

  const roleLabel = (r) => r.charAt(0).toUpperCase() + r.slice(1)
  const roleColor = (r) => r === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-liax-text-dark mb-1">Usuários</h1>
          <p className="text-liax-neutral text-sm">Gerencie os usuários da plataforma</p>
        </div>
        <Button onClick={() => setModal('create')}>
          <UserPlus size={16} />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-liax-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-liax-primary" size={28} />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-liax-bg-light">
              <tr>
                {['Nome', 'E-mail', 'Perfil', 'Status', 'Criado em', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-liax-neutral uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-liax-surface-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-liax-bg-light transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-liax-text-dark">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-liax-neutral">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`liax-badge ${roleColor(u.role)}`}>{roleLabel(u.role)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`liax-badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    {u.must_change_password && (
                      <span className="liax-badge bg-yellow-100 text-yellow-700 ml-1">Troca obrigatória</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-liax-neutral">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setModal(u)} title="Editar" className="text-liax-neutral hover:text-liax-primary p-1 rounded-lg hover:bg-blue-50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleResetPassword(u.id)} title="Redefinir senha" className="text-liax-neutral hover:text-liax-warning p-1 rounded-lg hover:bg-yellow-50 transition-colors">
                        <KeyRound size={15} />
                      </button>
                      <button onClick={() => setConfirm(u)} title="Excluir" className="text-liax-neutral hover:text-liax-error p-1 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          roles={roles}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirm && (
        <ConfirmModal
          title="Excluir usuário?"
          message={confirm.email}
          onClose={() => setConfirm(null)}
          onConfirm={() => handleDelete(confirm.id)}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          danger
        />
      )}

      {alert && (
        <AlertModal
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
          actionLabel="Entendi"
        />
      )}
    </div>
  )
}
