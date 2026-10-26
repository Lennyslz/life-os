import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card'
import TaskItem from '../components/tasks/TaskItem'
import Editable from '../components/ui/Editable'
import { useTable } from '../hooks/useTable'
import { WEEKDAYS } from '../utils/habits'
import { byTimeThenCreated } from '../utils/tasks'
import { capitalize, daysInMonth, formatLong, parseISO, toISO, todayISO } from '../utils/dates'
import { field, btn } from '../utils/ui'

const KIND_STYLE = {
  task: 'bg-raised text-mute',
  event: 'bg-sky/15 text-sky',
  work: 'bg-warn/15 text-warn',
}
const DOT = { task: 'bg-mute', event: 'bg-sky', work: 'bg-warn' }

const Chip = ({ it }) => (
  <div className={`truncate rounded px-1.5 py-0.5 text-[11px] ${KIND_STYLE[it.kind]} ${it.done ? 'line-through opacity-60' : ''}`}>
    {it.time ? `${it.time.slice(0, 5)} ` : ''}{it.title}
  </div>
)

export default function Calendar({ tasks, projects }) {
  const events = useTable('events')
  const work = useTable('work_items')
  const [view, setView] = useState('mes')
  const [sel, setSel] = useState(todayISO())
  const [kind, setKind] = useState('tarea')
  const [text, setText] = useState('')
  const [time, setTime] = useState('')
  const today = todayISO()
  const selDate = parseISO(sel)

  const byDate = useMemo(() => {
    const m = {}
    const push = (d, it) => { if (d) (m[d] ||= []).push(it) }
    tasks.rows.forEach((t) => push(t.due_date, { kind: 'task', id: t.id, title: t.title, done: t.done, time: t.due_time }))
    events.rows.forEach((e) => push(e.event_date, { kind: 'event', id: e.id, title: e.title, time: e.start_time }))
    work.rows.forEach((w) => push(w.due_date, { kind: 'work', id: w.id, title: w.title, done: w.status === 'hecho' }))
    Object.values(m).forEach((l) => l.sort((a, b) => (a.time || '99').localeCompare(b.time || '99')))
    return m
  }, [tasks.rows, events.rows, work.rows])

  const shift = (n) => {
    const d = new Date(selDate)
    if (view === 'semana') d.setDate(d.getDate() + 7 * n)
    else {
      const day = d.getDate()
      d.setDate(1)
      d.setMonth(d.getMonth() + n)
      d.setDate(Math.min(day, daysInMonth(d.getFullYear(), d.getMonth())))
    }
    setSel(toISO(d))
  }

  const y = selDate.getFullYear()
  const m = selDate.getMonth()
  const offset = (new Date(y, m, 1).getDay() + 6) % 7
  const rows = Math.ceil((offset + daysInMonth(y, m)) / 7)
  const monthCells = Array.from({ length: rows * 7 }, (_, i) => new Date(y, m, 1 - offset + i))
  const monday = new Date(selDate)
  monday.setDate(selDate.getDate() - ((selDate.getDay() + 6) % 7))
  const weekCells = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
  const label = view === 'mes'
    ? capitalize(selDate.toLocaleDateString('es', { month: 'long', year: 'numeric' }))
    : `${monday.toLocaleDateString('es', { day: 'numeric', month: 'short' })} – ${weekCells[6].toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const dayTasks = tasks.rows.filter((t) => t.due_date === sel).sort(byTimeThenCreated)
  const dayEvents = events.rows.filter((e) => e.event_date === sel).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  const dayWork = work.rows.filter((w) => w.due_date === sel)

  const submit = (e) => {
    e.preventDefault()
    const title = text.trim()
    if (!title) return
    if (kind === 'tarea') tasks.add({ title, done: false, due_date: sel, due_time: time || null, priority: 'media' })
    else events.add({ title, event_date: sel, start_time: time || null }, 'Evento guardado')
    setText('')
    setTime('')
  }

  const dayButton = (date, big) => {
    const iso = toISO(date)
    const items = byDate[iso] || []
    const isSel = iso === sel
    return (
      <button key={iso} onClick={() => setSel(iso)} aria-pressed={isSel} aria-label={formatLong(date)}
        className={`p-1.5 text-left align-top transition-colors ${big ? 'min-h-16 sm:min-h-24' : 'min-h-40'} ${isSel ? 'bg-raised ring-1 ring-inset ring-accent' : 'hover:bg-raised/40'} ${date.getMonth() !== m && view === 'mes' ? 'opacity-40' : ''}`}>
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${iso === today ? 'bg-accent font-semibold text-bg' : ''}`}>{date.getDate()}</span>
        <div className={`mt-1 space-y-0.5 ${big ? 'hidden sm:block' : ''}`}>
          {items.slice(0, big ? 3 : 8).map((it) => <Chip key={it.kind + it.id} it={it} />)}
          {big && items.length > 3 && <p className="text-[11px] text-faint">+{items.length - 3} más</p>}
        </div>
        {big && (
          <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
            {items.slice(0, 4).map((it) => <span key={it.kind + it.id} className={`h-1.5 w-1.5 rounded-full ${DOT[it.kind]}`} />)}
          </div>
        )}
      </button>
    )
  }

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-line p-0.5 text-xs" role="group" aria-label="Vista">
        {['mes', 'semana'].map((v) => (
          <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
            className={`rounded-md px-2.5 py-1 ${view === v ? 'bg-raised text-ink' : 'text-mute'}`}>{capitalize(v)}</button>
        ))}
      </div>
      <button onClick={() => setSel(today)} className="rounded-lg border border-line px-2.5 py-1 text-xs text-mute hover:text-ink">Hoy</button>
      <button onClick={() => shift(-1)} aria-label="Anterior" className="rounded-md p-1 text-mute hover:text-ink"><ChevronLeft size={18} /></button>
      <span className="min-w-36 text-center text-sm">{label}</span>
      <button onClick={() => shift(1)} aria-label="Siguiente" className="rounded-md p-1 text-mute hover:text-ink"><ChevronRight size={18} /></button>
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold">Calendario</h1>
        <p className="flex gap-3 text-xs text-mute">
          <span className="flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${DOT.task}`} />Tareas</span>
          <span className="flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${DOT.event}`} />Eventos</span>
          <span className="flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${DOT.work}`} />Entregas</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" action={header}>
          <div className="grid grid-cols-7 pb-1 text-center text-xs text-mute">
            {WEEKDAYS.map((w) => <span key={w.dow}>{w.name.slice(0, 3)}</span>)}
          </div>
          {view === 'mes' ? (
            <div className="grid grid-cols-7 divide-x divide-y divide-line overflow-hidden rounded-lg border border-line">
              {monthCells.map((d) => dayButton(d, true))}
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-lg border border-line sm:grid-cols-7 sm:divide-x sm:divide-y-0">
              {weekCells.map((d) => dayButton(d, false))}
            </div>
          )}
        </Card>

        <Card title={formatLong(selDate)}>
          <form onSubmit={submit} className="space-y-2">
            <div className="flex rounded-lg border border-line p-0.5 text-xs" role="group" aria-label="Tipo">
              {['tarea', 'evento'].map((k) => (
                <button type="button" key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
                  className={`flex-1 rounded-md py-1 ${kind === k ? 'bg-raised text-ink' : 'text-mute'}`}>{capitalize(k)}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === 'tarea' ? 'Nueva tarea para este día' : 'Nuevo evento'}
                aria-label="Título" className={`${field} min-w-0 flex-1`} />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Hora (opcional)" className={`${field} w-28`} />
            </div>
            <button className={`${btn} w-full`}>Agregar {kind}</button>
          </form>

          <div className="mt-5 space-y-4">
            {dayEvents.length > 0 && (
              <div>
                <h3 className="mb-1 text-xs text-mute">Eventos</h3>
                <ul>
                  {dayEvents.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 py-1 text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-sky" />
                      {e.start_time && <span className="inline-flex shrink-0 items-center gap-1 text-xs text-mute"><Clock size={12} />{e.start_time.slice(0, 5)}</span>}
                      <Editable value={e.title} onSave={(title) => events.update(e.id, { title })} aria-label="Título del evento" />
                      <button onClick={() => events.remove(e.id, 'Evento eliminado')} aria-label="Eliminar evento" className="p-1 text-faint hover:text-danger"><Trash2 size={14} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dayTasks.length > 0 && (
              <div>
                <h3 className="mb-1 text-xs text-mute">Tareas</h3>
                <ul>{dayTasks.map((t) => <TaskItem key={t.id} task={t} onUpdate={tasks.update} onRemove={tasks.remove} projects={projects.rows} />)}</ul>
              </div>
            )}
            {dayWork.length > 0 && (
              <div>
                <h3 className="mb-1 text-xs text-mute">Entregas de estudio y trabajo</h3>
                <ul>{dayWork.map((w) => (
                  <li key={w.id} className="flex items-center gap-2 py-1 text-sm">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-warn" />
                    <span className={w.status === 'hecho' ? 'text-faint line-through' : ''}>{w.title}</span>
                    {w.subject && <span className="text-xs text-mute">· {w.subject}</span>}
                  </li>
                ))}</ul>
              </div>
            )}
            {dayEvents.length + dayTasks.length + dayWork.length === 0 && <p className="text-sm text-mute">Nada programado para este día.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
