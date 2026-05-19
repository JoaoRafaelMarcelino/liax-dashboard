import { X, User, Code2, Monitor, Bug, Calendar, Tag, Archive, ExternalLink, FlaskConical, RotateCcw, CheckCircle2, AlertCircle, AlignLeft, Layers } from 'lucide-react'
import { Badge, TypeBadge } from './Badge'

const PRIORITY_COLOR = { urgent: '#ef4444', high: '#f97316', normal: '#3b82f6', low: '#6b7280' }

function fmt(dt) {
  if (!dt) return null
  return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtDate(dt) {
  if (!dt) return null
  return new Date(dt).toLocaleDateString('pt-BR')
}

function SectionHeader({ icon: Icon, title, color = 'text-liax-primary' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className={color} />
      <p className="text-xs font-semibold uppercase tracking-wider text-liax-neutral">{title}</p>
    </div>
  )
}

function Field({ label, value, wide = false, highlight }) {
  const display = value ?? '—'
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-xs text-liax-neutral mb-0.5">{label}</p>
      <div className={`text-sm font-medium ${highlight ? highlight : 'text-liax-text-dark'}`}>{display}</div>
    </div>
  )
}

function DateField({ label, value, highlight }) {
  const d = fmtDate(value)
  return <Field label={label} value={d} highlight={d ? highlight : undefined} />
}

