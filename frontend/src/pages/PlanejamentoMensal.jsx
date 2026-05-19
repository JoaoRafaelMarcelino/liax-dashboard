import { useEffect, useMemo, useState } from 'react'
import { dashboardAPI } from '../services/api'
import LineChart from '../components/Charts/LineChart'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import TaskModal from '../components/UI/TaskModal'
import InfoTooltip from '../components/UI/InfoTooltip'
import { Loader2, CalendarDays, TrendingUp, TrendingDown, Minus, BarChart3, Target, List, X, Layers, CheckCircle2 } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const MONTHLY_PLAN = [
  { month: 1, label: 'Janeiro', total: 0 },
  { month: 2, label: 'Fevereiro', total: 10 },
  { month: 3, label: 'Março', total: 21 },
  { month: 4, label: 'Abril', total: 21 },
  { month: 5, label: 'Maio', total: 30 },
  { month: 6, label: 'Junho', total: 40 },
  { month: 7, label: 'Julho', total: 40 },
  { month: 8, label: 'Agosto', total: 35 },
  { month: 9, label: 'Setembro', total: 40 },
  { month: 10, label: 'Outubro', total: 45 },
  { month: 11, label: 'Novembro', total: 36 },
  { month: 12, label: 'Dezembro', total: 40 },
]

const REALIZED_VIEWS = [
  { key: 'liberacao_hml', label: 'Liberação HML' },
  { key: 'aprovacao_hml', label: 'Aprovação HML' },
  { key: 'aprovacao_prod', label: 'Aprovação Produção' },
]

const GRAPH_LAYOUTS = [
  { key: 'single', label: 'Visão realizada' },
  { key: 'all', label: 'Todas as linhas' },
]

const GRAPH_MODES = [
  { key: 'burn_up', label: 'Burn-up' },
  { key: 'burn_down', label: 'Burn-down' },
]

const CURRENT_YEAR = new Date().getFullYear()

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value ?? 0)
}

function MonthlyComparisonChart({ labels, planned, actual, title, description, tooltip, onMonthClick }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Planejado',
        data: planned,
        backgroundColor: '#6366f1cc',
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Realizado',
        data: actual,
        backgroundColor: '#10b981cc',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } },
      x: { grid: { display: false } },
    },
    onClick: (event, elements) => {
      if (!elements?.length || !onMonthClick) return
      const index = elements[0].index
      onMonthClick(index)
    },
  }

  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-0.5">
        <h3 className="font-heading font-bold text-liax-text-dark text-base">{title}</h3>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      {description && <p className="text-liax-neutral text-xs mb-4">{description}</p>}
      <div className="h-[340px]">
        <Bar data={chartData} options={options} />
      </div>
      <p className="mt-3 text-xs text-liax-neutral">Clique em qualquer mês para abrir os detalhes e os programas do período.</p>
    </div>
  )
}

