import { CalendarDays, Plus } from 'lucide-react'
import Card, { Notice } from '../components/ui/Card'
import QuickAdd from '../components/tasks/QuickAdd'
import TaskItem from '../components/tasks/TaskItem'
import DailyProgress from '../components/dashboard/DailyProgress'
import HabitTracker from '../components/habits/HabitTracker'
import GratitudePanel from '../components/gratitude/GratitudePanel'
import { formatLong, greeting, todayISO } from '../utils/dates'
import { byTimeThenCreated } from '../utils/tasks'

export default function MyDay({ tasks, habits, logs, gratitudes, projects, onNavigate }) {
  const today = todayISO()
  const todays = tasks.rows.filter((t) => t.due_date === today).sort(byTimeThenCreated)
  const overdue = tasks.rows.filter((t) => !t.done && t.due_date && t.due_date < today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const addQuick = (title) => tasks.add({ title, done: false, due_date: today, priority: 'media' })
  const item = (t) => <TaskItem key={t.id} task={t} onUpdate={tasks.update} onRemove={tasks.remove} projects={projects.rows} showDate={t.due_date < today} />

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mute">{formatLong(new Date())}</p>
          <h1 className="mt-1 text-3xl font-semibold">Mi día</h1>
          <p className="mt-1 text-sm text-mute">{greeting()}. Una cosa a la vez.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => document.getElementById('quick-add')?.focus()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">
            <Plus size={16} /> Agregar tarea
          </button>
          <button onClick={() => onNavigate('calendario')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-mute hover:text-ink">
            <CalendarDays size={16} /> Calendario
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Tareas de hoy">
            <QuickAdd onAdd={addQuick} />
            <div className="mt-3">
              {tasks.loading ? <Notice>Cargando tareas…</Notice>
                : tasks.error ? <Notice onRetry={tasks.reload}>No se pudieron cargar las tareas: {tasks.error}</Notice>
                : todays.length === 0 ? <Notice>No hay tareas para hoy. Escribe una arriba y pulsa Enter.</Notice>
                : <ul>{todays.map(item)}</ul>}
            </div>
          </Card>

          {overdue.length > 0 && (
            <Card title={`Vencidas (${overdue.length})`}>
              <ul>{overdue.map(item)}</ul>
            </Card>
          )}

          <HabitTracker habits={habits} logs={logs} />
        </div>

        <div className="space-y-6">
          <DailyProgress tasks={todays} />
          <GratitudePanel items={gratitudes} />
        </div>
      </div>
    </div>
  )
}
