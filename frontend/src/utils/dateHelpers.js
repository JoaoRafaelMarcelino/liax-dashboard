/**
 * Converte string de semana ISO (ex: "2026-W5") para intervalo de datas em PT-BR
 * @param {string} weekStr - Semana no formato "2026-W5"
 * @returns {string} Intervalo no formato "(01/02 a 15/02)"
 */
export function weekToRange(weekStr) {
  if (!weekStr || !weekStr.includes('-W')) return ''
  
  const match = weekStr.match(/(\d+)-W(\d+)/)
  if (!match) return ''
  
  const year = parseInt(match[1], 10)
  const week = parseInt(match[2], 10)
  
  // Calcular primeira e última data da semana (ISO: segunda a domingo)
  const jan1 = new Date(year, 0, 1)
  const dayOfWeek = jan1.getDay() || 7 // Domingo = 7
  const firstMonday = new Date(jan1)
  firstMonday.setDate(jan1.getDate() - (dayOfWeek - 1))
  
  const start = new Date(firstMonday)
  start.setDate(firstMonday.getDate() + (week - 1) * 7)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  
  const format = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  
  return `(${format(start)} a ${format(end)})`
}

/**
 * Formata semana com intervalo: "2026-W5 (01/02 a 15/02)"
 */
export function formatWeekWithRange(weekStr) {
  if (!weekStr) return ''
  const range = weekToRange(weekStr)
  return range ? `${weekStr} ${range}` : weekStr
}
