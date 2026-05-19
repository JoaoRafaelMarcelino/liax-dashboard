export function Badge({ children, color = '#777' }) {
  const hex = color || '#777'
  const bg = hex + '22'
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: hex, backgroundColor: bg, border: `1px solid ${hex}44` }}
    >
      {children}
    </span>
  )
}

export function TypeBadge({ customItemId }) {
  const map = {
    0: { label: 'Migração', color: '#0074e8' },
    1004: { label: 'Bug', color: '#cc3366' },
    1005: { label: 'Melhoria', color: '#17dd30' },
  }
  const item = map[customItemId] || { label: 'Outro', color: '#777' }
  return <Badge color={item.color}>{item.label}</Badge>
}
