import { Loader2 } from 'lucide-react'

export function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200 disabled:opacity-50'
  const variants = {
    primary: 'bg-liax-primary hover:bg-liax-primary-dark text-white',
    secondary: 'bg-liax-bg-light hover:bg-liax-surface-border text-liax-text-dark border border-liax-surface-border',
    danger: 'bg-liax-error hover:bg-red-700 text-white',
    ghost: 'text-liax-neutral hover:bg-liax-bg-light hover:text-liax-text-dark',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}
