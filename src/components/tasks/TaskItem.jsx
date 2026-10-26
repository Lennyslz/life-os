import { useState } from 'react'
import { Check, ChevronDown, Clock, Trash2 } from 'lucide-react'
import { CATEGORIES, PRIORITIES, taskStatus } from '../../utils/tasks'
import { formatShort } from '../../utils/dates'

const STATUS_STYLE = {
  Completada: 'text-accent',
  Vencida: 'text-danger',
  Pendiente: 'text-mute',
}

const field = 'rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-ink'

export default function TaskItem({ task, onUpdate, onRemove, showDate = false, projects = [] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const status = taskStatus(task)
  const project = projects.find((p) => p.id === task.project_id)

  const saveTitle = () => {
    const t = title.trim()
    setEditing(false)
    if (!t) return setTitle(task.title)
    if (t !== task.title) onUpdate(task.id, { title: t })
  }
  const toggle = () =>
    onUpdate(task.id, { done: !task.done, completed_at: task.done ? null : new Date().toISOString() })

  return (
    <li className="rounded-lg hover:bg-raised/40">
      <div className="flex items-start gap-3 px-2 py-2">
        <button
          role="checkbox"
          aria-checked={task.done}
          aria-label={task.done ? 'Marcar como pendiente' : 'Marcar como completada'}
          onClick={toggle}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            task.done ? 'border-accent bg-accent text-bg' : 'border-faint hover:border-accent'
          }`}
        >
          {task.done && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') { setTitle(task.title); setEditing(false) }
              }}
              aria-label="Editar título"
              className={`${field} w-full`}
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              title="Clic para editar"
              className={`block w-full break-words text-left text-sm ${task.done ? 'text-faint line-through' : ''}`}
            >
              {task.title}
            </button>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
            <span className={STATUS_STYLE[status]}>{status}</span>
            {showDate && task.due_date && <span>{formatShort(task.due_date)}</span>}
            {task.due_time && (
              <span className="inline-flex items-center gap-1"><Clock size={12} />{task.due_time.slice(0, 5)}</span>
            )}
            {task.priority && (
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${PRIORITIES[task.priority]?.dot}`} />
                {PRIORITIES[task.priority]?.label}
              </span>
            )}
            {task.category && <span className="rounded bg-raised px-1.5 py-0.5">{task.category}</span>}
            {project && <span className="rounded bg-sky/15 px-1.5 py-0.5 text-sky">{project.name}</span>}
          </div>
        </div>

        <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Detalles de la tarea"
          className="rounded-md p-1 text-faint hover:text-ink">
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={() => onRemove(task.id, 'Tarea eliminada')} aria-label="Eliminar tarea"
          className="rounded-md p-1 text-faint hover:text-danger">
          <Trash2 size={16} />
        </button>
      </div>

      {open && (
        <div className="grid grid-cols-2 gap-2 px-2 pb-3 pl-10 sm:grid-cols-3 lg:grid-cols-5">
          <label className="text-xs text-mute">Fecha
            <input type="date" value={task.due_date || ''} className={`${field} mt-1 w-full`}
              onChange={(e) => onUpdate(task.id, { due_date: e.target.value || null })} />
          </label>
          <label className="text-xs text-mute">Hora
            <input type="time" value={task.due_time ? task.due_time.slice(0, 5) : ''} className={`${field} mt-1 w-full`}
              onChange={(e) => onUpdate(task.id, { due_time: e.target.value || null })} />
          </label>
          <label className="text-xs text-mute">Prioridad
            <select value={task.priority || 'media'} className={`${field} mt-1 w-full`}
              onChange={(e) => onUpdate(task.id, { priority: e.target.value })}>
              {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-mute">Categoría
            <select value={task.category || ''} className={`${field} mt-1 w-full`}
              onChange={(e) => onUpdate(task.id, { category: e.target.value || null })}>
              <option value="">Sin categoría</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {projects.length > 0 && (
            <label className="text-xs text-mute">Proyecto
              <select value={task.project_id || ''} className={`${field} mt-1 w-full`}
                onChange={(e) => onUpdate(task.id, { project_id: e.target.value || null })}>
                <option value="">Sin proyecto</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
        </div>
      )}
    </li>
  )
}
