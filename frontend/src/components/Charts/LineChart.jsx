import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { formatWeekWithRange } from '../../utils/dateHelpers'
import InfoTooltip from '../UI/InfoTooltip'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function LineChart({ data = [], labels: customLabels = null, label = '', color = '#0074e8', title, description, tooltip, datasets, headerActions }) {
  const labels = customLabels || data.map((d) => formatWeekWithRange(d.week))
  const singleValues = data.map((d) => d.count)

  const chartData = {
    labels,
    datasets: datasets || [{
      label,
      data: singleValues,
      borderColor: color,
      backgroundColor: color + '22',
      tension: 0.3,
      fill: true,
      pointBackgroundColor: color,
      pointRadius: 4,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: (datasets?.length || 1) > 1 },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } },
    },
  }

  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-6">
      <div className="flex items-start justify-between gap-3 mb-0.5">
        <div className="flex items-center gap-2">
        <h3 className="font-heading font-bold text-liax-text-dark text-base">{title}</h3>
        {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        {headerActions && <div className="shrink-0">{headerActions}</div>}
      </div>
      {description && <p className="text-liax-neutral text-xs mb-4">{description}</p>}
      <div className="h-56">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
