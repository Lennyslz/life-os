import { daysInMonth, pad } from './dates'

// Orden visual lunes → domingo; valor = Date#getDay()
export const WEEKDAYS = [
  { dow: 1, short: 'L', name: 'Lunes' },
  { dow: 2, short: 'M', name: 'Martes' },
  { dow: 3, short: 'X', name: 'Miércoles' },
  { dow: 4, short: 'J', name: 'Jueves' },
  { dow: 5, short: 'V', name: 'Viernes' },
  { dow: 6, short: 'S', name: 'Sábado' },
  { dow: 0, short: 'D', name: 'Domingo' },
]

/**
 * Cumplimiento = días objetivo completados / días objetivo transcurridos × 100.
 * - Solo cuentan los días programados (schedule_days).
 * - Días futuros: no cuentan.
 * - Hoy: cuenta solo si ya está completado (no penaliza mientras el día sigue en curso).
 * - Sin días objetivo transcurridos → pct = null (estado neutral, sin dividir entre 0).
 */
export function monthStats(habit, doneDates, year, month, todayStr) {
  const sched = new Set(habit.schedule_days)
  let target = 0
  let done = 0
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    const iso = `${year}-${pad(month + 1)}-${pad(d)}`
    if (iso > todayStr) break
    if (!sched.has(new Date(year, month, d).getDay())) continue
    const isDone = doneDates.has(iso)
    if (iso < todayStr || isDone) {
      target++
      if (isDone) done++
    }
  }
  return { target, done, pct: target ? Math.round((done / target) * 100) : null }
}

// Promedio simple de los hábitos que ya tienen días objetivo.
export function globalPct(statsList) {
  const vals = statsList.map((s) => s.pct).filter((p) => p !== null)
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

export const DEFAULT_HABITS = [
  { name: 'Ir al gimnasio', schedule_days: [1, 2, 4, 5] },
  { name: 'Leer la Biblia', schedule_days: [0, 1, 2, 3, 4, 5, 6] },
]
