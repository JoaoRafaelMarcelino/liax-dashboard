import { Info } from 'lucide-react'

export default function InfoTooltip({ text, size = 14 }) {
  return (
    <div className="relative group inline-flex items-center">
      <Info size={size} className="text-liax-neutral opacity-50 hover:opacity-80 cursor-help transition-opacity" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 max-w-xs w-max shadow-xl leading-relaxed text-center">
          {text}
        </div>
        <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
      </div>
    </div>
  )
}
