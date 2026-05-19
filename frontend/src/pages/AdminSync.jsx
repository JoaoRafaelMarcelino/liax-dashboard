import { useState, useEffect } from 'react'
import { syncAPI } from '../services/api'
import { Button } from '../components/UI/Button'
import { Plus, Play, Pencil, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, X, Check } from 'lucide-react'

function ConfigModal({ config, onClose, onSave }) {
  const [form, setForm] = useState(config || {
    project_name: '',
    clickup_list_url: '',
    clickup_token: '',
    sync_interval_minutes: 30,
  })
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
      <div className="bg-white rounded-3xl shadow-liax-card w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-liax-text-dark text-lg">
            {config ? 'Editar Configuração' : 'Nova Configuração'}
          </h2>
          <button onClick={onClose} className="text-liax-neutral hover:text-liax-text-dark">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-liax-neutral mb-1.5">Nome do Projeto</label>
            <input
              type="text"
              value={form.project_name}
              onChange={(e) => setForm({ ...form, project_name: e.target.value })}
              className="liax-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-liax-neutral mb-1.5">URL da Lista ClickUp</label>
            <input
              type="url"
              value={form.clickup_list_url}
              onChange={(e) => setForm({ ...form, clickup_list_url: e.target.value })}
              className="liax-input text-sm"
              placeholder="https://api.clickup.com/api/v2/list/..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-liax-neutral mb-1.5">Token ClickUp</label>
            <input
              type="text"
              value={form.clickup_token}
              onChange={(e) => setForm({ ...form, clickup_token: e.target.value })}
              className="liax-input font-mono text-sm"
              placeholder="pk_..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-liax-neutral mb-1.5">
              Intervalo de Sincronização (minutos)
            </label>
            <input
              type="number"
              value={form.sync_interval_minutes}
              onChange={(e) => setForm({ ...form, sync_interval_minutes: Number(e.target.value) })}
              className="liax-input"
              min={5}
              max={1440}
              required
            />
          </div>
          {error && <p className="text-liax-error text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
            <Button type="submit" loading={loading} className="flex-1 justify-center">
              <Check size={15} />Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const statusIcon = (s) => {
  if (s === 'success') return <CheckCircle2 size={14} className="text-liax-success-dark" />
  if (s === 'error') return <XCircle size={14} className="text-liax-error" />
  return <Clock size={14} className="text-liax-warning" />
}

export default function AdminSync() {
  const [configs, setConfigs] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(null)
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [{ data: c }, { data: l }] = await Promise.all([syncAPI.listConfigs(), syncAPI.logs(20)])
      setConfigs(c)
      setLogs(l)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(form) {
    if (modal === 'create') await syncAPI.createConfig(form)
    else await syncAPI.updateConfig(modal.id, form)
    load()
  }

  async function handleDelete(id) {
    await syncAPI.deleteConfig(id)
    setConfirm(null)
    load()
  }

  async function handleTrigger(id) {
    setSyncing(id)
    try {
      await syncAPI.triggerSync(id)
      setTimeout(load, 2000)
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-liax-text-dark mb-1">Sincronização</h1>
          <p className="text-liax-neutral text-sm">Configure e monitore a sincronização com o ClickUp</p>
        </div>
        <Button onClick={() => setModal('create')}>
          <Plus size={16} />
          Nova Configuração
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-liax-primary" size={28} />
        </div>
      ) : (
        <>
          {/* Configs */}
          <div className="space-y-4 mb-8">
            {configs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-liax-xl p-12 text-center text-liax-neutral text-sm">
                Nenhuma configuração cadastrada
              </div>
            ) : configs.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl shadow-liax-xl p-6 flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${c.is_active ? 'bg-liax-success' : 'bg-liax-neutral-light'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-liax-text-dark">{c.project_name}</p>
                  <p className="text-xs text-liax-neutral truncate mt-0.5">{c.clickup_list_url}</p>
                  <p className="text-xs text-liax-neutral mt-1">
                    A cada <strong>{c.sync_interval_minutes}min</strong>
                    {c.last_synced_at && ` · Última sync: ${new Date(c.last_synced_at).toLocaleString('pt-BR')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleTrigger(c.id)}
                    disabled={syncing === c.id}
                    title="Sincronizar agora"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-liax-primary text-white text-sm font-medium hover:bg-liax-primary-dark transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={syncing === c.id ? 'animate-spin' : ''} />
                    Sync
                  </button>
                  <button onClick={() => setModal(c)} className="text-liax-neutral hover:text-liax-primary p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setConfirm(c)} className="text-liax-neutral hover:text-liax-error p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Logs */}
          <div className="bg-white rounded-2xl shadow-liax-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-liax-surface-border">
              <p className="font-heading font-bold text-liax-text-dark">Log de Sincronizações</p>
            </div>
            <table className="w-full">
              <thead className="bg-liax-bg-light">
                <tr>
                  {['Status', 'Início', 'Fim', 'Criadas', 'Atualizadas', 'Total', 'Erro'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-liax-neutral uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-liax-surface-border">
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-liax-neutral py-10 text-sm">Sem registros</td></tr>
                ) : logs.map((l) => (
                  <tr key={l.id} className="hover:bg-liax-bg-light">
                    <td className="px-4 py-3">{statusIcon(l.status)}</td>
                    <td className="px-4 py-3 text-xs text-liax-neutral">{new Date(l.started_at).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-xs text-liax-neutral">{l.finished_at ? new Date(l.finished_at).toLocaleString('pt-BR') : '—'}</td>
                    <td className="px-4 py-3 text-sm text-liax-success-dark font-medium">{l.tasks_created}</td>
                    <td className="px-4 py-3 text-sm text-liax-primary font-medium">{l.tasks_updated}</td>
                    <td className="px-4 py-3 text-sm font-medium">{l.tasks_synced}</td>
                    <td className="px-4 py-3 text-xs text-liax-error max-w-xs truncate">{l.error_message || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && <ConfigModal config={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}

      {confirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-liax-card p-8 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-liax-error" size={22} />
            </div>
            <h3 className="font-heading font-bold text-liax-text-dark text-lg mb-2">Remover configuração?</h3>
            <p className="text-liax-neutral text-sm mb-6">{confirm.project_name}</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirm(null)} className="flex-1 justify-center">Cancelar</Button>
              <Button variant="danger" onClick={() => handleDelete(confirm.id)} className="flex-1 justify-center">Remover</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
