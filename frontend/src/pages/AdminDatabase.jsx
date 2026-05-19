import { useState } from 'react'
import { Database } from 'lucide-react'

const W = 168
const H = 36

const CATS = {
  auth:     { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Autenticação' },
  sync:     { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Sincronização' },
  clickup:  { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', label: 'ClickUp Entidades' },
  tasks:    { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', label: 'Tarefas' },
  junction: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: 'Tabelas Relacionais' },
  config:   { color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', label: 'Configuração' },
}

const NODES = [
  { id: 'user_roles',             x: 40,  y: 40,  cat: 'auth' },
  { id: 'users',                  x: 230, y: 40,  cat: 'auth' },
  { id: 'app_config',             x: 230, y: 190, cat: 'config' },
  { id: 'sync_config',            x: 40,  y: 210, cat: 'sync' },
  { id: 'sync_log',               x: 40,  y: 380, cat: 'sync' },
  { id: 'clickup_lists',          x: 330, y: 140, cat: 'clickup' },
  { id: 'clickup_statuses',       x: 330, y: 290, cat: 'clickup' },
  { id: 'clickup_users',          x: 330, y: 430, cat: 'clickup' },
  { id: 'tasks',                  x: 570, y: 280, cat: 'tasks' },
  { id: 'task_assignees',         x: 810, y: 120, cat: 'junction' },
  { id: 'task_dev_back',          x: 810, y: 250, cat: 'junction' },
  { id: 'task_dev_front',         x: 810, y: 380, cat: 'junction' },
  { id: 'task_tags',              x: 810, y: 500, cat: 'junction' },
  { id: 'task_watchers',          x: 630, y: 500, cat: 'junction' },
  { id: 'task_custom_fields_raw', x: 1000,y: 280, cat: 'junction' },
]

const EDGES = [
  ['user_roles','users'],
  ['sync_config','sync_log'],
  ['sync_config','clickup_lists'],
  ['clickup_lists','tasks'],
  ['clickup_statuses','tasks'],
  ['clickup_users','tasks'],
  ['tasks','task_assignees'],
  ['tasks','task_dev_back'],
  ['tasks','task_dev_front'],
  ['tasks','task_tags'],
  ['tasks','task_watchers'],
  ['tasks','task_custom_fields_raw'],
  ['clickup_users','task_assignees'],
  ['clickup_users','task_dev_back'],
  ['clickup_users','task_dev_front'],
]

const COLUMNS = {
  user_roles:             [['id','INTEGER PK'],['name','VARCHAR NOT NULL'],['description','TEXT'],['permissions','JSONB']],
  users:                  [['id','INTEGER PK'],['email','VARCHAR UNIQUE'],['password_hash','VARCHAR'],['full_name','VARCHAR'],['role_id','FK → user_roles'],['must_change_password','BOOLEAN'],['is_active','BOOLEAN'],['created_at','TIMESTAMPTZ'],['updated_at','TIMESTAMPTZ']],
  app_config:             [['key','VARCHAR PK'],['value','JSONB NOT NULL'],['updated_at','TIMESTAMPTZ']],
  sync_config:            [['id','INTEGER PK'],['project_name','VARCHAR'],['clickup_list_url','VARCHAR'],['clickup_token','VARCHAR'],['sync_interval_minutes','INTEGER'],['is_active','BOOLEAN'],['last_synced_at','TIMESTAMPTZ']],
  sync_log:               [['id','INTEGER PK'],['sync_config_id','FK → sync_config'],['status','VARCHAR'],['tasks_synced','INTEGER'],['tasks_created','INTEGER'],['tasks_updated','INTEGER'],['error_message','TEXT'],['started_at','TIMESTAMPTZ'],['finished_at','TIMESTAMPTZ']],
  clickup_lists:          [['id','VARCHAR PK'],['name','VARCHAR'],['sync_config_id','FK → sync_config']],
  clickup_statuses:       [['id','VARCHAR PK'],['status','VARCHAR'],['color','VARCHAR'],['type','VARCHAR'],['orderindex','INTEGER']],
  clickup_users:          [['id','BIGINT PK'],['username','VARCHAR'],['email','VARCHAR'],['color','VARCHAR'],['profile_picture','VARCHAR']],
  tasks:                  [['id','VARCHAR PK'],['custom_id','VARCHAR'],['custom_item_id','INTEGER'],['name','TEXT'],['text_content','TEXT'],['status_id','FK → clickup_statuses'],['status_name','VARCHAR'],['status_color','VARCHAR'],['status_type','VARCHAR'],['status_orderindex','INTEGER'],['priority','VARCHAR'],['date_created','TIMESTAMPTZ'],['date_updated','TIMESTAMPTZ'],['date_closed','TIMESTAMPTZ'],['date_done','TIMESTAMPTZ'],['archived','BOOLEAN'],['creator_id','FK → clickup_users'],['list_id','FK → clickup_lists'],['orderindex','TEXT'],['programa','VARCHAR'],['lote','VARCHAR'],['prioridade_custom','VARCHAR'],['desenv_back_finalizado','TIMESTAMPTZ'],['desenv_front_finalizado','TIMESTAMPTZ'],['inicio_qa','TIMESTAMPTZ'],['fim_qa','TIMESTAMPTZ'],['inicio_homologacao','TIMESTAMPTZ'],['liberacao_hml_lello','TIMESTAMPTZ'],['bugs_em_aberto','INTEGER'],['bugs_totais','INTEGER'],['previsao_entrega','TIMESTAMPTZ'],['observacoes','TEXT'],['created_at','TIMESTAMPTZ'],['updated_at','TIMESTAMPTZ']],
  task_assignees:         [['task_id','FK → tasks'],['user_id','FK → clickup_users']],
  task_dev_back:          [['task_id','FK → tasks'],['user_id','FK → clickup_users']],
  task_dev_front:         [['task_id','FK → tasks'],['user_id','FK → clickup_users']],
  task_tags:              [['task_id','FK → tasks'],['tag','VARCHAR']],
  task_watchers:          [['task_id','FK → tasks'],['user_id','FK → clickup_users']],
  task_custom_fields_raw: [['id','INTEGER PK'],['task_id','FK → tasks'],['field_id','VARCHAR'],['field_name','VARCHAR'],['field_type','VARCHAR'],['value_text','TEXT'],['value_number','NUMERIC'],['value_date','TIMESTAMPTZ'],['value_json','JSONB']],
}

function nodeById(id) { return NODES.find(n => n.id === id) }

function edgePath(a, b) {
  const na = nodeById(a), nb = nodeById(b)
  const ax = na.x + W, ay = na.y + H / 2
  const bx = nb.x,     by = nb.y + H / 2
  const cx = (ax + bx) / 2
  return `M${ax},${ay} C${cx},${ay} ${cx},${by} ${bx},${by}`
}

export default function AdminDatabase() {
  const [selected, setSelected] = useState(null)

  const sel = selected ? NODES.find(n => n.id === selected) : null
  const selCat = sel ? CATS[sel.cat] : null

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database size={22} className="text-liax-primary" />
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-800">Estrutura do Banco de Dados</h1>
          <p className="text-sm text-slate-500">15 tabelas · clique em um nó para ver as colunas</p>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mb-5">
        {Object.entries(CATS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border"
            style={{ color: v.color, background: v.bg, borderColor: v.border }}>
            <span className="w-2 h-2 rounded-full" style={{ background: v.color }} />
            {v.label}
          </span>
        ))}
      </div>

      <div className="flex gap-5">
        {/* SVG Diagram */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-auto flex-1">
          <svg width={1200} height={580} viewBox="0 0 1200 580">
            <defs>
              <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#cbd5e1" />
              </marker>
            </defs>

            {/* Edges */}
            {EDGES.map(([a, b]) => (
              <path key={`${a}-${b}`} d={edgePath(a, b)}
                fill="none" stroke="#cbd5e1" strokeWidth="1.5"
                strokeDasharray={NODES.find(n=>n.id===b)?.cat==='junction' ? '5,3' : undefined}
                markerEnd="url(#arr)" />
            ))}

            {/* Nodes */}
            {NODES.map(({ id, x, y, cat }) => {
              const c = CATS[cat]
              const isSelected = selected === id
              return (
                <g key={id} style={{ cursor: 'pointer' }} onClick={() => setSelected(id === selected ? null : id)}>
                  <rect x={x} y={y} width={W} height={H} rx={8}
                    fill={isSelected ? c.color : c.bg}
                    stroke={isSelected ? c.color : c.border}
                    strokeWidth={isSelected ? 2 : 1.5} />
                  <circle cx={x + 14} cy={y + H / 2} r={4} fill={isSelected ? 'white' : c.color} />
                  <text x={x + 26} y={y + H / 2 + 5} fontSize={12}
                    fontFamily="ui-monospace,monospace"
                    fill={isSelected ? 'white' : '#1e293b'}
                    fontWeight={isSelected ? '600' : '500'}>
                    {id}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Detail Panel */}
        <div className="w-72 shrink-0">
          {sel ? (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden"
              style={{ borderColor: selCat.border }}>
              <div className="px-4 py-3 border-b" style={{ background: selCat.bg, borderColor: selCat.border }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: selCat.color }}>
                  {selCat.label}
                </p>
                <p className="font-mono font-bold text-slate-800">{sel.id}</p>
                <p className="text-xs text-slate-500 mt-0.5">{COLUMNS[sel.id].length} colunas</p>
              </div>
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {COLUMNS[sel.id].map(([col, type]) => (
                  <div key={col} className="px-4 py-2.5 flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-700">{col}</span>
                    <span className={`text-xs shrink-0 px-1.5 py-0.5 rounded font-medium ${
                      type.includes('PK') ? 'bg-amber-100 text-amber-700' :
                      type.includes('FK') ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-500'}`}>
                      {type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400">
              <Database size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Clique em uma tabela<br/>para ver as colunas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
