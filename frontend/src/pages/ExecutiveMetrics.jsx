import { useState, useEffect } from 'react'
import { dashboardAPI, configAPI } from '../services/api'
import { formatWeekWithRange } from '../utils/dateHelpers'
import { readCache, writeCache } from '../utils/cache'
import LineChart from '../components/Charts/LineChart'
import BarChart from '../components/Charts/BarChart'
import DoughnutChart from '../components/Charts/DoughnutChart'
import TaskModal from '../components/UI/TaskModal'
import { Zap, Turtle, RotateCcw, Loader2, ChevronDown, ChevronUp, CheckSquare, CalendarCheck, Hash, Code2, FlaskConical, PackageCheck, Rocket, Timer, X, Bug, TriangleAlert, Layers } from 'lucide-react'
import InfoTooltip from '../components/UI/InfoTooltip'
import ForecastSection from '../components/Forecast/ForecastSection'

function TaskListModal({ title, subtitle, icon: Icon, gradient, tasks, onTaskClick, onClose, renderRow }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className={`flex items-center justify-between px-6 py-5 rounded-t-2xl ${gradient || 'bg-liax-primary'}`}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-white" />
              </div>
            )}
            <div>
              <p className="font-heading font-bold text-white text-base leading-tight">{title}</p>
              {subtitle && <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-liax-surface-border">
          {tasks.length === 0 ? (
            <div className="px-6 py-12 text-center text-liax-neutral text-sm">Sem dados para exibir</div>
          ) : tasks.map((task) => renderRow(task, () => onTaskClick(task)))}
        </div>
      </div>
    </div>
  )
}

