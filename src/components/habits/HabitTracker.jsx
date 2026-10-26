import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import Card, { Notice } from '../ui/Card'
import Editable from '../ui/Editable'
import { capitalize, daysInMonth, pad, todayISO } from '../../utils/dates'
import { WEEKDAYS, globalPct, monthStats } from '../../utils/habits'
import { field, btn } from '../../utils/ui'

// Calendario mensual de un hábito: columnas = lunes…domingo, filas = semanas.
function HabitCalendar({ habit, year, month, logIds, today, onToggle }) {
  const sched = new Set(habit.schedule_days)
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-faint" aria-hidden>
        {WEEKDAYS.map((w) => <span key={w.dow}>{w.short}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }, (_, i) => <span key={`o${i}`} />)}
        {Array.from({ length: daysInMonth(year, month) }, (_, i) => {
          const d = i + 1
          const iso = `${year}-${pad(month + 1)}-${pad(d)}`
          const done = Boolean(logIds[iso])
          const future = iso > today
          const planned = sched.has(new Date(year, month, d).getDay())
          const style = done ? 'border-accent bg-accent font-semibold text-bg'
            : future ? 'border-transparent text-faint/50'
            : planned ? 'border-line bg-raised text-mute hover:border-accent hover:text-ink'
            : 'border-dashed border-line text-faint hover:border-accent'
          return (
            <button key={iso} disabled={future} onClick={() => onToggle(habit, iso)} aria-pressed={done}
              aria-label={`${habit.name}, día ${d}${done ? ', completado' : ''}`}
              title={planned ? undefined : 'Día de descanso'}
              className={`aspect-square rounded-lg border text-xs transition-colors ${style} ${iso === today ? 'ring-1 ring-ink ring-offset-2 ring-offset-surface' : ''}`}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function HabitTracker({ habits, logs }) {
  const now = new Date()
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [newName, setNewName] = useState('')
  const today = todayISO()

  const byHabit = useMemo(() => {
    const map = {}
    logs.rows.forEach((l) => { (map[l.habit_id] ||= {})[l.log_date] = l.id })
    return map
  }, [logs.rows])

  const shift = (n) => setCursor(({ y, m }) => {
    const d = new Date(y, m + n, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const toggle = (habit, iso) => {
    const id = byHabit[habit.id]?.[iso]
    if (id) logs.remove(id)
    else logs.add({ habit_id: habit.id, log_date: iso })
  }
  const toggleDay = (habit, dow) => {
    const has = habit.schedule_days.includes(dow)
    if (has && habit.schedule_days.length === 1) return
    habits.update(habit.id, { schedule_days: has ? habit.schedule_days.filter((x) => x !== dow) : [...habit.schedule_days, dow].sort() })
  }
  const removeHabit = (h) => {
    if (window.confirm(`¿Eliminar «${h.name}» y todo su historial?`)) habits.remove(h.id, 'Hábito eliminado')
  }
  const addHabit = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    habits.add({ name, schedule_days: [0, 1, 2, 3, 4, 5, 6] }, 'Hábito creado')
    setNewName('')
  }

  const stats = habits.rows.map((h) => monthStats(h, new Set(Object.keys(byHabit[h.id] || {})), cursor.y, cursor.m, today))
  const overall = globalPct(stats)
  const label = capitalize(new Date(cursor.y, cursor.m, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' }))

  const nav = (
    <div className="flex items-center gap-1">
      <button onClick={() => shift(-1)} aria-label="Mes anterior" className="rounded-md p-1 text-mute hover:text-ink"><ChevronLeft size={18} /></button>
      <span className="min-w-32 text-center text-sm">{label}</span>
      <button onClick={() => shift(1)} aria-label="Mes siguiente" className="rounded-md p-1 text-mute hover:text-ink"><ChevronRight size={18} /></button>
    </div>
  )

  return (
    <Card title="Hábitos" action={nav}>
      {habits.loading || logs.loading ? <Notice>Cargando hábitos…</Notice>
        : habits.error || logs.error ? <Notice onRetry={() => { habits.reload(); logs.reload() }}>No se pudieron cargar los hábitos: {habits.error || logs.error}</Notice>
        : (
        <>
          <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-line pb-4">
            <span className="text-sm text-mute">Cumplimiento de hábitos este mes</span>
            <span className="text-2xl font-semibold tabular-nums">{overall === null ? '—' : `${overall}%`}</span>
          </div>

          <div className="grid gap-x-8 gap-y-8 md:grid-cols-2">
            {habits.rows.map((h, i) => {
              const s = stats[i]
              return (
                <div key={h.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Editable value={h.name} onSave={(name) => habits.update(h.id, { name })} aria-label="Nombre del hábito" className="text-sm font-medium" />
                      <p className="mt-0.5 px-1.5 text-xs text-mute">
                        {s.pct === null ? 'Aún sin días objetivo transcurridos' : `${s.done} de ${s.target} días objetivo`}
                      </p>
                    </div>
                    <span className="text-lg font-semibold tabular-nums">{s.pct === null ? '—' : `${s.pct}%`}</span>
                    <button onClick={() => removeHabit(h)} aria-label={`Eliminar ${h.name}`} className="p-1 text-faint hover:text-danger"><Trash2 size={15} /></button>
                  </div>

                  <div className="my-3 flex flex-wrap items-center gap-1" role="group" aria-label={`Días objetivo de ${h.name}`}>
                    <span className="mr-1 text-xs text-mute">Días objetivo</span>
                    {WEEKDAYS.map((w) => (
                      <button key={w.dow} onClick={() => toggleDay(h, w.dow)} title={w.name} aria-pressed={h.schedule_days.includes(w.dow)}
                        className={`h-6 w-6 rounded text-[11px] ${h.schedule_days.includes(w.dow) ? 'bg-accent/20 text-accent' : 'text-faint hover:text-mute'}`}>
                        {w.short}
                      </button>
                    ))}
                    <span className="ml-1 text-xs text-mute">{h.schedule_days.length} por semana</span>
                  </div>

                  <HabitCalendar habit={h} year={cursor.y} month={cursor.m} logIds={byHabit[h.id] || {}} today={today} onToggle={toggle} />
                </div>
              )
            })}
          </div>

          <p className="mt-6 text-xs text-faint">
            Toca un día para marcarlo. Relleno: completado · punteado: descanso. Los descansos y los días futuros no cuentan como incumplimiento.
          </p>
          <form onSubmit={addHabit} className="mt-4 flex gap-2 border-t border-line pt-4">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nuevo hábito (ej. Meditar)" aria-label="Nuevo hábito" className={`${field} min-w-0 flex-1`} />
            <button className={btn}>Agregar hábito</button>
          </form>
        </>
      )}
    </Card>
  )
}
