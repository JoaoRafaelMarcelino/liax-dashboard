import { Check, AlertTriangle } from 'lucide-react'

export function AlertModal({ title, message, onClose, actionLabel = 'OK' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-liax-card p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Check className="text-liax-primary" size={22} />
        </div>
        <h3 className="font-heading font-bold text-liax-text-dark text-lg mb-2">{title}</h3>
        {message && <p className="text-liax-neutral text-sm mb-6 whitespace-pre-line">{message}</p>}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-liax-primary text-white hover:bg-liax-primary-dark transition-colors"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

export function ConfirmModal({
  title,
  message,
  onConfirm,
  onClose,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-liax-card p-8 max-w-sm w-full text-center">
        <div className={`w-12 h-12 ${danger ? 'bg-red-100' : 'bg-amber-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          <AlertTriangle className={danger ? 'text-liax-error' : 'text-amber-600'} size={22} />
        </div>
        <h3 className="font-heading font-bold text-liax-text-dark text-lg mb-2">{title}</h3>
        {message && <p className="text-liax-neutral text-sm mb-6 whitespace-pre-line">{message}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-liax-bg-light text-liax-neutral hover:bg-liax-surface-border transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${danger ? 'bg-liax-error hover:bg-red-700' : 'bg-liax-primary hover:bg-liax-primary-dark'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
