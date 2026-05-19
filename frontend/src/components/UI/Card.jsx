import InfoTooltip from './InfoTooltip'

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-liax-xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'text-liax-primary', bg = 'bg-blue-50', tooltip }) {
  return (
    <div className="bg-white rounded-2xl shadow-liax-xl p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`${color}`} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-liax-neutral text-sm font-medium">{title}</p>
          {tooltip && <InfoTooltip text={tooltip} size={12} />}
        </div>
        <p className="text-liax-text-dark text-2xl font-heading font-bold leading-tight">{value ?? '—'}</p>
        {subtitle && <p className="text-liax-neutral text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
