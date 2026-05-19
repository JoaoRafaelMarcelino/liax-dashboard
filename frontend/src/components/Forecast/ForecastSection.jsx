import { useState, useMemo } from 'react'
import { CalendarClock, Target, TrendingUp, Clock, ChevronRight, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import InfoTooltip from '../UI/InfoTooltip'

function addWorkdays(startDate, days) {
  const d = new Date(startDate)
  let remaining = Math.ceil(days)
  while (remaining > 0) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) remaining--
  }
  return d
}

function workdaysBetween(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  if (e <= s) return 0
  let count = 0
  const d = new Date(s)
  while (d < e) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}

function fmtDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}

function PhaseRow({ label, current, required, unit = 'd' }) {
  const ratio = current > 0 ? required / current : 0
  const ok = required >= current
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-liax-neutral w-36 shrink-0">{label}</span>
      <div className="flex items-center gap-3 flex-1 justify-end">
        <span className="text-sm text-liax-neutral">{current != null ? `${current}${unit} atual` : '—'}</span>
        <ChevronRight size={14} className="text-gray-300 shrink-0" />
        <span className={`text-sm font-semibold ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
          {required != null ? `${required}${unit} necessário` : '—'}
        </span>
        {!ok && current != null && (
          <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full">
            -{Math.round((1 - ratio) * 100)}%
          </span>
        )}
        {ok && current != null && (
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ok</span>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, sub, color = 'text-liax-text-dark', tooltip }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-liax-neutral">{label}</span>
        {tooltip && <InfoTooltip text={tooltip} size={12} />}
      </div>
      <div className="text-right">
        <span className={`text-sm font-semibold ${color}`}>{value}</span>
        {sub && <p className="text-xs text-liax-neutral mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function ForecastSection({ forecastData, migrationTime }) {
  const [mode, setMode] = useState('date')
  const [targetDate, setTargetDate] = useState('')
  const [useWorked, setUseWorked] = useState(false)

  const pending = forecastData?.pending_migrations ?? 0
  const throughput = forecastData?.avg_weekly_throughput ?? 0
  const totalMig = forecastData?.total_migrations ?? 0
  const completedMig = forecastData?.completed_migrations ?? 0

  const mt = migrationTime || {}
  const totalDev   = mt.dev?.average ?? null
  const totalQa    = mt.qa?.average ?? null
  const totalHml   = mt.hml?.average ?? null
  const totalProd  = mt.prod?.average ?? null
  const totalFlow  = mt.total?.average ?? null

  const workedDev  = mt.dev?.average_worked ?? null
  const workedQa   = mt.qa?.average_worked ?? null
  const workedHml  = mt.hml?.average_worked ?? null
  const workedProd = mt.prod?.average_worked ?? null
  const workedFlow = mt.total?.average_worked ?? null

  const avgDev   = useWorked ? (workedDev  ?? totalDev)   : totalDev
  const avgQa    = useWorked ? (workedQa   ?? totalQa)    : totalQa
  const avgHml   = useWorked ? (workedHml  ?? totalHml)   : totalHml
  const avgProd  = useWorked ? (workedProd ?? totalProd)  : totalProd
  const avgTotal = useWorked ? (workedFlow ?? totalFlow)  : totalFlow

  const hasWorkedData = workedDev != null || workedQa != null || workedFlow != null

  const idleMultiplier = (useWorked && totalFlow && workedFlow && workedFlow > 0)
    ? totalFlow / workedFlow
    : 1

  const effectiveThroughput = useWorked
    ? Math.round(throughput * idleMultiplier * 100) / 100
    : throughput

  const forecastMode1 = useMemo(() => {
    if (!effectiveThroughput || effectiveThroughput <= 0 || !pending) return null
    const weeksNeeded = pending / effectiveThroughput
    const workdaysNeeded = weeksNeeded * 5
    const endDate = addWorkdays(new Date(), workdaysNeeded)
    const optimisticDate = addWorkdays(new Date(), (pending / (effectiveThroughput * 1.25)) * 5)
    const conservativeDate = addWorkdays(new Date(), (pending / (effectiveThroughput * 0.75)) * 5)
    return { endDate, optimisticDate, conservativeDate, weeksNeeded: Math.ceil(weeksNeeded) }
  }, [effectiveThroughput, pending])

  const forecastMode2 = useMemo(() => {
    if (!targetDate || !pending) return null
    const today = new Date()
    const target = new Date(targetDate + 'T12:00:00')
    const wdays = workdaysBetween(today, target)
    if (wdays <= 0) return null
    const weeksRemaining = wdays / 5
    const neededPerWeek = pending / weeksRemaining
    const neededPerMonth = neededPerWeek * 4.33

    const speedup = effectiveThroughput > 0 ? neededPerWeek / effectiveThroughput : null
    const requiredTotal = (avgTotal && speedup) ? Math.round(avgTotal / speedup) : null
    const requiredDev   = (avgDev   && speedup) ? Math.round(avgDev   / speedup) : null
    const requiredQa    = (avgQa    && speedup) ? Math.round(avgQa    / speedup) : null
    const requiredHml   = (avgHml   && speedup) ? Math.round(avgHml   / speedup) : null
    const requiredProd  = (avgProd  && speedup) ? Math.round(avgProd  / speedup) : null

    const feasible = speedup ? speedup <= 1.5 : null

    return {
      wdays,
      weeksRemaining: Math.round(weeksRemaining * 10) / 10,
      neededPerWeek: Math.ceil(neededPerWeek * 10) / 10,
      neededPerMonth: Math.ceil(neededPerMonth),
      speedup: speedup ? Math.round(speedup * 100) / 100 : null,
      requiredTotal, requiredDev, requiredQa, requiredHml, requiredProd,
      feasible,
    }
  }, [targetDate, pending, effectiveThroughput, avgTotal, avgDev, avgQa, avgHml, avgProd])

  const progressPct = totalMig > 0 ? Math.round((completedMig / totalMig) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-semibold text-liax-text-dark">Previsão de Entrega</h2>
          <InfoTooltip text="Projeções baseadas no throughput atual: migrações com aprovação de homologação (aprovacao_hml_lello) nas últimas 12 semanas. Médias de tempo por fase são usadas para análise de capacidade." />
        </div>
        {hasWorkedData && (
          <button
            onClick={() => setUseWorked(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${useWorked ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-liax-neutral hover:border-gray-300'}`}
          >
            <Clock size={12} />
            {useWorked ? 'Usando: dias trabalhados' : 'Usar dias trabalhados'}
          </button>
        )}
      </div>
      <p className="text-liax-neutral text-sm mb-4">
        Critério de conclusão: <span className="font-semibold text-liax-text-dark">aprovação de homologação</span>
        {' · '}{useWorked ? 'base: dias trabalhados' : 'base: dias totais corridos'}
      </p>

      {/* Progress bar global */}
      <div className="bg-white rounded-2xl shadow-liax-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-liax-text-dark">Progresso — Aprovação de Homologação</span>
          <span className="text-sm font-bold text-liax-primary">{progressPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-3">
          <div className="h-full rounded-full bg-liax-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-liax-neutral">Com aprovação HML: <span className="font-semibold text-liax-text-dark">{completedMig}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-amber-500" />
            <span className="text-liax-neutral">Aguardando HML: <span className="font-semibold text-liax-text-dark">{pending}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-blue-500" />
            <span className="text-liax-neutral">Ritmo atual: <span className="font-semibold text-liax-text-dark">{throughput}/semana</span></span>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('date')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'date' ? 'bg-liax-primary text-white shadow-sm' : 'bg-white text-liax-neutral hover:bg-liax-bg-light shadow-liax-xl'}`}
        >
          <CalendarClock size={15} />
          Quando vamos terminar?
        </button>
        <button
          onClick={() => setMode('target')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'target' ? 'bg-liax-primary text-white shadow-sm' : 'bg-white text-liax-neutral hover:bg-liax-bg-light shadow-liax-xl'}`}
        >
          <Target size={15} />
          O que preciso para terminar em...
        </button>
      </div>

      {/* MODE 1 — Forecast end date */}
      {mode === 'date' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-liax-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <CalendarClock size={15} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-heading font-bold text-liax-text-dark text-sm">Previsão de Conclusão</p>
                <p className="text-xs text-liax-neutral">Mantendo o ritmo atual</p>
              </div>
            </div>
            {!forecastMode1 ? (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle size={14} />
                Sem dados de throughput suficientes (últimas 12 semanas)
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-xs text-liax-neutral mb-0.5">
                    Data estimada para aprovação HML ({useWorked ? 'eliminando ocioso' : 'ritmo atual'})
                  </p>
                  <p className="text-2xl font-heading font-bold text-liax-primary">{fmtDate(forecastMode1.endDate)}</p>
                  <p className="text-xs text-liax-neutral mt-0.5">≈ {forecastMode1.weeksNeeded} semanas úteis restantes</p>
                  {useWorked && idleMultiplier > 1 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                      <TrendingUp size={11} />
                      Throughput efetivo: <strong>{effectiveThroughput}/sem</strong>
                      <span className="text-emerald-500">(×{Math.round(idleMultiplier * 10) / 10} vs {throughput}/sem atual)</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <InfoRow
                    label="Cenário otimista (+25% ritmo)"
                    value={fmtDate(forecastMode1.optimisticDate)}
                    color="text-emerald-600"
                    tooltip="Considera o throughput atual aumentado em 25%."
                  />
                  <InfoRow
                    label="Cenário conservador (-25% ritmo)"
                    value={fmtDate(forecastMode1.conservativeDate)}
                    color="text-red-500"
                    tooltip="Considera o throughput atual reduzido em 25%, refletindo possíveis imprevistos."
                  />
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-liax-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Clock size={15} className="text-blue-600" />
              </div>
              <div>
                <p className="font-heading font-bold text-liax-text-dark text-sm">Tempos Médios Atuais por Fase</p>
                <p className="text-xs text-liax-neutral">{useWorked ? 'Dias trabalhados (em uso)' : 'Dias totais (corridos)'}</p>
              </div>
            </div>
            <div>
              <InfoRow label="Desenvolvimento"
                value={avgDev != null ? `${avgDev}d` : '—'}
                sub={!useWorked && workedDev != null ? `${workedDev}d trabalhados` : useWorked && totalDev != null ? `${totalDev}d total` : undefined}
                tooltip="Total: back_inicio → front_finalizado. Trabalhado: soma back + front." />
              <InfoRow label="QA"
                value={avgQa != null ? `${avgQa}d` : '—'}
                sub={!useWorked && workedQa != null ? `${workedQa}d trabalhados` : useWorked && totalQa != null ? `${totalQa}d total` : undefined}
                tooltip="Total: qa_inicio → qa_finalizado. Trabalhado: QA + reteste." />
              <InfoRow label="Homologação"
                value={avgHml != null ? `${avgHml}d` : '—'}
                tooltip="liberacao_hml_lello → aprovacao_hml_lello. Fase única: total = trabalhado." />
              <InfoRow label="Produção"
                value={avgProd != null ? `${avgProd}d` : '—'}
                tooltip="aplicacao_producao → aprovacao_prod_lello. Fase única: total = trabalhado." />
              <InfoRow label="Fluxo total"
                value={avgTotal != null ? `${avgTotal}d` : '—'}
                sub={!useWorked && workedFlow != null ? `${workedFlow}d trabalhados` : useWorked && totalFlow != null ? `${totalFlow}d total` : undefined}
                color="text-indigo-600"
                tooltip="Total corrido do primeiro commit à aprovação em produção." />
            </div>
          </div>
        </div>
      )}

      {/* MODE 2 — Required to meet target date */}
      {mode === 'target' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-liax-xl p-6">
            <label className="block text-sm font-semibold text-liax-text-dark mb-2">Data alvo de entrega</label>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="liax-input py-2 text-sm w-52"
              />
              {targetDate && forecastMode2 && (
                <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${forecastMode2.feasible === false ? 'bg-red-50 text-red-600' : forecastMode2.feasible === true ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {forecastMode2.feasible === false ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                  {forecastMode2.feasible === false ? 'Meta desafiadora (acima de 1.5× ritmo atual)' : forecastMode2.feasible === true ? 'Meta atingível' : 'Meta moderada'}
                </span>
              )}
            </div>
          </div>

          {targetDate && forecastMode2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-liax-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Target size={15} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-liax-text-dark text-sm">Volume necessário</p>
                    <p className="text-xs text-liax-neutral">{forecastMode2.wdays} dias úteis restantes ({forecastMode2.weeksRemaining} semanas)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-violet-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-heading font-bold text-violet-700">{forecastMode2.neededPerWeek}</p>
                    <p className="text-xs text-violet-600 mt-1">migrações / semana</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-heading font-bold text-indigo-700">{forecastMode2.neededPerMonth}</p>
                    <p className="text-xs text-indigo-600 mt-1">migrações / mês</p>
                  </div>
                </div>
                {forecastMode2.speedup && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${forecastMode2.speedup > 1 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    <Info size={14} className="shrink-0" />
                    {forecastMode2.speedup > 1
                      ? `Requer ${forecastMode2.speedup}× o ritmo de referência (${effectiveThroughput}/semana${useWorked && idleMultiplier > 1 ? ' efetivo' : ''})`
                      : `Dentro do ritmo de referência — ${forecastMode2.speedup}× necessário`}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-liax-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock size={15} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-liax-text-dark text-sm">Tempo médio por fase necessário</p>
                    <p className="text-xs text-liax-neutral">Base: {useWorked ? 'dias trabalhados' : 'dias totais'} · mesma equipe</p>
                  </div>
                  <InfoTooltip text="Calculado pela Lei de Little: se o ritmo precisa aumentar X vezes mantendo o mesmo WIP (volume em andamento), o tempo de cada fase precisa ser X vezes menor." size={12} />
                </div>
                <PhaseRow label="Desenvolvimento" current={avgDev} required={forecastMode2.requiredDev} />
                <PhaseRow label="QA" current={avgQa} required={forecastMode2.requiredQa} />
                <PhaseRow label="Homologação" current={avgHml} required={forecastMode2.requiredHml} />
                <PhaseRow label="Produção" current={avgProd} required={forecastMode2.requiredProd} />
                <PhaseRow label="Fluxo total" current={avgTotal} required={forecastMode2.requiredTotal} />
              </div>
            </div>
          )}

          {targetDate && !forecastMode2 && (
            <div className="bg-white rounded-2xl shadow-liax-xl p-6 flex items-center gap-3 text-amber-600">
              <AlertTriangle size={18} />
              <span className="text-sm">A data selecionada deve ser posterior a hoje.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
