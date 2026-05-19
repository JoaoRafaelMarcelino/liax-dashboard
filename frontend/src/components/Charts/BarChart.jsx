import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import InfoTooltip from '../UI/InfoTooltip'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const PALETTE = ['#0074e8','#17dd30','#fcb900','#cc3366','#7adcb4','#1c3775','#ff6900','#363063']

export default function BarChart({ data = [], nameKey = 'name', valueKey = 'count', horizontal = false, title, description, color, tooltip }) {
  const labels = data.map((d) => d[nameKey])
  const values = data.map((d) => d[valueKey])
  const colors = color ? Array(data.length).fill(color) : data.map((_, i) => PALETTE[i % PALETTE.length])

  const chartData = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderRadius: 6,
      borderSkipped: false,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: horizontal
      ? {
          x: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } },
          y: { grid: { display: false } },
        }
      : {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 35,
              minRotation: 20,
              font: { size: 11 },
            },
          },
          y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } },
        },
  }

  const chartHeight = horizontal
    ? Math.max(180, data.length * 36)
    : Math.max(220, 180)

  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-6">
      <div className="flex items-center gap-2 mb-0.5">
        <h3 className="font-heading font-bold text-liax-text-dark text-base">{title}</h3>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      {description && <p className="text-liax-neutral text-xs mb-4">{description}</p>}
      <div style={{ height: chartHeight }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
