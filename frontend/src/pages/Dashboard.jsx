import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../services/api'
import { readCache, writeCache } from '../utils/cache'
import { StatCard } from '../components/UI/Card'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import DoughnutChart from '../components/Charts/DoughnutChart'
import LineChart from '../components/Charts/LineChart'
import { GitMerge, Bug, TrendingUp, CheckCircle2, Loader2, ArrowRight, PackageCheck } from 'lucide-react'
import InfoTooltip from '../components/UI/InfoTooltip'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [byStatus, setByStatus] = useState([])
  const [bugsByProg, setBugsByProg] = useState([])
  const [libHmlData, setLibHmlData] = useState([])
  const [libHmlSummary, setLibHmlSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const CACHE_KEY = 'dashboard_main'
    const cached = readCache(CACHE_KEY)
    if (cached) {
      setSummary(cached.summary)
      setByStatus(cached.byStatus)
      setBugsByProg(cached.bugsByProg)
      setLibHmlData(cached.libHmlData)
      setLibHmlSummary(cached.libHmlSummary)
      setLoading(false)
      setRefreshing(true)
    }
    Promise.all([
      dashboardAPI.summary(),
      dashboardAPI.migrationsByStatus(),
      dashboardAPI.bugsByPrograma(),
      dashboardAPI.liberacoesHmlPerWeek(),
      dashboardAPI.liberacoesHmlSummary(),
    ]).then(([sumRes, statusRes, bugsRes, libRes, libSum]) => {
      const fresh = {
        summary: sumRes.data,
        byStatus: statusRes.data,
        bugsByProg: bugsRes.data.slice(0, 15),
        libHmlData: libRes.data,
        libHmlSummary: libSum.data,
      }
      setSummary(fresh.summary)
      setByStatus(fresh.byStatus)
      setBugsByProg(fresh.bugsByProg)
      setLibHmlData(fresh.libHmlData)
      setLibHmlSummary(fresh.libHmlSummary)
      writeCache(CACHE_KEY, fresh)
    }).finally(() => {
      setLoading(false)
      setRefreshing(false)
    })
  }, [])

  const top15 = bugsByProg.slice(0, 15)

  const bugsChartData = {
    labels: top15.map(d => d.programa),
    datasets: [
      { label: 'QA', data: top15.map(d => d.qa), backgroundColor: '#3b82f6cc', borderRadius: 4, borderSkipped: false },
      { label: 'Homologação', data: top15.map(d => d.homologacao), backgroundColor: '#f97316cc', borderRadius: 4, borderSkipped: false },
      { label: 'Produção', data: top15.map(d => d.producao), backgroundColor: '#ef4444cc', borderRadius: 4, borderSkipped: false },
    ],
  }

  const bugsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { stacked: true, beginAtZero: true, grid: { color: '#f4f4f5' }, ticks: { stepSize: 1 } },
      y: { stacked: true, grid: { display: false }, ticks: { font: { family: 'ui-monospace, monospace', size: 10 } } },
    },
  }

  const donutData = byStatus.slice(0, 10).map(s => ({ name: s.status, value: s.count, color: s.color }))

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="animate-spin text-liax-primary" size={32} />
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="font-heading font-bold text-2xl text-liax-text-dark">Dashboard</h1>
        {refreshing && <Loader2 size={14} className="animate-spin text-liax-neutral" />}
      </div>
      <p className="text-liax-neutral text-sm mb-6">Visão geral do projeto</p>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total de Tarefas" value={summary.total} icon={CheckCircle2} color="text-liax-primary" bg="bg-blue-50" tooltip="Total de tarefas cadastradas no ClickUp (migrações, bugs e melhorias)." />
          <StatCard title="Migrações" value={summary.migrations} icon={GitMerge} color="text-liax-primary-dark" bg="bg-indigo-50" tooltip="Tarefas do tipo migração (custom_item_id = 0)." />
          <StatCard title="Bugs" value={summary.bugs} icon={Bug} color="text-liax-error" bg="bg-red-50" tooltip="Tarefas do tipo bug (custom_item_id = 1004)." />
          <StatCard title="Melhorias" value={summary.improvements} icon={TrendingUp} color="text-liax-success-dark" bg="bg-green-50" tooltip="Tarefas classificadas como melhoria ou evolução." />
        </div>
      )}

      {/* Lib HML summary card */}
      {libHmlSummary && (
        <div className="bg-white rounded-2xl shadow-liax-xl p-5 mb-6 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <PackageCheck size={20} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-liax-neutral font-semibold uppercase tracking-wide">Liberações HML Lello</p>
            <div className="flex items-baseline gap-4 mt-0.5">
              <p className="text-2xl font-heading font-bold text-indigo-600">{libHmlSummary.total}</p>
              <p className="text-sm text-liax-neutral">tarefas liberadas</p>
              {libHmlSummary.last_date && (
                <p className="text-sm text-liax-neutral ml-auto">Última: <span className="font-semibold text-liax-text-dark">{libHmlSummary.last_date}</span></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* Bugs por Programa — stacked bar */}
        <div className="col-span-2 bg-white rounded-2xl shadow-liax-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-liax-text-dark">Top 15 Bugs por Programa</h3>
                <InfoTooltip text="Agrupa bugs abertos por programa (campo Programa da tarefa), separando por ambiente: QA, Homologação e Produção. Mostra os 15 programas com mais bugs." />
              </div>
              <p className="text-xs text-liax-neutral mt-0.5">Classificado por ambiente (QA · Homologação · Produção)</p>
            </div>
            <button onClick={() => navigate('/bugs-por-programa')}
              className="flex items-center gap-1 text-xs text-liax-primary hover:underline">
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ height: Math.max(260, top15.length * 26) }}>
            <Bar data={bugsChartData} options={bugsChartOptions} />
          </div>
        </div>

        {/* Migrações por Status — donut */}
        <div>
          <DoughnutChart
            data={donutData}
            nameKey="name"
            valueKey="value"
            title="Migrações por Status"
            description="Distribuição atual de migrações"
            tooltip="Mostra a proporção de migrações em cada status atual. Considera apenas tarefas do tipo migração não arquivadas."
          />
        </div>
      </div>

      {/* Liberações HML por semana */}
      {libHmlData.length > 0 && (
        <div className="mb-6">
          <LineChart
            data={libHmlData}
            label="Liberações"
            color="#6366f1"
            title="Liberações HML Lello por Semana"
            description="Tarefas com data de Liberação HML Lello preenchida, agrupadas por semana"
            tooltip="Contabiliza migrações cuja data de liberação para HML Lello (campo liberacao_hml_lello) foi preenchida, agrupando por semana ISO."
          />
        </div>
      )}

      {/* Status summary table */}
      <div className="bg-white rounded-2xl shadow-liax-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-liax-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="font-heading font-bold text-liax-text-dark">Status das Migrações</p>
            <InfoTooltip text="Lista todos os status presentes nas migrações com a contagem e proporção de cada um em relação ao total." />
          </div>
          <button onClick={() => navigate('/tasks')}
            className="flex items-center gap-1 text-xs text-liax-primary hover:underline">
            Ver tarefas <ArrowRight size={12} />
          </button>
        </div>
        <div className="divide-y divide-liax-surface-border">
          {byStatus.map(s => (
            <div key={s.status} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color || '#ccc' }} />
                <span className="text-sm text-liax-text-dark capitalize">{s.status}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-liax-bg-light rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    background: s.color || '#ccc',
                    width: `${Math.min(100, (s.count / (summary?.migrations || 1)) * 100)}%`
                  }} />
                </div>
                <span className="text-sm font-semibold text-liax-text-dark w-8 text-right">{s.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
