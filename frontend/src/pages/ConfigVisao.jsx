import { useState, useEffect } from 'react'
import { configAPI } from '../services/api'
import { useAppConfig } from '../context/AppConfigContext'
import { AVAILABLE_CHARTS } from '../utils/dashboardConfig'
import InfoTooltip from '../components/UI/InfoTooltip'
import {
  Plus, Trash2, Save, ChevronUp, ChevronDown, Loader2,
  LayoutDashboard,
} from 'lucide-react'

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-liax-primary/10 flex items-center justify-center">
        <Icon size={18} className="text-liax-primary" />
      </div>
      <div>
        <h2 className="font-heading font-bold text-liax-text-dark text-base">{title}</h2>
        {subtitle && <p className="text-xs text-liax-neutral">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function ConfigVisao() {
  const { reload } = useAppConfig()
  const [tabs, setTabs] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    configAPI.get('vision_tabs').then(r => {
      setTabs(r.data.value || [])
    }).finally(() => setLoading(false))
  }, [])

  function addTab() {
    const id = `tab_${Date.now()}`
    setTabs(prev => [...prev, { id, name: 'Nova Aba', charts: [] }])
  }

  function removeTab(id) {
    setTabs(prev => prev.filter(t => t.id !== id))
  }

  function renameTab(id, name) {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, name } : t))
  }

  function toggleChart(tabId, chartKey) {
    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t
      const has = t.charts.includes(chartKey)
      return { ...t, charts: has ? t.charts.filter(c => c !== chartKey) : [...t.charts, chartKey] }
    }))
  }

  function moveTab(idx, dir) {
    setTabs(prev => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await configAPI.set('vision_tabs', tabs)
      reload()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-liax-primary" size={32} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-liax-text-dark mb-1">Configuração da Visão Geral</h1>
          <p className="text-liax-neutral text-sm">Crie abas e escolha quais gráficos e relatórios aparecerão em cada uma na tela Visão Geral.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-liax-primary text-white rounded-xl font-semibold text-sm hover:bg-liax-primary-dark transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? 'Salvo!' : 'Salvar tudo'}
        </button>
      </div>

      {/* SECTION 1 — TABS */}
      <div className="bg-white rounded-2xl shadow-liax-xl p-6 mb-6">
        <SectionTitle
          icon={LayoutDashboard}
          title="Abas da Visão Geral"
          subtitle="Crie abas e escolha quais gráficos aparecerão em cada uma"
        />

        <div className="space-y-4">
          {tabs.map((tab, idx) => (
            <div key={tab.id} className="border border-liax-surface-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-liax-bg-light">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveTab(idx, -1)} disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-white disabled:opacity-30 transition-colors">
                    <ChevronUp size={14} className="text-liax-neutral" />
                  </button>
                  <button onClick={() => moveTab(idx, 1)} disabled={idx === tabs.length - 1}
                    className="p-0.5 rounded hover:bg-white disabled:opacity-30 transition-colors">
                    <ChevronDown size={14} className="text-liax-neutral" />
                  </button>
                </div>
                <span className="text-xs font-bold text-liax-neutral w-5">{idx + 1}</span>
                <input
                  value={tab.name}
                  onChange={e => renameTab(tab.id, e.target.value)}
                  className="flex-1 bg-white border border-liax-surface-border rounded-lg px-3 py-1.5 text-sm font-semibold text-liax-text-dark focus:outline-none focus:border-liax-primary"
                />
                <span className="text-xs text-liax-neutral">{tab.charts.length} gráfico{tab.charts.length !== 1 ? 's' : ''}</span>
                <button onClick={() => removeTab(tab.id)}
                  className="p-1.5 rounded-lg text-liax-neutral hover:text-liax-error hover:bg-red-50 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="p-4">
                <p className="text-xs font-semibold text-liax-neutral uppercase tracking-wide mb-3">Gráficos e Relatórios</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {AVAILABLE_CHARTS.map(chart => (
                    <label key={chart.key}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-liax-bg-light cursor-pointer transition-colors border border-transparent hover:border-liax-surface-border">
                      <input
                        type="checkbox"
                        checked={tab.charts.includes(chart.key)}
                        onChange={() => toggleChart(tab.id, chart.key)}
                        className="mt-0.5 accent-liax-primary w-4 h-4 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-liax-text-dark leading-tight">{chart.label}</p>
                          {chart.tooltip && <InfoTooltip text={chart.tooltip} size={12} />}
                        </div>
                        <p className="text-xs text-liax-neutral">{chart.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addTab}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-liax-surface-border text-liax-neutral hover:border-liax-primary hover:text-liax-primary text-sm font-medium transition-colors w-full justify-center"
        >
          <Plus size={16} />
          Nova Aba
        </button>
      </div>

    </div>
  )
}