function UserList({ users, color }) {
  if (!users?.length) return <span className="text-liax-neutral text-sm">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {users.map(u => (
        <span key={u.id}
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${color || 'bg-liax-bg-light text-liax-text-dark border-liax-surface-border'}`}>
          <User size={10} /> {u.username || u.email || u.id}
        </span>
      ))}
    </div>
  )
}

function MilestoneTimeline({ task }) {
  const milestones = [
    {
      key: 'desenv_back_inicio',
      label: 'Início do Desenvolvimento',
      date: task.desenv_back_inicio,
      color: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      key: 'liberacao_hml_lello',
      label: 'Liberação para Homologação',
      date: task.liberacao_hml_lello,
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
    {
      key: 'aprovacao_hml_lello',
      label: 'Aprovação em Homologação',
      date: task.aprovacao_hml_lello,
      color: '#f59e0b',
      bg: '#fffbeb',
    },
    {
      key: 'aprovacao_prod_lello',
      label: 'Aprovação em Produção',
      date: task.aprovacao_prod_lello,
      color: '#16a34a',
      bg: '#f0fdf4',
    },
  ]

  const hasAny = milestones.some(m => m.date)
  if (!hasAny) return null

  const doneIdx = milestones.reduce((acc, m, i) => m.date ? i : acc, -1)

  return (
    <div className="mb-4 px-1">
      <div className="relative flex items-start justify-between">
        {milestones.map((m, i) => {
          const done = !!m.date
          const isLast = i === milestones.length - 1
          return (
            <div key={m.key} className="flex flex-col items-center flex-1 relative">
              {/* Connector line before this node */}
              {i > 0 && (
                <div className="absolute top-3.5 right-1/2 w-full h-0.5 -translate-y-1/2"
                  style={{ background: milestones[i - 1].date && done ? m.color : '#e2e8f0' }}
                />
              )}
              {/* Node */}
              <div
                className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all"
                style={done
                  ? { background: m.bg, borderColor: m.color }
                  : { background: '#f8fafc', borderColor: '#cbd5e1' }
                }
              >
                {done
                  ? <CheckCircle2 size={13} style={{ color: m.color }} />
                  : <div className="w-2 h-2 rounded-full bg-slate-300" />}
              </div>
              {/* Label + date */}
              <div className="mt-2 text-center px-1">
                <p className={`text-xs font-semibold leading-tight ${done ? '' : 'text-slate-400'}`}
                  style={done ? { color: m.color } : {}}>
                  {m.label}
                </p>
                <p className={`text-xs mt-0.5 ${done ? 'text-liax-text-dark font-medium' : 'text-slate-400'}`}>
                  {done ? fmtDate(m.date) : 'Pendente'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PhaseBlock({ icon: Icon, title, accentBg, accentText, accentBorder, users, inicio, fim, children }) {
  return (
    <div className={`rounded-xl border p-4 ${accentBg} ${accentBorder}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className={accentText} />
        <p className={`text-xs font-semibold uppercase tracking-wider ${accentText}`}>{title}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
        <div>
          <p className="text-xs text-liax-neutral mb-0.5">Início</p>
          <p className={`text-sm font-medium ${inicio ? accentText : 'text-liax-neutral'}`}>{fmtDate(inicio) || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-liax-neutral mb-0.5">Finalizado</p>
          <p className={`text-sm font-medium ${fim ? accentText : 'text-liax-neutral'}`}>{fmtDate(fim) || '—'}</p>
        </div>
        {children}
      </div>
      {users !== undefined && (
        <div>
          <p className="text-xs text-liax-neutral mb-1">Responsáveis</p>
          <UserList users={users} color={`${accentBg} ${accentText} ${accentBorder}`} />
        </div>
      )}
    </div>
  )
}

const TAG_ENV = {
  'produção': { label: 'Produção', color: '#ef4444' },
  'homologação': { label: 'Homologação', color: '#f97316' },
}

function BugEnvBadge({ tag }) {
  const env = TAG_ENV[tag?.toLowerCase()]
  if (!env) return <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">QA</span>
  return <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: env.color + '18', color: env.color }}>{env.label}</span>
}

export default function TaskModal({ task, onClose }) {
  if (!task) return null
  const priColor = PRIORITY_COLOR[task.priority] || '#6b7280'
  const isBug = task.custom_item_id === 1004
  const bugEnvTag = task.tags?.find(t => TAG_ENV[t?.toLowerCase()]) || null
  const progBugs = task._bugsByProg

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-5 border-b border-liax-surface-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {task.prioridade_custom && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-liax-primary text-white px-2.5 py-1 rounded-full">
                  <span className="opacity-75 font-normal">Ordem</span> #{task.prioridade_custom}
                </span>
              )}
              {task.lote && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                  <Layers size={10} /> {task.lote}
                </span>
              )}
              {task.programa && (
                <span className="inline-flex items-center text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                  {task.programa}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <TypeBadge customItemId={task.custom_item_id} />
              {task.status_name && <Badge color={task.status_color}>{task.status_name}</Badge>}
              {task.priority && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: priColor, background: priColor + '18', border: `1px solid ${priColor}33` }}>
                  {task.priority}
                </span>
              )}
              {task.reaberto && (
                <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  <RotateCcw size={10} /> Reaberto: {task.reaberto}
                </span>
              )}
              {task.archived && (
                <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Archive size={10} /> arquivada
                </span>
              )}
            </div>
            <a href={`https://app.clickup.com/t/${task.id}`} target="_blank" rel="noopener noreferrer"
              className="font-heading font-bold text-liax-text-dark text-base leading-snug hover:text-liax-primary hover:underline transition-colors inline-flex items-center gap-1.5 group">
              {task.name}
              <ExternalLink size={13} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
            </a>
            <p className="text-xs text-liax-neutral mt-1 font-mono">#{task.id}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-liax-bg-light text-liax-neutral transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Datas gerais */}
          <div>
            <SectionHeader icon={Calendar} title="Datas" />
            <MilestoneTimeline task={task} />
          </div>

          <hr className="border-liax-surface-border" />

          {/* Fases de desenvolvimento */}
          <div>
            <SectionHeader icon={Code2} title="Ciclo de Desenvolvimento" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PhaseBlock
                icon={Code2} title="Dev Back-end"
                accentBg="bg-blue-50" accentText="text-blue-700" accentBorder="border-blue-200"
                users={task.dev_back}
                inicio={task.desenv_back_inicio}
                fim={task.desenv_back_finalizado}
              />
              <PhaseBlock
                icon={Monitor} title="Dev Front-end"
                accentBg="bg-violet-50" accentText="text-violet-700" accentBorder="border-violet-200"
                users={task.dev_front}
                inicio={task.desenv_front_inicio}
                fim={task.desenv_front_finalizado}
              />
              <PhaseBlock
                icon={FlaskConical} title="QA"
                accentBg="bg-emerald-50" accentText="text-emerald-700" accentBorder="border-emerald-200"
                users={task.qa}
                inicio={task.qa_inicio}
                fim={task.qa_finalizado}
              />
              <PhaseBlock
                icon={RotateCcw} title="Reteste"
                accentBg="bg-orange-50" accentText="text-orange-700" accentBorder="border-orange-200"
                users={task.reteste?.length ? task.reteste : task.qa}
                inicio={task.reteste_inicio}
                fim={task.reteste_finalizado}
              >
                {!task.reteste?.length && task.qa?.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-orange-500 italic">* Usando equipe de QA (sem reteste específico)</p>
                  </div>
                )}
              </PhaseBlock>
            </div>
          </div>

          <hr className="border-liax-surface-border" />

          {/* Aprovações e HML */}
          <div>
            <SectionHeader icon={CheckCircle2} title="Homologação e Aprovações" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <DateField label="Liberação HML Lello" value={task.liberacao_hml_lello} highlight="text-indigo-600 font-semibold" />
              <DateField label="Aprovação HML Lello" value={task.aprovacao_hml_lello} highlight="text-indigo-600 font-semibold" />
              <DateField label="Aprovação PROD Lello" value={task.aprovacao_prod_lello} highlight="text-green-600 font-semibold" />
              <DateField label="Aplicação em Produção" value={task.aplicacao_producao} highlight="text-green-600 font-semibold" />
            </div>
          </div>

          <hr className="border-liax-surface-border" />

          {/* Bugs */}
          <div>
            <SectionHeader icon={Bug} title="Bugs" color="text-red-500" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-3">
              <div>
                <p className="text-xs text-liax-neutral mb-0.5">Bugs em aberto</p>
                <p className={`text-sm font-bold ${task.bugs_em_aberto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {task.bugs_em_aberto ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-liax-neutral mb-0.5">Bugs totais</p>
                <p className="text-sm font-bold text-liax-text-dark">{task.bugs_totais ?? '—'}</p>
              </div>
            </div>
            {isBug ? (
              <div className="flex items-center gap-3">
                <p className="text-xs text-liax-neutral">Ambiente:</p>
                <BugEnvBadge tag={bugEnvTag} />
                {task.tags?.filter(t => !TAG_ENV[t?.toLowerCase()]).map(t => (
                  <span key={t} className="text-xs bg-liax-bg-light text-liax-neutral px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            ) : progBugs ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-xl font-bold text-blue-600">{progBugs.qa}</p>
                  <p className="text-xs text-blue-500 mt-0.5">QA</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                  <p className="text-xl font-bold text-orange-500">{progBugs.homologacao}</p>
                  <p className="text-xs text-orange-400 mt-0.5">Homologação</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-xl font-bold text-red-600">{progBugs.producao}</p>
                  <p className="text-xs text-red-400 mt-0.5">Produção</p>
                </div>
              </div>
            ) : null}
          </div>

          <hr className="border-liax-surface-border" />

          {/* Informações gerais */}
          <div>
            <SectionHeader icon={Tag} title="Informações" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="Programa" value={task.programa} />
              <Field label="Lote" value={task.lote} />
              <Field label="Ordem de atendimento" value={task.ordem_atendimento} />
              <Field label="Quantidade de linhas" value={task.quantidade_linhas} />
              <Field label="Reaberto" value={task.reaberto} highlight={task.reaberto ? 'text-orange-600' : undefined} />
              <Field label="Prioridade" value={task.prioridade_custom} />
            </div>
            {task.motivo_block && (
              <div className="mt-3">
                <p className="text-xs text-liax-neutral mb-1 flex items-center gap-1">
                  <AlertCircle size={11} className="text-red-500" /> Motivo do Bloqueio
                </p>
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{task.motivo_block}</p>
              </div>
            )}
            {task.text_content && (
              <div className="mt-3">
                <p className="text-xs text-liax-neutral mb-1 flex items-center gap-1">
                  <AlignLeft size={11} /> Descrição
                </p>
                <p className="text-sm text-liax-text-dark bg-liax-bg-light rounded-xl px-3 py-2 whitespace-pre-line line-clamp-4">{task.text_content}</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-liax-surface-border flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-liax-bg-light text-liax-neutral hover:bg-liax-surface-border transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
