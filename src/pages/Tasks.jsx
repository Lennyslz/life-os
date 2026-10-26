import { useState } from 'react'
import Card, { Notice } from '../components/ui/Card'
import QuickAdd from '../components/tasks/QuickAdd'
import TaskItem from '../components/tasks/TaskItem'
import { todayISO } from '../utils/dates'
import { taskStatus } from '../utils/tasks'

const FILTERS = ['Todas', 'Pendiente', 'Vencida', 'Completada']

export default function Tasks({ tasks, projects }) {
  const [filter, setFilter] = useState('Todas')
  const rows = tasks.rows
    .filter((t) => filter === 'Todas' || taskStatus(t) === filter)
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-semibold">Tareas</h1>
      <Card>
        <QuickAdd onAdd={(title) => tasks.add({ title, done: false, due_date: todayISO(), priority: 'media' })} />
        <div className="mt-4 flex flex-wrap gap-1" role="group" aria-label="Filtrar por estado">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`rounded-md px-2.5 py-1 text-xs ${filter === f ? 'bg-raised text-ink' : 'text-mute hover:text-ink'}`}>
              {f === 'Todas' ? f : f + 's'}
            </button>
          ))}
        </div>
        <div className="mt-2">
          {tasks.loading ? <Notice>Cargando tareas…</Notice>
            : tasks.error ? <Notice onRetry={tasks.reload}>{tasks.error}</Notice>
            : rows.length === 0 ? <Notice>No hay tareas en esta vista.</Notice>
            : <ul>{rows.map((t) => <TaskItem key={t.id} task={t} onUpdate={tasks.update} onRemove={tasks.remove} projects={projects.rows} showDate />)}</ul>}
        </div>
      </Card>
    </div>
  )
}
