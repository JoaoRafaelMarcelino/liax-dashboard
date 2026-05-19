import { useState, useEffect } from 'react'
import { rolesAPI } from '../services/api'
import { Button } from '../components/UI/Button'
import { ShieldPlus, Pencil, Trash2, Loader2, X, Check, Shield, Users, Lock } from 'lucide-react'

function RoleModal({ role, allPerms, onClose, onSave }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = role?.name === 'admin'

  function togglePerm(key) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }))
  }

  function toggleGroup(keys) {
    const allOn = keys.every(k => form.permissions.includes(k))
    setForm(f => ({
      ...f,
      permissions: allOn
        ? f.permissions.filter(p => !keys.includes(p))
        : [...new Set([...f.permissions, ...keys])],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
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

  const groups = [...new Set(allPerms.map(p => p.group))]

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-liax-card w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-liax-surface-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Shield size={17} className="text-indigo-600" />
            </div>
            <h2 className="font-heading font-bold text-liax-text-dark text-lg">
              {role ? 'Editar Perfil' : 'Novo Perfil'}
            </h2>
          </div>
          <button onClick={onClose} className="text-liax-neutral hover:text-liax-text-dark p-1">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-liax-neutral mb-1.5">Nome do Perfil</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              disabled={isAdmin}
              className="liax-input disabled:opacity-60 disabled:cursor-not-allowed" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-liax-neutral mb-1.5">Descrição</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="liax-input" placeholder="Ex: Acesso somente leitura" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-liax-neutral">Permissões de acesso</label>
              {isAdmin && (
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg flex items-center gap-1">
                  <Lock size={11} /> Acesso total
                </span>
              )}
            </div>

            {isAdmin ? (
              <p className="text-sm text-liax-neutral bg-liax-bg-light rounded-xl px-4 py-3">
                O perfil <strong>admin</strong> tem acesso irrestrito a todas as páginas e funcionalidades do sistema.
              </p>
            ) : (
              <div className="space-y-4">
                {groups.map(group => {
                  const groupPerms = allPerms.filter(p => p.group === group)
                  const groupKeys = groupPerms.map(p => p.key)
                  const allOn = groupKeys.every(k => form.permissions.includes(k))
                  const someOn = groupKeys.some(k => form.permissions.includes(k))
                  return (
                    <div key={group} className="border border-liax-surface-border rounded-xl overflow-hidden">
                      <button type="button" onClick={() => toggleGroup(groupKeys)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-liax-bg-light hover:bg-liax-surface-border transition-colors">
                        <span className="text-xs font-bold uppercase tracking-wider text-liax-neutral">{group}</span>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          allOn ? 'bg-liax-primary border-liax-primary' : someOn ? 'bg-liax-primary/30 border-liax-primary' : 'border-liax-surface-border bg-white'
                        }`}>
                          {(allOn || someOn) && <Check size={10} className="text-white" />}
                        </div>
                      </button>
                      <div className="divide-y divide-liax-surface-border">
                        {groupPerms.map(perm => (
                          <label key={perm.key} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-liax-bg-light">
                            <input type="checkbox" checked={form.permissions.includes(perm.key)}
                              onChange={() => togglePerm(perm.key)} className="accent-liax-primary w-4 h-4" />
                            <span className="text-sm text-liax-text-dark">{perm.label}</span>
                            <code className="ml-auto text-xs text-liax-neutral bg-liax-bg-light px-1.5 py-0.5 rounded">{perm.key}</code>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error && <p className="text-liax-error text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        </div>

        <div className="px-8 py-5 border-t border-liax-surface-border shrink-0 flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1 justify-center">
            <Check size={15} /> Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminRoles() {
  const [roles, setRoles] = useState([])
  const [allPerms, setAllPerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([rolesAPI.list(), rolesAPI.listPermissions()])
      setRoles(rolesRes.data)
      setAllPerms(permsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(form) {
    if (modal === 'create') {
      await rolesAPI.create(form)
    } else {
      await rolesAPI.update(modal.id, form)
    }
    load()
  }

  async function handleDelete() {
    setConfirmLoading(true)
    setConfirmError('')
    try {
      await rolesAPI.delete(confirm.id)
      setConfirm(null)
      load()
    } catch (err) {
      setConfirmError(err.response?.data?.detail || 'Erro ao excluir')
    } finally {
      setConfirmLoading(false)
    }
  }

  const groups = [...new Set(allPerms.map(p => p.group))]

  const permLabel = (key) => allPerms.find(p => p.key === key)?.label || key

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-liax-text-dark mb-1">Perfis de Acesso</h1>
          <p className="text-liax-neutral text-sm">Gerencie os perfis e suas permissões na plataforma</p>
        </div>
        <Button onClick={() => setModal('create')}>
          <ShieldPlus size={16} />
          Novo Perfil
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-liax-primary" size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {roles.map(role => (
            <div key={role.id} className="bg-white rounded-2xl shadow-liax-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    role.name === 'admin' ? 'bg-indigo-100' : 'bg-slate-100'
                  }`}>
                    <Shield size={18} className={role.name === 'admin' ? 'text-indigo-600' : 'text-slate-500'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-liax-text-dark capitalize">{role.name}</h3>
                      {role.name === 'admin' && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={10} /> sistema
                        </span>
                      )}
                    </div>
                    {role.description && <p className="text-xs text-liax-neutral mt-0.5">{role.description}</p>}
                    <p className="text-xs text-liax-neutral mt-1 flex items-center gap-1">
                      <Users size={11} /> {role.user_count} usuário{role.user_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setModal(role)} title="Editar"
                    className="text-liax-neutral hover:text-liax-primary p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    <Pencil size={15} />
                  </button>
                  {role.name !== 'admin' && (
                    <button onClick={() => { setConfirmError(''); setConfirm(role) }} title="Excluir"
                      className="text-liax-neutral hover:text-liax-error p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-liax-surface-border">
                {role.name === 'admin' ? (
                  <p className="text-xs text-indigo-600 bg-indigo-50 rounded-xl px-3 py-2">
                    Acesso total a todas as páginas e funcionalidades do sistema.
                  </p>
                ) : role.permissions.length === 0 ? (
                  <p className="text-xs text-liax-neutral italic">Nenhuma permissão concedida</p>
                ) : (
                  <div className="space-y-3">
                    {groups.map(group => {
                      const groupPerms = allPerms.filter(p => p.group === group && role.permissions.includes(p.key))
                      if (groupPerms.length === 0) return null
                      return (
                        <div key={group}>
                          <p className="text-xs font-semibold text-liax-neutral uppercase tracking-wider mb-1.5">{group}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {groupPerms.map(p => (
                              <span key={p.key} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                                {p.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <RoleModal
          role={modal === 'create' ? null : modal}
          allPerms={allPerms}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-liax-card p-8 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-liax-error" size={22} />
            </div>
            <h3 className="font-heading font-bold text-liax-text-dark text-lg mb-2">Excluir perfil?</h3>
            <p className="text-liax-neutral text-sm mb-1"><strong>{confirm.name}</strong></p>
            <p className="text-liax-neutral text-xs mb-4">Esta ação não poderá ser desfeita.</p>
            {confirmError && <p className="text-liax-error text-sm bg-red-50 rounded-xl px-3 py-2 mb-4">{confirmError}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirm(null)} className="flex-1 justify-center">Cancelar</Button>
              <Button variant="danger" onClick={handleDelete} loading={confirmLoading} className="flex-1 justify-center">Excluir</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
