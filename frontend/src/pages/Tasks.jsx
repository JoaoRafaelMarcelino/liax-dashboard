import { useState, useEffect } from 'react'
import { dashboardAPI, tasksAPI } from '../services/api'
import { Badge, TypeBadge } from '../components/UI/Badge'
import TaskModal from '../components/UI/TaskModal'
import { Loader2, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown size={13} className="opacity-30" />
  return sortDir === 'asc' ? <ChevronUp size={13} className="text-liax-primary" /> : <ChevronDown size={13} className="text-liax-primary" />
}

function TaskRow({ task, onClick }) {
  return (
    <tr className="hover:bg-liax-bg-light transition-colors cursor-pointer" onClick={() => onClick(task)}>
      <td className="px-3 py-3 text-center">
        {task.prioridade_custom
          ? <span className="text-xs font-bold bg-liax-primary text-white px-2 py-0.5 rounded-full">#{task.prioridade_custom}</span>
          : <span className="text-liax-neutral text-xs">—</span>}
      </td>
      <td className="px-3 py-3 text-sm text-liax-neutral font-mono">{task.lote || '—'}</td>
      <td className="px-4 py-3"><TypeBadge customItemId={task.custom_item_id} /></td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-liax-text-dark line-clamp-1">{task.name}</p>
      </td>
      <td className="px-4 py-3"><Badge color={task.status_color}>{task.status_name}</Badge></td>
      <td className="px-4 py-3 text-sm text-liax-neutral font-mono">{task.programa || '—'}</td>
      <td className="px-4 py-3 text-sm text-liax-neutral">
        {task.assignees?.map(a => a.username).join(', ') || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-liax-neutral">
        {task.date_done
          ? new Date(task.date_done).toLocaleDateString('pt-BR')
          : task.date_created
            ? new Date(task.date_created).toLocaleDateString('pt-BR')
            : '—'}
      </td>
      <td className="px-4 py-3 text-sm">
        {task.liberacao_hml_lello
          ? <span className="font-semibold text-indigo-600">{new Date(task.liberacao_hml_lello).toLocaleDateString('pt-BR')}</span>
          : <span className="text-liax-neutral">—</span>}
      </td>
    </tr>
  )
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('')
  const [activeType, setActiveType] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [bugsByProg, setBugsByProg] = useState({})
  const [sortCol, setSortCol] = useState('status')
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const SORT_MAP = {
    ordem: t => Number(t.prioridade_custom) || 9999,
    lote: t => t.lote?.toLowerCase() ?? '',
    tipo: t => t.custom_item_id ?? 99,
    nome: t => t.name?.toLowerCase() ?? '',
    status: t => t.status_orderindex ?? 99,
    programa: t => t.programa?.toLowerCase() ?? '',
    responsaveis: t => t.assignees?.[0]?.username?.toLowerCase() ?? '',
    data: t => t.date_done || t.date_created || '',
    lib_hml: t => t.liberacao_hml_lello || '',
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const fn = SORT_MAP[sortCol] || (() => 0)
    const va = fn(a), vb = fn(b)
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  useEffect(() => {
    tasksAPI.statuses().then(r => setStatuses(r.data))
    dashboardAPI.bugsByPrograma().then(r => {
      const map = {}
      r.data.forEach(d => { map[d.programa] = d })
      setBugsByProg(map)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    tasksAPI.list({
      ...(activeType !== '' ? { custom_item_id: activeType } : {}),
      ...(activeStatus ? { status_name: activeStatus } : {}),
      ...(search ? { search } : {}),
    }).then(r => setTasks(r.data)).finally(() => setLoading(false))
  }, [activeStatus, activeType, search])

  const types = [
    { id: '', label: 'Todos' },
    { id: 0, label: 'Migrações' },
    { id: 1004, label: 'Bugs' },
    { id: 1005, label: 'Melhorias' },
  ]

  return (
    <div>
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          bugsByProg={bugsByProg}
          onClose={() => setSelectedTask(null)}
        />
      )}
      <h1 className="font-heading font-bold text-2xl text-liax-text-dark mb-1">Tarefas</h1>
      <p className="text-liax-neutral text-sm mb-6">Lista completa de tarefas do ClickUp</p>

      <div className="bg-white rounded-2xl shadow-liax-xl p-5 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-liax-neutral" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tarefa..." className="liax-input pl-9 py-2 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {types.map(t => (
              <button key={t.id} onClick={() => setActiveType(t.id)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  activeType === t.id ? 'bg-liax-primary text-white' : 'bg-liax-bg-light text-liax-neutral hover:bg-liax-surface-border'
                }`}>{t.label}</button>
            ))}
          </div>
          <select value={activeStatus} onChange={e => setActiveStatus(e.target.value)}
            className="liax-input py-2 text-sm w-auto min-w-40">
            <option value="">Todos os status</option>
            {statuses.map(s => <option key={s.status} value={s.status}>{s.status}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-liax-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-liax-surface-border">
          <p className="font-heading font-bold text-liax-text-dark">
            Tarefas <span className="text-liax-neutral font-normal text-sm">({tasks.length})</span>
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-liax-primary" size={28} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-liax-bg-light">
                <tr>
                  {[
                    { label: 'Ordem', col: 'ordem' },
                    { label: 'Lote', col: 'lote' },
                    { label: 'Tipo', col: 'tipo' },
                    { label: 'Nome', col: 'nome' },
                    { label: 'Status', col: 'status' },
                    { label: 'Programa', col: 'programa' },
                    { label: 'Responsáveis', col: 'responsaveis' },
                    { label: 'Data', col: 'data' },
                    { label: 'Lib. HML Lello', col: 'lib_hml' },
                  ].map(({ label, col }) => (
                    <th key={col}
                      className="px-4 py-3 text-left text-xs font-semibold text-liax-neutral uppercase tracking-wide cursor-pointer select-none hover:text-liax-primary transition-colors"
                      onClick={() => handleSort(col)}>
                      <span className="flex items-center gap-1">
                        {label} <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-liax-surface-border">
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-liax-neutral py-12 text-sm">
                      Nenhuma tarefa encontrada
                    </td>
                  </tr>
                ) : (
                  sortedTasks.map(t => (
                    <TaskRow key={t.id} task={t} onClick={task => setSelectedTask({ ...task, _bugsByProg: bugsByProg[task.programa] })} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
