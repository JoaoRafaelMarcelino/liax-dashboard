import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import InfoTooltip from '../UI/InfoTooltip'

ChartJS.register(ArcElement, Tooltip, Legend)

const PALETTE = ['#0074e8','#17dd30','#fcb900','#cc3366','#7adcb4','#1c3775','#ff6900','#363063','#1669f0','#00c100']

export default function DoughnutChart({ data = [], title, description, tooltip }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-liax-xl p-6">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-heading font-bold text-liax-text-dark text-base">{title}</h3>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        {description && <p className="text-liax-neutral text-xs mb-4">{description}</p>}
        <div className="h-64 flex items-center justify-center text-liax-neutral text-sm">
          Sem dados para exibir
        </div>
      </div>
    )
  }

  const labels = data.map((d) => d.status || d.name)
  const values = data.map((d) => d.count || d.value)
  const colors = data.map((d, i) => d.color || PALETTE[i % PALETTE.length])

  const chartData = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } },
      tooltip: { mode: 'index', bodyFont: { size: 11 }, titleFont: { size: 12 } },
    },
    cutout: '60%',
    layout: { padding: 10 },
  }

  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-6">
      <div className="flex items-center gap-2 mb-0.5">
        <h3 className="font-heading font-bold text-liax-text-dark text-base">{title}</h3>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      {description && <p className="text-liax-neutral text-xs mb-4">{description}</p>}
      <div className="h-72">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  )
}
