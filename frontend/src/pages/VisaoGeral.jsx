import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppConfig } from '../context/AppConfigContext'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI } from '../services/api'
import { readCache, writeCache } from '../utils/cache'
import { formatWeekWithRange } from '../utils/dateHelpers'
import LineChart from '../components/Charts/LineChart'
import BarChart from '../components/Charts/BarChart'
import DoughnutChart from '../components/Charts/DoughnutChart'
import PlanejamentoMensal from './PlanejamentoMensal'
import { StatCard } from '../components/UI/Card'
import TaskModal from '../components/UI/TaskModal'
import ForecastSection from '../components/Forecast/ForecastSection'
import {
  Loader2, LayoutDashboard, RotateCcw, Settings2,
  GitMerge, Bug, TrendingUp, CheckCircle2, Clock, Zap, Turtle, PackageCheck, CheckSquare, X,
  Code2, FlaskConical, Rocket, Timer,
} from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function WeekFilter({ weeks, start, end, onStartChange, onEndChange, onReset }) {
  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-liax-neutral mb-1.5">Semana Inicial</label>
          <select value={start} onChange={e => onStartChange(e.target.value)} className="liax-input py-2 text-sm w-52">
            <option value="">Todas</option>
            {weeks.map(w => <option key={w} value={w}>{formatWeekWithRange(w)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-liax-neutral mb-1.5">Semana Final</label>
          <select value={end} onChange={e => onEndChange(e.target.value)} className="liax-input py-2 text-sm w-52">
            <option value="">Todas</option>
            {weeks.map(w => <option key={w} value={w}>{formatWeekWithRange(w)}</option>)}
          </select>
        </div>
        <button onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-liax-bg-light text-liax-neutral hover:bg-liax-surface-border text-sm font-medium transition-colors">
          <RotateCcw size={13} /> Resetar
        </button>
      </div>
    </div>
  )
}

function OverviewShell({ title, subtitle, icon: Icon, children, action }) {
  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-6 h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-liax-primary/10 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-liax-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-liax-text-dark text-base leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-liax-neutral">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function PhaseMetricsOverview({ migrationTime }) {
  if (!migrationTime) return null

  const cards = [
    {
      title: 'Desenvolvimento',
      value: migrationTime.dev?.average != null ? `${migrationTime.dev.average} dias` : '—',
      subtitle: migrationTime.dev?.average_worked != null ? `${migrationTime.dev.average_worked} dias trabalhados` : 'Média total por fase',
      icon: Code2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      tooltip: 'Tempo médio da fase de desenvolvimento. Considera o período total e o tempo trabalhado (sem ocioso entre back e front).',
    },
    {
      title: 'QA',
      value: migrationTime.qa?.average != null ? `${migrationTime.qa.average} dias` : '—',
      subtitle: migrationTime.qa?.average_worked != null ? `${migrationTime.qa.average_worked} dias trabalhados` : 'Média total por fase',
      icon: FlaskConical,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      tooltip: 'Tempo médio da fase de QA, incluindo QA e reteste quando existirem.',
    },
    {
      title: 'Homologação',
      value: migrationTime.hml?.average != null ? `${migrationTime.hml.average} dias` : '—',
      subtitle: migrationTime.hml?.count != null ? `${migrationTime.hml.count} migrações` : undefined,
      icon: PackageCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      tooltip: 'Tempo médio entre liberação para HML e aprovação da Lello.',
    },
    {
      title: 'Produção',
      value: migrationTime.prod?.average != null ? `${migrationTime.prod.average} dias` : '—',
      subtitle: migrationTime.prod?.count != null ? `${migrationTime.prod.count} migrações` : undefined,
      icon: Rocket,
      color: 'text-green-600',
      bg: 'bg-green-50',
      tooltip: 'Tempo médio entre aplicação em produção e aprovação final.',
    },
    {
      title: 'Fluxo Total',
      value: migrationTime.total?.average != null ? `${migrationTime.total.average} dias` : '—',
      subtitle: migrationTime.total?.average_worked != null ? `${migrationTime.total.average_worked} dias trabalhados` : 'Média do fluxo inteiro',
      icon: Timer,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      tooltip: 'Tempo total do fluxo da migração do início do desenvolvimento até a aprovação em produção.',
    },
  ]

  return (
    <OverviewShell
      title="Desempenho por Fase"
      subtitle="Médias total e trabalhada por etapa"
      icon={Timer}
      action={<span className="text-xs text-liax-neutral">{migrationTime.total?.count ?? 0} migrações analisadas</span>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
            tooltip={card.tooltip}
          />
        ))}
      </div>
    </OverviewShell>
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

  return (
    <OverviewShell
      title="Distribuição Executiva por Status"
      subtitle="Distribuição percentual das migrações"
      icon={CheckSquare}
      action={(
        <div className="text-right">
          <p className="text-xs text-liax-neutral">Total</p>
          <p className="text-lg font-heading font-bold text-liax-text-dark">{total}</p>
        </div>
      )}
    >
      <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
        {data.map((item, index) => {
          const pct = total ? (item.count / total) * 100 : 0
          return (
            <div key={`${item.status}-${index}`}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color || '#94a3b8' }} />
                  <span className="text-sm text-liax-text-dark truncate capitalize">{item.status || 'Sem status'}</span>
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
    </OverviewShell>
  )
}

function LibHmlSummaryCard({ summary }) {
  if (!summary) return null

  return (
    <OverviewShell
      title="Resumo Executivo de Liberações HML"
      subtitle="Card consolidado com o total de migrações liberadas"
      icon={PackageCheck}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-heading font-bold text-indigo-600 leading-none">{summary.total ?? 0}</p>
          <p className="text-xs text-liax-neutral mt-1">migrações liberadas</p>
        </div>
        {summary.last_date && (
          <div className="text-right">
            <p className="text-xs text-liax-neutral">Última atualização</p>
            <p className="text-sm font-semibold text-liax-text-dark">{summary.last_date}</p>
          </div>
        )}
      </div>
    </OverviewShell>
  )
}

function TaskListModal({ title, subtitle, icon: Icon, gradient, tasks, onTaskClick, onClose, renderRow }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className={`flex items-center justify-between px-6 py-5 ${gradient || 'bg-liax-primary'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-heading font-bold text-white text-base leading-tight truncate">{title}</p>
              {subtitle && <p className="text-white/70 text-xs mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-liax-surface-border">
          {tasks.length === 0
            ? <div className="px-6 py-12 text-center text-liax-neutral text-sm">Sem dados para exibir</div>
            : tasks.map((task) => renderRow(task, () => onTaskClick(task)))}
        </div>
      </div>
    </div>
  )
}

function HomologacaoSection({ data }) {
  const { statusLib, aprovacoes, bugsHml } = data
  const [listModal, setListModal] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  return (
    <>
      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button onClick={() => setListModal('lib')}
          className="bg-gradient-to-r from-teal-600 to-teal-400 rounded-2xl shadow-liax-xl px-6 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><PackageCheck size={18} className="text-white" /></div>
            <div>
              <p className="font-heading font-bold text-white text-base leading-tight">Liberação HML</p>
              <p className="text-teal-100 text-xs">Aguardando homologação Lello</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-3xl leading-none">{statusLib?.liberated_count ?? 0}</p>
            <p className="text-teal-100 text-xs mt-0.5">aguardando</p>
          </div>
        </button>
        <button onClick={() => setListModal('aprov')}
          className="bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl shadow-liax-xl px-6 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><CheckSquare size={18} className="text-white" /></div>
            <div>
              <p className="font-heading font-bold text-white text-base leading-tight">Aprovações HML Lello</p>
              <p className="text-indigo-100 text-xs">Migrações aprovadas em homologação</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-3xl leading-none">{aprovacoes?.total ?? 0}</p>
            <p className="text-indigo-100 text-xs mt-0.5">aprovadas</p>
          </div>
        </button>
        <button onClick={() => setListModal('bugs')}
          className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-2xl shadow-liax-xl px-6 py-5 flex items-center justify-between hover:brightness-105 transition-all text-left w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Bug size={18} className="text-white" /></div>
            <div>
              <p className="font-heading font-bold text-white text-base leading-tight">Bugs de Homologação</p>
              <p className="text-orange-100 text-xs">Migrações com bugs em HML</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-3xl leading-none">{bugsHml?.count ?? 0}</p>
            <p className="text-orange-100 text-xs mt-0.5">migrações</p>
          </div>
        </button>
      </div>
      {listModal === 'lib' && (
        <TaskListModal title="Liberação HML — Aguardando Homologação"
          subtitle={`${statusLib?.liberated_count ?? 0} migrações liberadas sem aprovação HML`}
          icon={PackageCheck} gradient="bg-gradient-to-r from-teal-600 to-teal-400"
          tasks={statusLib?.liberated_tasks ?? []} onClose={() => setListModal(null)} onTaskClick={setSelectedTask}
          renderRow={(task, onClick) => {
            const urgency = task.days_waiting >= 14 ? 'text-red-600 bg-red-50' : task.days_waiting >= 7 ? 'text-amber-600 bg-amber-50' : 'text-teal-700 bg-teal-50'
            return (
              <button key={task.id} onClick={onClick} className="w-full flex items-center justify-between px-6 py-3 hover:bg-teal-50 transition-colors text-left group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-teal-700">{task.name}</p>
                    {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-liax-neutral">{new Date(task.liberacao_hml_lello).toLocaleDateString('pt-BR')}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${urgency}`}>{task.days_waiting === 0 ? 'hoje' : `${task.days_waiting}d`}</span>
                </div>
              </button>
            )
          }} />
      )}
      {listModal === 'aprov' && (
        <TaskListModal title="Aprovações HML Lello"
          subtitle={`${aprovacoes?.total ?? 0} migrações aprovadas em homologação`}
          icon={CheckSquare} gradient="bg-gradient-to-r from-indigo-600 to-indigo-400"
          tasks={aprovacoes?.weekly?.flatMap(w => w.tasks) ?? []} onClose={() => setListModal(null)} onTaskClick={setSelectedTask}
          renderRow={(task, onClick) => (
            <button key={task.id} onClick={onClick} className="w-full flex items-center justify-between px-6 py-3 hover:bg-indigo-50 transition-colors text-left group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-indigo-700">{task.name}</p>
                  {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {task.aprovacao_hml_lello && <span className="text-xs text-liax-neutral">{new Date(task.aprovacao_hml_lello).toLocaleDateString('pt-BR')}</span>}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (task.status_color || '#94a3b8') + '22', color: task.status_color || '#94a3b8' }}>{task.status_name || '—'}</span>
              </div>
            </button>
          )} />
      )}
      {listModal === 'bugs' && (
        <TaskListModal title="Bugs de Homologação"
          subtitle={`${bugsHml?.count ?? 0} migrações com bugs de homologação atrelados`}
          icon={Bug} gradient="bg-gradient-to-r from-orange-600 to-orange-400"
          tasks={bugsHml?.tasks ?? []} onClose={() => setListModal(null)} onTaskClick={setSelectedTask}
          renderRow={(task, onClick) => (
            <button key={task.id} onClick={onClick} className="w-full flex items-center justify-between px-6 py-3 hover:bg-orange-50 transition-colors text-left group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status_color || '#94a3b8' }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-liax-text-dark truncate group-hover:text-orange-700">{task.name}</p>
                  {task.programa && <p className="text-xs text-liax-neutral">{task.programa}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {task.bugs_totais > 0 && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${task.bugs_em_aberto > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{task.bugs_em_aberto}/{task.bugs_totais}</span>}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (task.status_color || '#94a3b8') + '22', color: task.status_color || '#94a3b8' }}>{task.status_name || '—'}</span>
              </div>
            </button>
          )} />
      )}
    </>
  )
}

