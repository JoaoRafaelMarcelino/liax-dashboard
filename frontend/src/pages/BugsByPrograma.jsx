import { useState, useEffect } from 'react'
import { dashboardAPI } from '../services/api'
import { readCache, writeCache } from '../utils/cache'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bug, Loader2, BarChart2, RotateCcw } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function BugsByPrograma() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [topN, setTopN] = useState(20)

  useEffect(() => {
    const CACHE_KEY = 'bugs_by_programa'
    const cached = readCache(CACHE_KEY)
    if (cached) {
      setData(cached)
      setLoading(false)
      setRefreshing(true)
    }
    dashboardAPI.bugsByPrograma()
      .then(r => {
        setData(r.data)
        writeCache(CACHE_KEY, r.data)
      })
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [])

  const sliced = data.slice(0, topN)

  const chartData = {
    labels: sliced.map(d => d.programa),
    datasets: [
      { label: 'QA', data: sliced.map(d => d.qa), backgroundColor: '#3b82f6cc', borderRadius: 4, borderSkipped: false },
      { label: 'Homologação', data: sliced.map(d => d.homologacao), backgroundColor: '#f97316cc', borderRadius: 4, borderSkipped: false },
      { label: 'Produção', data: sliced.map(d => d.producao), backgroundColor: '#ef4444cc', borderRadius: 4, borderSkipped: false },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { stacked: true, beginAtZero: true, grid: { color: '#f4f4f5' }, ticks: { stepSize: 1 } },
      y: { stacked: true, grid: { display: false }, ticks: { font: { family: 'ui-monospace, monospace', size: 11 } } },
    },
  }

  const totalQA = data.reduce((s, d) => s + d.qa, 0)
  const totalHml = data.reduce((s, d) => s + d.homologacao, 0)
  const totalProd = data.reduce((s, d) => s + d.producao, 0)
  const totalBugs = totalQA + totalHml + totalProd

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Bug size={22} className="text-red-500" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-2xl text-liax-text-dark">Bugs por Programa</h1>
            {refreshing && <Loader2 size={14} className="animate-spin text-liax-neutral" />}
          </div>
          <p className="text-liax-neutral text-sm">Distribuição por ambiente: QA · Homologação · Produção</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6 mb-6">
        {[
          { label: 'Total de Bugs', value: totalBugs, bg: 'bg-slate-50', color: 'text-slate-700' },
          { label: 'QA', value: totalQA, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Homologação', value: totalHml, bg: 'bg-orange-50', color: 'text-orange-500' },
          { label: 'Produção', value: totalProd, bg: 'bg-red-50', color: 'text-red-600' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl shadow-liax-xl p-5`}>
            <p className="text-xs text-liax-neutral">{c.label}</p>
            <p className={`text-3xl font-heading font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-liax-primary" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-white rounded-2xl shadow-liax-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-liax-text-dark">Ranking por Programa</h3>
                <p className="text-xs text-liax-neutral mt-0.5">QA · Homologação · Produção (empilhado)</p>
              </div>
              <select value={topN} onChange={e => setTopN(Number(e.target.value))}
                className="liax-input py-1.5 text-xs w-auto">
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
                <option value={9999}>Todos</option>
              </select>
            </div>
            <div style={{ height: Math.max(300, sliced.length * 28) }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-liax-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-liax-surface-border">
              <h3 className="font-heading font-bold text-liax-text-dark text-sm">Detalhe por Programa</h3>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: Math.max(300, sliced.length * 30) + 40 }}>
              <table className="w-full text-xs">
                <thead className="bg-liax-bg-light sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-liax-neutral">Programa</th>
                    <th className="px-2 py-2 text-right font-semibold text-blue-500">QA</th>
                    <th className="px-2 py-2 text-right font-semibold text-orange-500">HML</th>
                    <th className="px-2 py-2 text-right font-semibold text-red-500">Prod</th>
                    <th className="px-2 py-2 text-right font-semibold text-liax-neutral">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-liax-surface-border">
                  {sliced.map((row, i) => (
                    <tr key={row.programa} className="hover:bg-liax-bg-light">
                      <td className="px-3 py-2 font-mono font-medium text-liax-text-dark">
                        <span className="text-liax-neutral mr-1">{i + 1}.</span>{row.programa}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-blue-600">{row.qa || '—'}</td>
                      <td className="px-2 py-2 text-right font-bold text-orange-500">{row.homologacao || '—'}</td>
                      <td className="px-2 py-2 text-right font-bold text-red-600">{row.producao || '—'}</td>
                      <td className="px-2 py-2 text-right font-bold text-liax-text-dark">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
