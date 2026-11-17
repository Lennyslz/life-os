import { pad } from './dates'

// Estados de sesión que suman tiempo de estudio.
export const COUNTED = ['completed', 'ended_early']
export const STATUS_LABEL = { completed: 'Completada', ended_early: 'Finalizada antes' }

// Segundos → "2 h 5 min", "25 min" o "40 s".
export function fmtDuration(sec) {
  const t = Math.max(0, Math.round(sec))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  if (h) return `${h} h ${m} min`
  if (m) return `${m} min`
  return `${t} s`
}

// Milisegundos → "MM:SS" o "H:MM:SS" (redondea hacia arriba: muestra 00:01 hasta llegar a cero).
export function fmtClock(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(t % 60)}` : `${pad(m)}:${pad(t % 60)}`
}

// Lunes 00:00 (hora local) de la semana de `d`.
export function weekStart(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

// Todas las cifras se derivan de los registros guardados (segundos).
export function computeStats(sessions, now = new Date()) {
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startWeek = weekStart(now).getTime()
  const out = { total: 0, today: 0, week: 0, count: 0, byCourse: {} }
  for (const s of sessions) {
    if (!COUNTED.includes(s.status)) continue
    const end = new Date(s.ended_at).getTime()
    const d = Number(s.duration_seconds) || 0
    out.total += d
    out.count += 1
    if (end >= startToday) out.today += d
    if (end >= startWeek) out.week += d
    const c = (out.byCourse[s.course_id] ||= { seconds: 0, count: 0 })
    c.seconds += d
    c.count += 1
  }
  return out
}

export function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    ;[0, 0.35].forEach((delay) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 880
      const t = ctx.currentTime + delay
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
      o.start(t); o.stop(t + 0.32)
    })
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(200)
  } catch { /* el aviso visual sigue funcionando */ }
}