function ChartBlock({ chartKey, data, params }) {
  const { summary, migrationTime, forecastData, migrationsPerWeek, tasksCompleted, bugsPerWeek, libHmlPerWeek, migrationsByStatus, collaborators, bugsByProg, libHmlSummary } = data

  switch (chartKey) {
    case 'summary_cards':
      if (!summary) return null
      return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total de Tarefas" value={summary.total} icon={CheckCircle2} color="text-liax-primary" bg="bg-blue-50" />
          <StatCard title="Migrações" value={summary.migrations} icon={GitMerge} color="text-liax-primary-dark" bg="bg-indigo-50" />
          <StatCard title="Bugs" value={summary.bugs} icon={Bug} color="text-liax-error" bg="bg-red-50" />
          <StatCard title="Melhorias" value={summary.improvements} icon={TrendingUp} color="text-liax-success-dark" bg="bg-green-50" />
        </div>
      )

    case 'migration_time':
      if (!migrationTime) return null
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Média Executiva" value={migrationTime.average != null ? `${migrationTime.average} dias` : '—'} subtitle={`${migrationTime.count} migrações`} icon={Clock} color="text-liax-primary" bg="bg-blue-50" />
          <StatCard title="Melhor Cenário" value={migrationTime.fastest != null ? `${migrationTime.fastest} dias` : '—'} icon={Zap} color="text-liax-success-dark" bg="bg-green-50" />
          <StatCard title="Pior Cenário" value={migrationTime.slowest != null ? `${migrationTime.slowest} dias` : '—'} icon={Turtle} color="text-liax-error" bg="bg-red-50" />
        </div>
      )

    case 'migration_phase_metrics':
      return <PhaseMetricsOverview migrationTime={migrationTime} />

    case 'forecast_section':
      return forecastData ? <ForecastSection forecastData={forecastData} migrationTime={migrationTime} /> : null

    case 'migrations_per_week':
      return <LineChart data={migrationsPerWeek} label="Migrações" color="#0074e8" title="Fluxo de Migrações por Semana" description="Migrações em homologação sem bugs pendentes" />

    case 'tasks_completed_per_week':
      return <LineChart data={tasksCompleted} label="Tarefas" color="#17dd30" title="Entrega de Tarefas por Semana" description="Todas as tarefas com date_done preenchido" />

    case 'bugs_per_week':
      return <LineChart data={bugsPerWeek} label="Bugs" color="#cc3366" title="Incidentes por Semana" description="Bugs criados por semana" />

    case 'liberacoes_hml_per_week':
      return <LineChart data={libHmlPerWeek} label="Liberações" color="#6366f1" title="Ritmo de Liberação HML" description="Tarefas com data de Liberação HML preenchida" />

    case 'migrations_by_status':
      return <DoughnutChart data={migrationsByStatus} title="Distribuição Atual de Migrações" description="Distribuição das migrações pelos status atuais" />

    case 'migrations_status_summary':
      return <StatusRanking data={migrationsByStatus} />

    case 'collaborators_all':
      return <BarChart data={collaborators.all} title="Atuação Consolidada por Colaborador" description="Número de tarefas por responsável (todos)" />

    case 'collaborators_qa':
      return <BarChart data={collaborators.qa} title="Performance da Equipe de QA" description="Thiago, Ana Keila, Juliana Oliveira, Pedro Samuel, Cristian" color="#cc3366" />

    case 'collaborators_dev':
      return <BarChart data={collaborators.dev} title="Performance da Equipe de Desenvolvimento" description="Demais colaboradores classificados como desenvolvimento" color="#0074e8" />

    case 'bugs_by_programa': {
      const top15 = bugsByProg.slice(0, 15)
      const chartData = {
        labels: top15.map(d => d.programa),
        datasets: [
          { label: 'QA', data: top15.map(d => d.qa), backgroundColor: '#3b82f6cc', borderRadius: 4, borderSkipped: false },
          { label: 'Homologação', data: top15.map(d => d.homologacao), backgroundColor: '#f97316cc', borderRadius: 4, borderSkipped: false },
          { label: 'Produção', data: top15.map(d => d.producao), backgroundColor: '#ef4444cc', borderRadius: 4, borderSkipped: false },
        ],
      }
      const options = {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { tooltip: { mode: 'index', intersect: false }, legend: { position: 'top' } },
        scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true } },
      }
      return (
        <div className="bg-white rounded-2xl shadow-liax-xl p-6">
          <h3 className="font-heading font-bold text-liax-text-dark text-base mb-0.5">Top 15 Incidentes por Programa</h3>
          <p className="text-xs text-liax-neutral mb-4">Classificado por ambiente (QA · Homologação · Produção)</p>
          <div style={{ height: Math.max(200, top15.length * 36) }}>
            <Bar data={chartData} options={options} />
          </div>
        </div>
      )
    }

    case 'homologacao_section':
      return <HomologacaoSection data={data} />

    case 'planning_section':
      return <PlanejamentoMensal showReferencePlan={false} />

    case 'lib_hml_summary':
      return <LibHmlSummaryCard summary={libHmlSummary} />

    default:
      return null
  }
}