function StatusRanking({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-liax-xl p-6 h-full flex items-center justify-center text-sm text-liax-neutral">
        Sem dados de status para exibir
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + (item.count || 0), 0)
  const top = data[0]

  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-6 h-full">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-heading font-bold text-liax-text-dark text-base">Resumo dos Status</h3>
          <p className="text-xs text-liax-neutral">Somente migrações ativas consideradas</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-liax-neutral">Total</p>
          <p className="text-lg font-heading font-bold text-liax-text-dark">{total}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-liax-bg-light/70 p-4 mb-5">
        <p className="text-xs text-liax-neutral mb-1">Status mais frequente</p>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-liax-text-dark truncate">{top.status || '—'}</p>
            <p className="text-xs text-liax-neutral">{top.count} migrações • {total ? Math.round((top.count / total) * 100) : 0}%</p>
          </div>
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: top.color || '#0074e8' }}
          />
        </div>
      </div>

      <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
        {data.map((item, index) => {
          const pct = total ? (item.count / total) * 100 : 0
          return (
            <div key={`${item.status}-${index}`}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: item.color || '#94a3b8' }}
                  />
                  <span className="text-sm text-liax-text-dark truncate">{item.status || 'Sem status'}</span>
                </div>
                <span className="text-xs text-liax-neutral shrink-0">{item.count} • {pct.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(pct, 2)}%`, background: item.color || '#0074e8' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PHASE_COLORS = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', bar: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  bar: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', bar: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700' },
}

function PhaseCard({ icon: Icon, label, sublabel, color, stats, highlight, onTaskClick, onTasksClick, tooltip }) {
  const c = PHASE_COLORS[color] || PHASE_COLORS.blue
  const hasData = stats && stats.count > 0
  return (
    <div className={`bg-white rounded-2xl shadow-liax-xl p-5 ${highlight ? 'ring-2 ring-indigo-200' : ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon size={15} className={c.icon} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-heading font-bold text-liax-text-dark text-sm leading-tight">{label}</p>
            {tooltip && <InfoTooltip text={tooltip} size={12} />}
          </div>
          <p className="text-xs text-liax-neutral truncate">{sublabel}</p>
        </div>
      </div>
      {!hasData ? (
        <p className="text-sm text-liax-neutral">Sem dados</p>
      ) : (
        <>
          <div className="flex items-end gap-4 mb-2">
            <div>
              <span className="text-3xl font-heading font-bold text-liax-text-dark">{stats.average}</span>
              <span className="text-xs text-liax-neutral ml-1 block leading-tight">dias (total)</span>
            </div>
            {stats.average_worked != null && (
              <div className="border-l border-gray-100 pl-4">
                <span className="text-2xl font-heading font-bold text-emerald-600">{stats.average_worked}</span>
                <span className="text-xs text-liax-neutral ml-1 block leading-tight">dias (trabalhado)</span>
              </div>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-3">
            {stats.slowest > 0 && (
              <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${(stats.average / stats.slowest) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => stats.fastest_task && onTaskClick?.(stats.fastest_task)}
              className="flex items-center gap-1.5 hover:bg-green-50 rounded-lg px-1.5 py-1 transition-colors group"
              title={stats.fastest_task?.name}
            >
              <Zap size={11} className="text-green-500" />
              <span className="text-xs text-liax-neutral group-hover:text-green-700">
                Mais rápida: <span className="font-semibold text-liax-text-dark group-hover:text-green-700 underline decoration-dotted">{stats.fastest}d</span>
              </span>
            </button>
            <button
              onClick={() => stats.slowest_task && onTaskClick?.(stats.slowest_task)}
              className="flex items-center gap-1.5 hover:bg-red-50 rounded-lg px-1.5 py-1 transition-colors group"
              title={stats.slowest_task?.name}
            >
              <Turtle size={11} className="text-red-400" />
              <span className="text-xs text-liax-neutral group-hover:text-red-600">
                Mais lenta: <span className="font-semibold text-liax-text-dark group-hover:text-red-600 underline decoration-dotted">{stats.slowest}d</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => stats.tasks?.length && onTasksClick?.({ phaseLabel: label, tasks: stats.tasks, color })}
              className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${c.badge} ${stats.tasks?.length ? 'hover:brightness-95 cursor-pointer' : 'cursor-default'}`}
            >
              {stats.count} tarefas
            </button>
            {stats.excluded_count > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-50 text-orange-600">
                -{stats.excluded_count} extremos
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function WeekFilter({ weeks, start, end, onStartChange, onEndChange, onReset }) {
  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-5 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-liax-neutral mb-1.5">Semana Inicial</label>
          <select
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            className="liax-input py-2 text-sm w-44"
          >
            <option value="">Todas</option>
            {weeks.map((w) => <option key={w} value={w}>{formatWeekWithRange(w)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-liax-neutral mb-1.5">Semana Final</label>
          <select
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            className="liax-input py-2 text-sm w-44"
          >
            <option value="">Todas</option>
            {weeks.map((w) => <option key={w} value={w}>{formatWeekWithRange(w)}</option>)}
          </select>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-liax-bg-light text-liax-neutral hover:bg-liax-surface-border text-sm font-medium transition-colors"
        >
          <RotateCcw size={14} />
          Resetar
        </button>
      </div>
    </div>
  )
}


const TYPE_FILTER_OPTIONS = [
  { key: 'all',       label: 'Todos' },
  { key: 'migracoes', label: 'Migrações' },
  { key: 'bugs',      label: 'Bugs' },
  { key: 'melhorias', label: 'Melhorias' },
]

function PhaseWeekChart({ phase, onTasksClick }) {
  const [typeFilter, setTypeFilter] = useState('all')

  const rawData = phase.by_type?.[typeFilter] || []

  const headerActions = (
    <div className="flex items-center gap-1 flex-wrap">
      {TYPE_FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => setTypeFilter(opt.key)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
            typeFilter === opt.key
              ? 'text-white border-transparent'
              : 'bg-white border-gray-200 text-liax-neutral hover:border-gray-300'
          }`}
          style={typeFilter === opt.key ? { background: phase.color, borderColor: phase.color } : {}}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-6">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: phase.color }} />
          <h3 className="font-heading font-bold text-liax-text-dark text-base">{phase.label}</h3>
        </div>
        {headerActions}
      </div>
      <p className="text-liax-neutral text-xs mb-4">Quantidade de tarefas que concluíram esta fase por semana</p>
      {rawData.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-liax-neutral">Sem dados para o filtro selecionado</div>
      ) : (
        <div className="h-56">
          {(() => {
            const { Line } = require('react-chartjs-2')
            const { formatWeekWithRange } = require('../utils/dateHelpers')
            const labels = rawData.map((d) => formatWeekWithRange(d.week))
            const values = rawData.map((d) => d.count)
            const chartData = {
              labels,
              datasets: [{
                label: phase.label,
                data: values,
                borderColor: phase.color,
                backgroundColor: phase.color + '22',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: phase.color,
                pointRadius: 4,
              }],
            }
            const options = {
              responsive: true,
              maintainAspectRatio: false,
              onClick: (_, elements) => {
                if (!elements.length) return
                const idx = elements[0].index
                const weekData = rawData[idx]
                if (weekData?.tasks?.length) {
                  onTasksClick?.({
                    phaseLabel: phase.label,
                    week: formatWeekWithRange(weekData.week),
                    tasks: weekData.tasks,
                  })
                }
              },
              plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false },
              },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f0f0' } },
                x: { grid: { display: false } },
              },
            }
            return <Line data={chartData} options={options} />
          })()}
        </div>
      )}
    </div>
  )
}

function PhaseWeekSection({ phases, onTasksClick }) {
  return (
    <div>
      <h2 className="font-heading font-semibold text-liax-text-dark mb-1">Throughput por Fase por Semana</h2>
      <p className="text-liax-neutral text-sm mb-4">
        Quantidade de tarefas que concluíram cada fase por semana — identifique gargalos no pipeline
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {phases.map((phase) => (
          <PhaseWeekChart key={phase.key} phase={phase} onTasksClick={onTasksClick} />
        ))}
      </div>
    </div>
  )
}

export default function ExecutiveMetrics() {
  const [weeks, setWeeks] = useState([])
  const [weekStart, setWeekStart] = useState('')
  const [weekEnd, setWeekEnd] = useState('')

  const [migrationsPerWeek, setMigrationsPerWeek] = useState([])
  const [migrationTime, setMigrationTime] = useState(null)
  const [migrationsByStatus, setMigrationsByStatus] = useState([])
  const [tasksCompleted, setTasksCompleted] = useState([])
  const [collaborators, setCollaborators] = useState({ all: [], qa: [], dev: [] })
  const [bugsPerWeek, setBugsPerWeek] = useState([])
  const [libHmlPerWeek, setLibHmlPerWeek] = useState([])
  const [aprovacoes, setAprovacoes] = useState({ total: 0, weeks: 0, weekly: [] })
  const [statusLib, setStatusLib] = useState({ liberated_count: 0, not_liberated_count: 0, liberated_tasks: [] })
  const [bugsHml, setBugsHml] = useState({ count: 0, tasks: [] })
  const [productionSection, setProductionSection] = useState({
    approved_count: 0,
    approved_tasks: [],
    canceled_count: 0,
    canceled_tasks: [],
    with_bug_count: 0,
    with_bug_tasks: [],
    bugs_prod_count: 0,
    bugs_prod_tasks: [],
    total_count: 0,
    total_tasks: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [listModal, setListModal] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [phaseTasksModal, setPhaseTasksModal] = useState(null)
  const [showHomologacaoSection, setShowHomologacaoSection] = useState(true)
  const [forecastData, setForecastData] = useState(null)
  const [excludeExtremes, setExcludeExtremes] = useState(false)
  const [phasesPerWeek, setPhasesPerWeek] = useState([])
  const [phaseWeekModal, setPhaseWeekModal] = useState(null)

  function openTaskFromList(task) {
    setSelectedTask(task)
  }

  function openPhaseTasks(payload) {
    if (!payload?.tasks?.length) return
    setPhaseTasksModal(payload)
  }

  useEffect(() => {
    const cached = readCache('exec_weeks')
    if (cached) setWeeks(cached)
    dashboardAPI.availableWeeks().then((r) => {
      setWeeks(r.data)
      writeCache('exec_weeks', r.data)
    })
    const cachedLib = readCache('exec_status_lib')
    if (cachedLib) setStatusLib(cachedLib)
    dashboardAPI.statusLiberacaoHml().then((r) => {
      setStatusLib(r.data)
      writeCache('exec_status_lib', r.data)
    })
    const cachedBugs = readCache('exec_bugs_hml')
    if (cachedBugs) setBugsHml(cachedBugs)
    dashboardAPI.bugsHmlMigrations().then((r) => {
      setBugsHml(r.data)
      writeCache('exec_bugs_hml', r.data)
    })
    const cachedProduction = readCache('exec_production_section')
    if (cachedProduction) setProductionSection(cachedProduction)
    dashboardAPI.productionSection().then((r) => {
      setProductionSection(r.data)
      writeCache('exec_production_section', r.data)
    })
    const cachedConfig = readCache('exec_homologacao_config')
    if (cachedConfig) setShowHomologacaoSection(cachedConfig)
    configAPI.get('homologacao_section_visible').then((r) => {
      setShowHomologacaoSection(r.data.value)
      writeCache('exec_homologacao_config', r.data.value)
    })
    const cachedForecast = readCache('exec_forecast')
    if (cachedForecast) setForecastData(cachedForecast)
    dashboardAPI.forecastData().then((r) => {
      setForecastData(r.data)
      writeCache('exec_forecast', r.data)
    })
  }, [])

  useEffect(() => {
    const params = {
      ...(weekStart ? { week_start: weekStart } : {}),
      ...(weekEnd ? { week_end: weekEnd } : {}),
    }
    const cacheKey = `exec_metrics_${weekStart || 'all'}_${weekEnd || 'all'}_${excludeExtremes ? 'noext' : 'ext'}`
    const cached = readCache(cacheKey)

    if (cached) {
      setMigrationsPerWeek(cached.migrationsPerWeek)
      setMigrationTime(cached.migrationTime)
      setMigrationsByStatus(cached.migrationsByStatus)
      setTasksCompleted(cached.tasksCompleted)
      setCollaborators(cached.collaborators)
      setBugsPerWeek(cached.bugsPerWeek)
      setLibHmlPerWeek(cached.libHmlPerWeek)
      setAprovacoes(cached.aprovacoes)
      setLoading(false)
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    dashboardAPI.phasesPerWeek(params).then((r) => setPhasesPerWeek(r.data))

    Promise.all([
      dashboardAPI.migrationsPerWeek(params),
      dashboardAPI.migrationTime({ ...(excludeExtremes ? { exclude_extremes: true } : {}) }),
      dashboardAPI.migrationsByStatus(),
      dashboardAPI.tasksCompletedPerWeek(params),
      dashboardAPI.tasksByCollaborator(params),
      dashboardAPI.bugsPerWeek(params),
      dashboardAPI.liberacoesHmlPerWeek(params),
      dashboardAPI.aprovacoes_hml(params),
    ]).then(([mpw, mt, mbs, tcp, collab, bpw, lib, aprov]) => {
      const fresh = {
        migrationsPerWeek: mpw.data,
        migrationTime: mt.data,
        migrationsByStatus: mbs.data,
        tasksCompleted: tcp.data,
        collaborators: collab.data,
        bugsPerWeek: bpw.data,
        libHmlPerWeek: lib.data,
        aprovacoes: aprov.data,
      }
      setMigrationsPerWeek(fresh.migrationsPerWeek)
      setMigrationTime(fresh.migrationTime)
      setMigrationsByStatus(fresh.migrationsByStatus)
      setTasksCompleted(fresh.tasksCompleted)
      setCollaborators(fresh.collaborators)
      setBugsPerWeek(fresh.bugsPerWeek)
      setLibHmlPerWeek(fresh.libHmlPerWeek)
      setAprovacoes(fresh.aprovacoes)
      writeCache(cacheKey, fresh)
    }).finally(() => {
      setLoading(false)
      setRefreshing(false)
    })
  }, [weekStart, weekEnd, excludeExtremes])

  function handleReset() {
    setWeekStart('')
    setWeekEnd('')
  }

  return (
    <div>
      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

      {phaseTasksModal && (
        <TaskListModal
          title={`Tarefas — ${phaseTasksModal.phaseLabel}`}
          subtitle={`${phaseTasksModal.tasks.length} tarefas consideradas na média desta fase`}
          icon={phaseTasksModal.color === 'blue' ? Code2 : phaseTasksModal.color === 'violet' ? FlaskConical : phaseTasksModal.color === 'amber' ? PackageCheck : phaseTasksModal.color === 'green' ? Rocket : Timer}
          gradient="bg-gradient-to-r from-slate-700 to-slate-500"
          tasks={phaseTasksModal.tasks}
          onTaskClick={openTaskFromList}
          onClose={() => setPhaseTasksModal(null)}
          renderRow={(task, onClick) => (
            <button
              key={task.id}
              onClick={onClick}
              className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-slate-700">{task.name}</p>
                  <p className="text-xs text-liax-neutral truncate">
                    {task.programa || 'Sem programa'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {task.date_done && (
                  <span className="text-xs text-liax-neutral">{new Date(task.date_done).toLocaleDateString('pt-BR')}</span>
                )}
                {task.desenv_back_inicio && phaseTasksModal.phaseLabel === 'Desenvolvimento' && (
                  <span className="text-xs text-liax-neutral">{new Date(task.desenv_back_inicio).toLocaleDateString('pt-BR')}</span>
                )}
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: (task.status_color || '#94a3b8') + '22', color: task.status_color || '#94a3b8' }}
                >
                  {task.status_name || '—'}
                </span>
              </div>
            </button>
          )}
        />
      )}
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-heading font-bold text-2xl text-liax-text-dark">Métricas Executivas</h1>
        {refreshing && (
          <span className="flex items-center gap-1.5 text-xs text-liax-neutral bg-liax-bg-light px-2.5 py-1 rounded-full">
            <Loader2 size={11} className="animate-spin" />
            Atualizando…
          </span>
        )}
      </div>
      <p className="text-liax-neutral text-sm mb-8">Indicadores estratégicos extraídos das tarefas do ClickUp</p>

      <WeekFilter
        weeks={weeks}
        start={weekStart}
        end={weekEnd}
        onStartChange={setWeekStart}
        onEndChange={setWeekEnd}
        onReset={handleReset}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-liax-primary" size={32} />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Sessão de Homologação */}
          {showHomologacaoSection && (
            <>
              <h2 className="font-heading font-semibold text-liax-text-dark mb-1">Sessão de Homologação</h2>
              <p className="text-liax-neutral text-sm mb-4">Status de liberação, aprovações e bugs de homologação Lello</p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Status de Liberação HML */}
            <button
              onClick={() => setListModal('lib')}
              className="bg-gradient-to-r from-teal-600 to-teal-400 rounded-2xl shadow-liax-xl px-6 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <PackageCheck size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-heading font-bold text-white text-base leading-tight">Liberação HML</p>
                  <p className="text-teal-100 text-xs">Aguardando homologação Lello</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-3xl leading-none">{statusLib.liberated_count}</p>
                <p className="text-teal-100 text-xs mt-0.5">aguardando</p>
              </div>
            </button>

            {/* Aprovações HML */}
            <button
              onClick={() => setListModal('aprov')}
              className="bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl shadow-liax-xl px-6 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <CheckSquare size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-heading font-bold text-white text-base leading-tight">Aprovações HML Lello</p>
                  <p className="text-indigo-100 text-xs">Migrações aprovadas em homologação</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-3xl leading-none">{aprovacoes.total}</p>
                <p className="text-indigo-100 text-xs mt-0.5">aprovadas</p>
              </div>
            </button>

            {/* Bugs de Homologação */}
            <button
              onClick={() => setListModal('bugs')}
              className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-2xl shadow-liax-xl px-6 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Bug size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-heading font-bold text-white text-base leading-tight">Bugs de Homologação</p>
                  <p className="text-orange-100 text-xs">Migrações com bugs em HML</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-3xl leading-none">{bugsHml.count}</p>
                <p className="text-orange-100 text-xs mt-0.5">migrações</p>
              </div>
            </button>

              </div>
            </>
          )}

          {/* Sessão de Produção */}
          <>
            <h2 className="font-heading font-semibold text-liax-text-dark mb-1">Sessão de Produção</h2>
            <p className="text-liax-neutral text-sm mb-4">Aprovados, cancelados, migrações com bug e bugs em produção</p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <button
                onClick={() => setListModal('prod-approved')}
                className="bg-gradient-to-r from-green-600 to-green-400 rounded-2xl shadow-liax-xl px-5 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <PackageCheck size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-white text-base leading-tight">Aprovados em produção</p>
                    <p className="text-green-100 text-xs">prog. prod. aprovado</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-3xl leading-none">{productionSection.approved_count}</p>
                  <p className="text-green-100 text-xs mt-0.5">migrações</p>
                </div>
              </button>

              <button
                onClick={() => setListModal('prod-canceled')}
                className="bg-gradient-to-r from-slate-700 to-slate-500 rounded-2xl shadow-liax-xl px-5 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <X size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-white text-base leading-tight">Migrados em produção cancelados</p>
                    <p className="text-slate-100 text-xs">programas cancelados prod.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-3xl leading-none">{productionSection.canceled_count}</p>
                  <p className="text-slate-100 text-xs mt-0.5">migrações</p>
                </div>
              </button>

              <button
                onClick={() => setListModal('prod-bug')}
                className="bg-gradient-to-r from-amber-600 to-amber-400 rounded-2xl shadow-liax-xl px-5 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <TriangleAlert size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-white text-base leading-tight">Em produção com bug</p>
                    <p className="text-amber-100 text-xs">prog. em prod c/ bug</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-3xl leading-none">{productionSection.with_bug_count}</p>
                  <p className="text-amber-100 text-xs mt-0.5">migrações</p>
                </div>
              </button>

              <button
                onClick={() => setListModal('prod-total')}
                className="bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-2xl shadow-liax-xl px-5 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Hash size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-white text-base leading-tight">Total</p>
                    <p className="text-indigo-100 text-xs">consolidação da sessão</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-3xl leading-none">{productionSection.total_count}</p>
                  <p className="text-indigo-100 text-xs mt-0.5">itens</p>
                </div>
              </button>

              <button
                onClick={() => setListModal('prod-bugs')}
                className="bg-gradient-to-r from-red-600 to-red-400 rounded-2xl shadow-liax-xl px-5 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Bug size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-white text-base leading-tight">Bugs em produção</p>
                    <p className="text-red-100 text-xs">coluna bugs em produção</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-3xl leading-none">{productionSection.bugs_prod_count}</p>
                  <p className="text-red-100 text-xs mt-0.5">bugs</p>
                </div>
              </button>
            </div>
          </>

          {/* Modal de lista — Produção */}
          {listModal === 'prod-approved' && (
            <TaskListModal
              title="Aprovados em produção"
              subtitle={`${productionSection.approved_count} migrações com status de aprovação em produção`}
              icon={PackageCheck}
              gradient="bg-gradient-to-r from-green-600 to-green-400"
              tasks={productionSection.approved_tasks}
              onTaskClick={openTaskFromList}
              onClose={() => setListModal(null)}
              renderRow={(task, onClick) => (
                <button key={task.id} onClick={onClick}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-green-50 transition-colors text-left group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-green-700">{task.name}</p>
                      {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {task.production_metric_date && <span className="text-xs text-liax-neutral">{new Date(task.production_metric_date).toLocaleDateString('pt-BR')}</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">{task.production_metric_label}</span>
                  </div>
                </button>
              )}
            />
          )}

          {listModal === 'prod-canceled' && (
            <TaskListModal
              title="Migrados em produção cancelados"
              subtitle={`${productionSection.canceled_count} migrações canceladas em produção`}
              icon={X}
              gradient="bg-gradient-to-r from-slate-700 to-slate-500"
              tasks={productionSection.canceled_tasks}
              onTaskClick={openTaskFromList}
              onClose={() => setListModal(null)}
              renderRow={(task, onClick) => (
                <button key={task.id} onClick={onClick}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors text-left group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-slate-700">{task.name}</p>
                      {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {task.production_metric_date && <span className="text-xs text-liax-neutral">{new Date(task.production_metric_date).toLocaleDateString('pt-BR')}</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">{task.production_metric_label}</span>
                  </div>
                </button>
              )}
            />
          )}

          {listModal === 'prod-bug' && (
            <TaskListModal
              title="Em produção com bug"
              subtitle={`${productionSection.with_bug_count} migrações em produção com bug`}
              icon={TriangleAlert}
              gradient="bg-gradient-to-r from-amber-600 to-amber-400"
              tasks={productionSection.with_bug_tasks}
              onTaskClick={openTaskFromList}
              onClose={() => setListModal(null)}
              renderRow={(task, onClick) => (
                <button key={task.id} onClick={onClick}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-amber-50 transition-colors text-left group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-amber-700">{task.name}</p>
                      {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {task.production_metric_date && <span className="text-xs text-liax-neutral">{new Date(task.production_metric_date).toLocaleDateString('pt-BR')}</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">{task.production_metric_label}</span>
                  </div>
                </button>
              )}
            />
          )}

          {listModal === 'prod-bugs' && (
            <TaskListModal
              title="Bugs em produção"
              subtitle={`${productionSection.bugs_prod_count} bugs na coluna de produção`}
              icon={Bug}
              gradient="bg-gradient-to-r from-red-600 to-red-400"
              tasks={productionSection.bugs_prod_tasks}
              onTaskClick={openTaskFromList}
              onClose={() => setListModal(null)}
              renderRow={(task, onClick) => (
                <button key={task.id} onClick={onClick}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-red-50 transition-colors text-left group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-red-700">{task.name}</p>
                      {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {task.production_metric_date && <span className="text-xs text-liax-neutral">{new Date(task.production_metric_date).toLocaleDateString('pt-BR')}</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">{task.production_metric_label}</span>
                  </div>
                </button>
              )}
            />
          )}

          {listModal === 'prod-total' && (
            <TaskListModal
              title="Total da Produção"
              subtitle={`${productionSection.total_count} itens consolidados da sessão de produção`}
              icon={Hash}
              gradient="bg-gradient-to-r from-indigo-700 to-indigo-500"
              tasks={productionSection.total_tasks}
              onTaskClick={openTaskFromList}
              onClose={() => setListModal(null)}
              renderRow={(task, onClick) => (
                <button key={task.id} onClick={onClick}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-indigo-50 transition-colors text-left group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-indigo-700">{task.name}</p>
                      <p className="text-xs text-liax-neutral truncate">{task.programa || 'Sem programa'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {task.production_metric_date && <span className="text-xs text-liax-neutral">{new Date(task.production_metric_date).toLocaleDateString('pt-BR')}</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">{task.production_metric_label}</span>
                  </div>
                </button>
              )}
            />
          )}

          {/* Modal de lista — Bugs HML */}
          {listModal === 'bugs' && (
            <TaskListModal
              title="Bugs de Homologação"
              subtitle={`${bugsHml.count} migrações com bugs de homologação atrelados`}
              icon={Bug}
              gradient="bg-gradient-to-r from-orange-600 to-orange-400"
              tasks={bugsHml.tasks}
              onTaskClick={openTaskFromList}
              onClose={() => setListModal(null)}
              renderRow={(task, onClick) => (
                <button key={task.id} onClick={onClick}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-orange-50 transition-colors text-left group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-orange-700">{task.name}</p>
                      {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {task.bugs_totais > 0 && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${task.bugs_em_aberto > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                        {task.bugs_em_aberto}/{task.bugs_totais}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: (task.status_color || '#94a3b8') + '22', color: task.status_color || '#94a3b8' }}>
                      {task.status_name || '—'}
                    </span>
                  </div>
                </button>
              )}
            />
          )}

          {/* Modal de lista — Liberação */}
          {listModal === 'lib' && (
            <TaskListModal
              title="Liberação HML — Aguardando Homologação"
              subtitle={`${statusLib.liberated_count} migrações liberadas sem aprovação HML`}
              icon={PackageCheck}
              gradient="bg-gradient-to-r from-teal-600 to-teal-400"
              tasks={statusLib.liberated_tasks}
              onTaskClick={openTaskFromList}
              onClose={() => setListModal(null)}
              renderRow={(task, onClick) => {
                const urgency = task.days_waiting >= 14 ? 'text-red-600 bg-red-50'
                  : task.days_waiting >= 7 ? 'text-amber-600 bg-amber-50'
                  : 'text-teal-700 bg-teal-50'
                return (
                  <button key={task.id} onClick={onClick}
                    className="w-full flex items-center justify-between px-6 py-3 hover:bg-teal-50 transition-colors text-left group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-teal-700">{task.name}</p>
                        {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-liax-neutral">
                        {new Date(task.liberacao_hml_lello).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${urgency}`}>
                        {task.days_waiting === 0 ? 'hoje' : `${task.days_waiting}d`}
                      </span>
                    </div>
                  </button>
                )
              }}
            />
          )}

          {/* Modal de lista — Aprovações */}
          {listModal === 'aprov' && (
            <TaskListModal
              title="Aprovações HML Lello"
              subtitle={`${aprovacoes.total} migrações aprovadas em homologação`}
              icon={CheckSquare}
              gradient="bg-gradient-to-r from-indigo-600 to-indigo-400"
              tasks={aprovacoes.weekly.flatMap(w => w.tasks)}
              onTaskClick={openTaskFromList}
              onClose={() => setListModal(null)}
              renderRow={(task, onClick) => (
                <button key={task.id} onClick={onClick}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-indigo-50 transition-colors text-left group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-indigo-700">{task.name}</p>
                      {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {task.aprovacao_hml_lello && (
                      <span className="text-xs text-liax-neutral">
                        {new Date(task.aprovacao_hml_lello).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: (task.status_color || '#94a3b8') + '22', color: task.status_color || '#94a3b8' }}>
                      {task.status_name || '—'}
                    </span>
                  </div>
                </button>
              )}
            />
          )}

          {/* Throughput por Fase por Semana */}
          {phasesPerWeek.length > 0 && (
            <PhaseWeekSection
              phases={phasesPerWeek}
              onTasksClick={(payload) => setPhaseWeekModal(payload)}
            />
          )}

          {phaseWeekModal && (
            <TaskListModal
              title={`${phaseWeekModal.phaseLabel} — ${phaseWeekModal.week}`}
              subtitle={`${phaseWeekModal.tasks.length} tarefas nesta semana`}
              icon={Layers}
              gradient="bg-gradient-to-r from-slate-700 to-slate-500"
              tasks={phaseWeekModal.tasks}
              onTaskClick={openTaskFromList}
              onClose={() => setPhaseWeekModal(null)}
              renderRow={(task, onClick) => (
                <button key={task.id} onClick={onClick}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors text-left group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-slate-700">{task.name}</p>
                      {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-4"
                    style={{ background: (task.status_color || '#94a3b8') + '22', color: task.status_color || '#94a3b8' }}>
                    {task.status_name || '—'}
                  </span>
                </button>
              )}
            />
          )}

          {/* Tempo por fase */}
          {migrationTime && (
            <div>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                <h2 className="font-heading font-semibold text-liax-text-dark">Tempo Médio por Fase</h2>
                <button
                  onClick={() => setExcludeExtremes(v => !v)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    excludeExtremes
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-white border-gray-200 text-liax-neutral hover:border-gray-300'
                  }`}
                >
                  <Zap size={12} />
                  {excludeExtremes ? 'Extremos removidos' : 'Remover extremos'}
                </button>
              </div>
              <p className="text-liax-neutral text-sm mb-4">
                {excludeExtremes
                  ? 'Médias calculadas sem a tarefa mais rápida e a mais lenta de cada fase'
                  : 'Métricas calculadas a partir das datas preenchidas em cada etapa do ciclo'}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                <PhaseCard
                  icon={Code2}
                  label="Desenvolvimento"
                  sublabel="desenv_back_inicio → desenv_front_finalizado"
                  color="blue"
                  stats={migrationTime.dev}
                  onTaskClick={setSelectedTask}
                  onTasksClick={openPhaseTasks}
                  tooltip="Total: do início do back ao fim do front. Trabalhado: soma de (back_finalizado - back_inicio) + (front_finalizado - front_inicio), sem contar tempo ocioso entre as sub-etapas."
                />
                <PhaseCard
                  icon={FlaskConical}
                  label="QA"
                  sublabel="qa_inicio → qa_finalizado (+ reteste)"
                  color="violet"
                  stats={migrationTime.qa}
                  onTaskClick={setSelectedTask}
                  onTasksClick={openPhaseTasks}
                  tooltip="Total: de qa_inicio a qa_finalizado. Trabalhado: soma do período de QA + período de reteste (se houver), sem contar tempo ocioso entre eles."
                />
                <PhaseCard
                  icon={PackageCheck}
                  label="Homologação"
                  sublabel="liberacao_hml_lello → aprovacao_hml_lello"
                  color="amber"
                  stats={migrationTime.hml}
                  onTaskClick={setSelectedTask}
                  onTasksClick={openPhaseTasks}
                  tooltip="Mede o tempo de espera pela aprovação da Lello após liberação para HML. Total e trabalhado são iguais (fase única)."
                />
                <PhaseCard
                  icon={Rocket}
                  label="Produção"
                  sublabel="aplicacao_producao → aprovacao_prod_lello"
                  color="green"
                  stats={migrationTime.prod}
                  onTaskClick={setSelectedTask}
                  onTasksClick={openPhaseTasks}
                  tooltip="Mede o tempo entre a aplicação em produção e a aprovação final pela Lello. Total e trabalhado são iguais (fase única)."
                />
                <PhaseCard
                  icon={Timer}
                  label="Tempo Total do Fluxo"
                  sublabel="desenv_back_inicio → aprovacao_prod_lello"
                  color="indigo"
                  stats={migrationTime.total}
                  highlight
                  onTaskClick={setSelectedTask}
                  onTasksClick={openPhaseTasks}
                  tooltip="Total: tempo corrido do primeiro commit ao aceite em produção. Trabalhado: soma apenas dos períodos ativos de cada fase (dev + QA + HML + prod)."
                />
              </div>
            </div>
          )}

          {/* Forecast section */}
          {forecastData && (
            <ForecastSection forecastData={forecastData} migrationTime={migrationTime} />
          )}

          {/* Line charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              data={migrationsPerWeek}
              label="Migrações"
              color="#0074e8"
              title="Migrações por Semana"
              description="Migrações que entraram em homologação sem bugs pendentes"
              tooltip="Conta migrações agrupadas pela semana ISO do campo liberacao_hml_lello, filtradas pelo intervalo de semanas selecionado."
            />
            <LineChart
              data={tasksCompleted}
              label="Tarefas"
              color="#17dd30"
              title="Tarefas Concluídas por Semana"
              description="Todas as tarefas com data de conclusão (date_done)"
              tooltip="Agrupa todas as tarefas (migrações, bugs, melhorias) pela semana do campo date_done, indicando o ritmo de entregas."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              data={bugsPerWeek}
              label="Bugs"
              color="#cc3366"
              title="Bugs por Semana"
              description="Bugs criados por semana (custom_item_id=1004)"
              tooltip="Contabiliza bugs (custom_item_id = 1004) agrupados pela semana ISO do campo date_created."
            />
            <LineChart
              data={libHmlPerWeek}
              label="Liberações"
              color="#6366f1"
              title="Liberações HML Lello por Semana"
              description="Tarefas com data de Liberação HML Lello preenchida, agrupadas por semana"
              tooltip="Migrações com o campo liberacao_hml_lello preenchido, agrupadas por semana ISO. Mede o volume de entregas enviadas para homologação."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DoughnutChart
              data={migrationsByStatus}
              title="Migrações por Status Atual"
              description="Distribuição das migrações pelos status atuais"
              tooltip="Proporção de migrações (custom_item_id = 0) em cada status. Não é afetada pelo filtro de semana — reflete sempre o estado atual."
            />
            <StatusRanking data={migrationsByStatus} />
          </div>

          {/* Collaborators */}
          <BarChart
            data={collaborators.all}
            title="Atuações por Colaborador"
            description="Número de tarefas por responsável (todos)"
            tooltip="Soma o total de tarefas em que cada colaborador atuou como dev-back, dev-front, QA ou reteste no período selecionado."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={collaborators.qa}
              title="Analistas de QA"
              description="Thiago, Ana Keila, Juliana Oliveira, Pedro Samuel, Cristian"
              color="#cc3366"
              tooltip="Tarefas atribuídas a analistas de QA (campos qa e reteste). Considera apenas os colaboradores identificados como QA."
            />
            <BarChart
              data={collaborators.dev}
              title="Analistas de Desenvolvimento"
              description="Demais colaboradores classificados como desenvolvimento"
              color="#0074e8"
              tooltip="Tarefas atribuídas a analistas de desenvolvimento (campos dev_back e dev_front). Exclui os colaboradores de QA."
            />
          </div>

        </div>
      )}
    </div>
  )
}