function formatSigned(value) {
  const n = Number(value ?? 0)
  return `${n >= 0 ? '+' : ''}${formatNumber(n)}`
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(1)}%`
}

function cumulativeSeries(values) {
  let total = 0
  return values.map((value) => {
    if (value === null || value === undefined) return null
    total += value
    return total
  })
}

function remainingSeries(values, total) {
  let accumulated = 0
  return values.map((value) => {
    if (value === null || value === undefined) return null
    accumulated += value
    return Math.max(0, total - accumulated)
  })
}

function getProgramChips(programs = []) {
  const sorted = [...programs].sort((a, b) => b.count - a.count)
  const visible = sorted.slice(0, 3)
  const remaining = Math.max(0, sorted.length - visible.length)

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((item) => (
        <span
          key={item.programa}
          className="inline-flex items-center gap-1 rounded-full bg-liax-bg-light border border-liax-surface-border px-2.5 py-1 text-[11px] text-liax-text-dark"
        >
          <Layers size={10} className="text-liax-neutral" />
          <span className="truncate max-w-[150px]">{item.programa}</span>
          <strong>{formatNumber(item.count)}</strong>
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 font-medium">
          +{remaining}
        </span>
      )}
    </div>
  )
}

function SummaryCard({ icon: Icon, title, value, subtitle, accent = 'text-liax-primary', bg = 'bg-white' }) {
  return (
    <div className={`${bg} rounded-2xl shadow-liax-xl p-5 border border-liax-surface-border`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-liax-neutral mb-1">{title}</p>
          <div className={`text-3xl font-heading font-bold ${accent}`}>{value}</div>
          {subtitle && <p className="text-xs text-liax-neutral mt-1">{subtitle}</p>}
        </div>
        <div className="w-11 h-11 rounded-2xl bg-liax-bg-light flex items-center justify-center shrink-0">
          <Icon size={18} className={accent} />
        </div>
      </div>
    </div>
  )
}

function TaskListModal({ title, subtitle, programs = [], tasks = [], onTaskClick, onProgramClick, onClose, zIndexClass = 'z-40' }) {
  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm`}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-liax-surface-border">
          <div>
            <h3 className="font-heading font-bold text-liax-text-dark text-lg">{title}</h3>
            {subtitle && <p className="text-liax-neutral text-sm mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-liax-bg-light text-liax-neutral transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 flex-1 min-h-0">
          <div className="border-b lg:border-b-0 lg:border-r border-liax-surface-border p-5 bg-liax-bg-light/40 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} className="text-liax-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-liax-neutral">Programas do mês</p>
            </div>
            {programs.length > 0 ? (
              <div className="space-y-2">
                {programs.map((item) => (
                  <button
                    key={item.programa}
                    onClick={() => onProgramClick?.(item)}
                    className={`w-full flex items-center justify-between gap-2 bg-white rounded-xl border border-liax-surface-border px-3 py-2 text-left transition-colors ${onProgramClick ? 'hover:border-liax-primary hover:bg-liax-bg-light/60' : ''}`}
                  >
                    <span className="text-sm text-liax-text-dark truncate">{item.programa}</span>
                    <span className="text-sm font-semibold text-liax-primary">{formatNumber(item.count)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-liax-neutral">Sem registros concluídos nesse mês.</p>
            )}
          </div>

          <div className="min-h-0 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-liax-surface-border bg-white/80 backdrop-blur-sm">
              <p className="text-xs text-liax-neutral">Tarefas concluídas no ClickUp</p>
              <p className="text-sm font-semibold text-liax-text-dark">{tasks.length} registros</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-liax-neutral text-sm">Nenhuma tarefa concluída nesse mês.</div>
              ) : (
                tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-liax-bg-light transition-colors text-left border-b border-liax-bg-light last:border-b-0 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-liax-primary">{task.name}</p>
                        <p className="text-xs text-liax-neutral truncate">{task.programa || 'Sem programa'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-liax-neutral">{task.date_done ? new Date(task.date_done).toLocaleDateString('pt-BR') : '—'}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (task.status_color || '#94a3b8') + '22', color: task.status_color || '#94a3b8' }}>
                        {task.status_name || '—'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlanejamentoMensal({ showReferencePlan = true } = {}) {
  const [comparison, setComparison] = useState({ year: CURRENT_YEAR, current_month: 12, metrics: {}, totals: {}, months: [], programs: {} })
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedMonthNumber, setSelectedMonthNumber] = useState(null)
  const [selectedProgramDetail, setSelectedProgramDetail] = useState(null)
  const [selectedView, setSelectedView] = useState('liberacao_hml')
  const [graphLayout, setGraphLayout] = useState('single')
  const [graphMode, setGraphMode] = useState('burn_up')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      try {
        const response = await dashboardAPI.planningComparison({ year: CURRENT_YEAR })
        if (!active) return
        setComparison(response.data)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    setGraphLayout('single')
  }, [selectedView])

  const plannedAnnual = useMemo(() => MONTHLY_PLAN.reduce((sum, item) => sum + item.total, 0), [])
  const selectedViewMeta = comparison.metrics?.[selectedView] || REALIZED_VIEWS.find(view => view.key === selectedView) || REALIZED_VIEWS[0]
  const effectiveYear = comparison.year || CURRENT_YEAR
  const effectiveCurrentMonth = effectiveYear === CURRENT_YEAR ? (comparison.current_month || new Date().getMonth() + 1) : 12

  const monthsByNumber = useMemo(() => {
    const map = new Map()
    comparison.months.forEach((month) => map.set(month.month, month))
    return map
  }, [comparison.months])

  const monthlyRows = useMemo(() => MONTHLY_PLAN.map((plan) => {
    const monthBucket = monthsByNumber.get(plan.month) || { actuals: {}, programs: {}, tasks: {} }
    const isFutureMonth = effectiveYear === CURRENT_YEAR && plan.month > effectiveCurrentMonth
    const actualCount = monthBucket.actuals?.[selectedView] ?? 0
    const actual = isFutureMonth ? null : actualCount
    const diff = actual === null ? null : actual - plan.total
    const achievement = actual === null || plan.total <= 0 ? null : (actual / plan.total) * 100
    return {
      ...plan,
      actual,
      diff,
      achievement,
      programs: monthBucket.programs?.[selectedView] || [],
      tasks: monthBucket.tasks?.[selectedView] || [],
      isFutureMonth,
    }
  }), [monthsByNumber, effectiveCurrentMonth, effectiveYear, selectedView])

  const actualAnnual = useMemo(
    () => monthlyRows.reduce((sum, row) => sum + (row.actual ?? 0), 0),
    [monthlyRows],
  )
  const totalVariance = actualAnnual - plannedAnnual
  const achievementAnnual = plannedAnnual > 0 ? (actualAnnual / plannedAnnual) * 100 : 0

  const chartLabels = monthlyRows.map(item => item.label)
  const plannedSeries = graphMode === 'burn_up'
    ? cumulativeSeries(monthlyRows.map(item => item.total))
    : remainingSeries(monthlyRows.map(item => item.total), plannedAnnual)
  const graphSelectedViewMeta = comparison.metrics?.[selectedView] || REALIZED_VIEWS.find(view => view.key === selectedView) || REALIZED_VIEWS[0]
  const actualSeriesByView = useMemo(() => {
    const series = {}
    REALIZED_VIEWS.forEach((view) => {
      const values = MONTHLY_PLAN.map((plan) => {
        const monthBucket = monthsByNumber.get(plan.month) || { actuals: {} }
        const isFutureMonth = effectiveYear === CURRENT_YEAR && plan.month > effectiveCurrentMonth
        return isFutureMonth ? null : (monthBucket.actuals?.[view.key] ?? 0)
      })

      series[view.key] = graphMode === 'burn_up'
        ? cumulativeSeries(values)
        : remainingSeries(values, plannedAnnual)
    })
    return series
  }, [monthsByNumber, effectiveCurrentMonth, effectiveYear, graphMode, plannedAnnual])

  const graphTitle = graphMode === 'burn_up'
    ? graphLayout === 'all'
      ? 'Burn-up: planejado x 3 visões de realizado'
      : 'Burn-up: planejado x realizado'
    : graphLayout === 'all'
      ? 'Burn-down: restante do planejado x 3 visões de realizado'
      : 'Burn-down: restante do planejado'
  const graphDescription = graphLayout === 'all'
    ? 'A visão completa exibe as 3 datas de realizado no mesmo gráfico, mantendo o planejamento fixo como referência.'
    : graphMode === 'burn_up'
      ? `A visão ${graphSelectedViewMeta.label} mostra o acumulado planejado versus o acumulado realizado.`
      : `A visão ${graphSelectedViewMeta.label} mostra o volume restante para o plano versus o restante realizado.`
  const chartDatasets = graphLayout === 'all'
    ? [
        {
          label: graphMode === 'burn_up' ? 'Planejado acumulado' : 'Planejado restante',
          data: plannedSeries,
          borderColor: '#6366f1',
          backgroundColor: '#6366f122',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: '#6366f1',
          pointRadius: 0,
          spanGaps: false,
        },
        {
          label: graphMode === 'burn_up' ? 'Liberação HML acumulada' : 'Liberação HML restante',
          data: actualSeriesByView.liberacao_hml,
          borderColor: '#10b981',
          backgroundColor: '#10b98122',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: '#10b981',
          pointRadius: 0,
          spanGaps: false,
        },
        {
          label: graphMode === 'burn_up' ? 'Aprovação HML acumulada' : 'Aprovação HML restante',
          data: actualSeriesByView.aprovacao_hml,
          borderColor: '#f59e0b',
          backgroundColor: '#f59e0b22',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: '#f59e0b',
          pointRadius: 0,
          spanGaps: false,
        },
        {
          label: graphMode === 'burn_up' ? 'Aprovação Produção acumulada' : 'Aprovação Produção restante',
          data: actualSeriesByView.aprovacao_prod,
          borderColor: '#ef4444',
          backgroundColor: '#ef444422',
          tension: 0.3,
          fill: false,
          pointBackgroundColor: '#ef4444',
          pointRadius: 0,
          spanGaps: false,
        },
      ]
    : [
      {
        label: graphMode === 'burn_up' ? 'Planejado acumulado' : 'Planejado restante',
        data: plannedSeries,
        borderColor: '#6366f1',
        backgroundColor: '#6366f122',
        tension: 0.3,
        fill: false,
        pointBackgroundColor: '#6366f1',
        pointRadius: 0,
        spanGaps: false,
      },
      {
        label: graphMode === 'burn_up' ? `Realizado acumulado — ${graphSelectedViewMeta.label}` : `Realizado restante — ${graphSelectedViewMeta.label}`,
        data: actualSeriesByView[selectedView],
        borderColor: '#10b981',
        backgroundColor: '#10b98122',
        tension: 0.3,
        fill: false,
        pointBackgroundColor: '#10b981',
        pointRadius: 0,
        spanGaps: false,
      },
    ]

  const selectedMonth = useMemo(
    () => monthlyRows.find(row => row.month === selectedMonthNumber) || null,
    [monthlyRows, selectedMonthNumber],
  )

  const selectedProgramTasks = useMemo(() => {
    if (!selectedMonth || !selectedProgramDetail) return []
    return selectedMonth.tasks.filter((task) => task.programa === selectedProgramDetail.programa)
  }, [selectedMonth, selectedProgramDetail])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-liax-primary" size={32} />
      </div>
    )
  }

  return (
    <div>
      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}

      {selectedProgramDetail && (
        <TaskListModal
          title={`${selectedProgramDetail.programa} — ${selectedMonth?.label || 'Detalhes do mês'}`}
          subtitle={`Total de tarefas: ${formatNumber(selectedProgramDetail.count)} | Visão: ${selectedViewMeta.label}`}
          programs={[{ programa: selectedProgramDetail.programa, count: selectedProgramDetail.count }]}
          tasks={selectedProgramTasks}
          onTaskClick={setSelectedTask}
          onClose={() => setSelectedProgramDetail(null)}
          zIndexClass="z-50"
        />
      )}

      {selectedMonth && (
        <TaskListModal
          title={`${selectedMonth.label} — Detalhes do ClickUp`}
          subtitle={`Planejado: ${formatNumber(selectedMonth.total)} | Realizado: ${selectedMonth.actual === null ? '—' : formatNumber(selectedMonth.actual)} | Diferença: ${selectedMonth.diff === null ? '—' : formatSigned(selectedMonth.diff)}`}
          programs={selectedMonth.programs}
          tasks={selectedMonth.tasks}
          onTaskClick={setSelectedTask}
          onProgramClick={(program) => setSelectedProgramDetail({ ...program, month: selectedMonth.label })}
          onClose={() => setSelectedMonthNumber(null)}
        />
      )}

      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-heading font-bold text-2xl text-liax-text-dark mb-1">Planejamento Mensal</h1>
          <p className="text-liax-neutral text-sm">
            Comparação entre o plano fixo de migrações e os dados concluídos do ClickUp no ano de {comparison.year}.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-liax-bg-light px-3 py-2 text-sm text-liax-neutral border border-liax-surface-border">
          <CalendarDays size={16} className="text-liax-primary" />
          Ano de análise: <strong className="text-liax-text-dark">{comparison.year}</strong>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <div className="bg-white rounded-2xl shadow-liax-xl p-3 border border-liax-surface-border flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-liax-neutral">Visão realizada</span>
            <InfoTooltip text="Escolha qual data do fluxo representa o realizado nos cards, no gráfico e no comparativo mensal." />
          </div>
          <div className="flex flex-wrap gap-2 px-1">
            {REALIZED_VIEWS.map((view) => (
              <button
                key={view.key}
                onClick={() => setSelectedView(view.key)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${selectedView === view.key ? 'bg-liax-primary text-white border-liax-primary' : 'bg-liax-bg-light text-liax-text-dark border-liax-surface-border hover:bg-white'}`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={Target}
          title="Plano anual"
          value={formatNumber(plannedAnnual)}
          subtitle="Soma do planejamento mensal fixo"
        />
        <SummaryCard
          icon={BarChart3}
          title={`Realizado — ${selectedViewMeta.label}`}
          value={formatNumber(actualAnnual)}
          subtitle="Migrações concluídas com a data selecionada"
          accent="text-emerald-600"
        />
        <SummaryCard
          icon={totalVariance >= 0 ? TrendingUp : TrendingDown}
          title="Diferença"
          value={formatSigned(totalVariance)}
          subtitle="Realizado menos planejado"
          accent={totalVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}
        />
        <SummaryCard
          icon={Minus}
          title="Atingimento"
          value={formatPercent(achievementAnnual)}
          subtitle="Execução do plano anual"
          accent="text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 mb-6">
        <LineChart
          title={graphTitle}
          description={graphDescription}
          tooltip="Use este gráfico para perceber rapidamente os meses acima ou abaixo do esperado."
          labels={chartLabels}
          datasets={chartDatasets}
          headerActions={(
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="inline-flex rounded-xl border border-liax-surface-border bg-liax-bg-light p-1">
                {GRAPH_LAYOUTS.map((layout) => (
                  <button
                    key={layout.key}
                    onClick={() => setGraphLayout(layout.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${graphLayout === layout.key ? 'bg-liax-primary text-white' : 'text-liax-text-dark hover:bg-white'}`}
                  >
                    {layout.label}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-xl border border-liax-surface-border bg-liax-bg-light p-1">
                {GRAPH_MODES.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setGraphMode(mode.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${graphMode === mode.key ? 'bg-liax-primary text-white' : 'text-liax-text-dark hover:bg-white'}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        />
      </div>

      <MonthlyComparisonChart
        title="Comparativo mensal"
        description="Cada barra representa o mês. Clique em uma barra para ver os detalhes do mês e, dentro do modal, clique em um programa para abrir suas informações."
        tooltip="Mostra lado a lado o planejamento e o realizado da visão selecionada."
        labels={chartLabels}
        planned={monthlyRows.map((row) => row.total)}
        actual={monthlyRows.map((row) => row.actual)}
        onMonthClick={(index) => {
          const month = MONTHLY_PLAN[index]
          if (month) {
            setSelectedProgramDetail(null)
            setSelectedMonthNumber(month.month)
          }
        }}
      />

      {showReferencePlan && (
        <div className="bg-white rounded-2xl shadow-liax-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={18} className="text-liax-primary" />
            <h2 className="font-heading font-bold text-liax-text-dark">Plano de referência</h2>
          </div>
          <p className="text-sm text-liax-neutral mb-4">
            Este é o planejamento fixo que serve como base para a comparação com o ClickUp.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MONTHLY_PLAN.map((item) => (
              <div key={item.month} className="rounded-xl border border-liax-surface-border bg-liax-bg-light px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-liax-text-dark">{item.label}</p>
                  <p className="text-xs text-liax-neutral">Meta mensal planejada</p>
                </div>
                <span className="text-xl font-heading font-bold text-liax-primary">{formatNumber(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