function TabContent({ tab, data, params }) {
  const pairs = []
  const singles = ['summary_cards', 'migration_time', 'migration_phase_metrics', 'forecast_section', 'collaborators_all', 'bugs_by_programa', 'homologacao_section', 'planning_section', 'lib_hml_summary']

  const half = []
  for (const key of tab.charts) {
    if (singles.includes(key)) {
      if (half.length === 1) { pairs.push({ type: 'half', keys: half }); half.length = 0 }
      if (half.length === 0) pairs.push({ type: 'full', keys: [key] })
    } else {
      half.push(key)
      if (half.length === 2) { pairs.push({ type: 'half', keys: [...half] }); half.length = 0 }
    }
  }
  if (half.length > 0) pairs.push({ type: 'half', keys: [...half] })

  return (
    <div className="space-y-6">
      {pairs.map((pair, i) => (
        pair.type === 'full'
          ? <ChartBlock key={i} chartKey={pair.keys[0]} data={data} params={params} />
          : (
            <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pair.keys.map(k => <ChartBlock key={k} chartKey={k} data={data} params={params} />)}
            </div>
          )
      ))}
    </div>
  )
}

export default function VisaoGeral() {
  const { visionTabs } = useAppConfig()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState(0)
  const [weeks, setWeeks] = useState([])
  const [weekStart, setWeekStart] = useState('')
  const [weekEnd, setWeekEnd] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [data, setData] = useState({
    summary: null,
    migrationTime: null,
    forecastData: null,
    migrationsPerWeek: [],
    tasksCompleted: [],
    bugsPerWeek: [],
    libHmlPerWeek: [],
    migrationsByStatus: [],
    collaborators: { all: [], qa: [], dev: [] },
    bugsByProg: [],
    libHmlSummary: null,
    statusLib: { liberated_count: 0, liberated_tasks: [] },
    aprovacoes: { total: 0, weeks: 0, weekly: [] },
    bugsHml: { count: 0, tasks: [] },
  })

  useEffect(() => {
    dashboardAPI.availableWeeks().then(r => setWeeks(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (visionTabs.length === 0) { setLoading(false); return }
    const params = {
      ...(weekStart ? { week_start: weekStart } : {}),
      ...(weekEnd ? { week_end: weekEnd } : {}),
    }
    const cacheKey = `visao_geral_${weekStart || 'all'}_${weekEnd || 'all'}`
    const cached = readCache(cacheKey)
    if (cached) {
      setData(cached)
      setLoading(false)
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    Promise.all([
      dashboardAPI.summary(),
      dashboardAPI.migrationTime(),
      dashboardAPI.forecastData(),
      dashboardAPI.migrationsByStatus(),
      dashboardAPI.migrationsPerWeek(params),
      dashboardAPI.tasksCompletedPerWeek(params),
      dashboardAPI.bugsPerWeek(params),
      dashboardAPI.liberacoesHmlPerWeek(params),
      dashboardAPI.liberacoesHmlSummary(),
      dashboardAPI.tasksByCollaborator(params),
      dashboardAPI.bugsByPrograma(),
      dashboardAPI.statusLiberacaoHml(),
      dashboardAPI.aprovacoes_hml(params),
      dashboardAPI.bugsHmlMigrations(),
    ]).then(([sum, mt, forecast, mbs, mpw, tcp, bpw, lib, libSum, collab, bprog, slib, aprov, bhml]) => {
      const freshData = {
        summary: sum.data,
        migrationTime: mt.data,
        forecastData: forecast.data,
        migrationsByStatus: mbs.data,
        migrationsPerWeek: mpw.data,
        tasksCompleted: tcp.data,
        bugsPerWeek: bpw.data,
        libHmlPerWeek: lib.data,
        libHmlSummary: libSum.data,
        collaborators: collab.data,
        bugsByProg: bprog.data,
        statusLib: slib.data,
        aprovacoes: aprov.data,
        bugsHml: bhml.data,
      }
      setData(freshData)
      writeCache(cacheKey, freshData)
    }).finally(() => {
      setLoading(false)
      setRefreshing(false)
    })
  }, [visionTabs, weekStart, weekEnd])

  const params = { week_start: weekStart, week_end: weekEnd }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-2xl text-liax-text-dark mb-1">Visão Geral</h1>
            {refreshing && <Loader2 size={14} className="animate-spin text-liax-neutral mb-1" />}
          </div>
          <p className="text-liax-neutral text-sm">Painel dinâmico configurado pelo administrador</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => navigate('/admin/config-visao')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-liax-surface-border text-liax-neutral hover:text-liax-primary hover:border-liax-primary text-sm font-medium transition-colors"
          >
            <Settings2 size={15} /> Configurar
          </button>
        )}
      </div>

      {visionTabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <LayoutDashboard size={56} className="text-liax-neutral mb-4" />
          <h2 className="font-heading font-bold text-xl text-liax-text-dark mb-2">Nenhuma aba configurada</h2>
          <p className="text-liax-neutral text-sm mb-6">O administrador ainda não configurou a Visão Geral.</p>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin/config-visao')}
              className="flex items-center gap-2 px-5 py-2.5 bg-liax-primary text-white rounded-xl font-semibold text-sm hover:bg-liax-primary-dark transition-colors">
              <Settings2 size={16} /> Configurar agora
            </button>
          )}
        </div>
      ) : (
        <>
          <WeekFilter
            weeks={weeks}
            start={weekStart}
            end={weekEnd}
            onStartChange={setWeekStart}
            onEndChange={setWeekEnd}
            onReset={() => { setWeekStart(''); setWeekEnd('') }}
          />

          {/* Tab bar */}
          <div className="flex gap-1 mb-6 bg-white rounded-2xl shadow-liax-xl p-2">
            {visionTabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex-1 ${
                  activeTab === idx
                    ? 'bg-liax-primary text-white'
                    : 'text-liax-neutral hover:bg-liax-bg-light hover:text-liax-text-dark'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-liax-primary" size={32} />
            </div>
          ) : (
            visionTabs[activeTab] && (
              visionTabs[activeTab].charts.length === 0 ? (
                <div className="text-center py-16 text-liax-neutral text-sm">
                  Nenhum gráfico selecionado para esta aba.
                </div>
              ) : (
                <TabContent tab={visionTabs[activeTab]} data={data} params={params} />
              )
            )
          )}
        </>
      )}
    </div>
  )
}
