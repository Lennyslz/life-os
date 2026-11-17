import Card, { Notice } from '../ui/Card'
import { Check } from 'lucide-react'
import { capitalize, formatShort, parseISO, todayISO } from '../../utils/dates'
import { byTimeThenCreated } from '../../utils/tasks'

const MAX = 8

// Etiqueta relativa calculada en fecha LOCAL (las fechas son 'YYYY-MM-DD' sin zona horaria).
function dayLabel(iso, today) {
  const diff = Math.round((parseISO(iso) - parseISO(today)) / 86400000)
  if (diff === 1) return 'Mañana'
  if (diff < 7) return capitalize(parseISO(iso).toLocaleDateString('es', { weekday: 'long' }))
  return formatShort(iso)
}

export default function UpcomingTasks({ tasks, onUpdate, onNavigate }) {
  const today = todayISO()
  const pending = tasks.rows.filter((t) => !t.done)
  const todayCount = pending.filter((t) => t.due_date === today).length
  const noDate = pending.filter((t) => !t.due_date).length
  // Solo futuras: las de hoy y las vencidas ya aparecen en sus secciones del dashboard.
  const future = pending.filter((t) => t.due_date && t.due_date > today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || byTimeThenCreated(a, b))
  const shown = future.slice(0, MAX)
  const groups = shown.reduce((acc, t) => ((acc[t.due_date] ||= []).push(t), acc), {})

  return (
    <Card title="Próximas tareas">
      {tasks.loading ? <Notice>Cargando…</Notice> : tasks.error ? <Notice onRetry={tasks.reload}>{tasks.error}</Notice> : (
        <>
          <p className="mb-3 text-xs text-mute">
            {todayCount ? `Hoy: ${todayCount} ${todayCount === 1 ? 'pendiente' : 'pendientes'} (arriba, en «Tareas de hoy»).` : 'Hoy no tienes tareas pendientes.'}
          </p>
          {future.length === 0 ? <Notice>No hay tareas futuras con fecha.</Notice> : (
            <div className="space-y-3">
              {Object.entries(groups).map(([date, list]) => (
                <div key={date}>
                  <h3 className="mb-1 text-xs text-mute">{dayLabel(date, today) === formatShort(date) ? formatShort(date) : `${dayLabel(date, today)} · ${formatShort(date)}`}</h3>
                  <ul>
                    {list.map((t) => (
                      <li key={t.id} className="flex items-center gap-2.5 py-1 text-sm">
                        <button role="checkbox" aria-checked={false} aria-label={`Completar ${t.title}`} onClick={() => onUpdate(t.id, { done: true, completed_at: new Date().toISOString() })}
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-faint text-transparent hover:border-accent hover:text-accent">
                          <Check size={11} strokeWidth={3} />
                        </button>
                        <span className="min-w-0 flex-1 truncate">{t.title}</span>
                        {t.due_time && <span className="shrink-0 text-xs text-mute">{t.due_time.slice(0, 5)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {(future.length > MAX || noDate > 0) && (
            <p className="mt-3 text-xs text-faint">
              {future.length > MAX && `+${future.length - MAX} más. `}
              {noDate > 0 && `${noDate} sin fecha. `}
              <button onClick={() => onNavigate('tareas')} className="text-accent underline underline-offset-2">Ver todas</button>
            </p>
          )}
        </>
      )}
    </Card>
  )
}
