import { useState } from 'react'
import { Plus, StickyNote, Trash2 } from 'lucide-react'
import Card, { Notice } from '../components/ui/Card'
import Editable from '../components/ui/Editable'
import QuickAdd from '../components/tasks/QuickAdd'
import TaskItem from '../components/tasks/TaskItem'
import { useTable } from '../hooks/useTable'
import { field } from '../utils/ui'

const STATUS = [['activo', 'Activo'], ['pausado', 'Pausado'], ['terminado', 'Terminado']]

export default function Projects({ projects, tasks }) {
  const notes = useTable('notes')
  const [selId, setSelId] = useState(null) // null = el primero; 'none' = notas sueltas
  const [name, setName] = useState('')

  const current = selId === 'none' ? null : projects.rows.find((p) => p.id === selId) || (selId === null ? projects.rows[0] : null)
  const loose = selId === 'none' || (!current && selId !== null) || (!current && projects.rows.length === 0)
  const pid = current?.id ?? null

  const projTasks = tasks.rows.filter((t) => t.project_id === pid && pid)
  const projNotes = notes.rows.filter((n) => (n.project_id ?? null) === pid)

  const addProject = async (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setName('')
    const created = await projects.add({ name: n, goal: '', status: 'activo' }, 'Proyecto creado')
    if (created) setSelId(created.id)
  }
  const removeProject = () => {
    if (!window.confirm(`¿Eliminar el proyecto «${current.name}»? Sus tareas se conservan sin proyecto y sus notas pasan a notas sueltas.`)) return
    tasks.rows.filter((t) => t.project_id === current.id).forEach((t) => tasks.update(t.id, { project_id: null }))
    notes.rows.filter((n) => n.project_id === current.id).forEach((n) => notes.update(n.id, { project_id: null }))
    projects.remove(current.id, 'Proyecto eliminado')
    setSelId(null)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-semibold">Proyectos y notas</h1>
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <Card title="Proyectos">
          <form onSubmit={addProject} className="mb-3 flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nuevo proyecto" aria-label="Nuevo proyecto" className={`${field} min-w-0 flex-1`} />
            <button aria-label="Crear proyecto" className="rounded-lg bg-accent px-2 text-bg"><Plus size={16} /></button>
          </form>
          {projects.loading ? <Notice>Cargando…</Notice> : (
            <ul className="space-y-0.5">
              {projects.rows.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setSelId(p.id)} aria-current={current?.id === p.id}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${current?.id === p.id ? 'bg-raised' : 'text-mute hover:bg-raised/50 hover:text-ink'}`}>
                    <span className="truncate">{p.name}</span>
                    {p.status !== 'activo' && <span className="ml-2 text-[11px] text-faint">{p.status}</span>}
                  </button>
                </li>
              ))}
              <li>
                <button onClick={() => setSelId('none')} aria-current={loose}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${loose ? 'bg-raised' : 'text-mute hover:bg-raised/50 hover:text-ink'}`}>
                  <StickyNote size={14} /> Notas sueltas
                </button>
              </li>
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          {current && (
            <Card>
              <div className="flex items-start gap-2">
                <Editable value={current.name} onSave={(n) => projects.update(current.id, { name: n })} aria-label="Nombre del proyecto" className="text-xl font-semibold" />
                <select value={current.status} onChange={(e) => projects.update(current.id, { status: e.target.value })} aria-label="Estado del proyecto" className={`${field} shrink-0`}>
                  {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <button onClick={removeProject} aria-label="Eliminar proyecto" className="p-2 text-faint hover:text-danger"><Trash2 size={16} /></button>
              </div>
              <label className="mt-3 block text-xs text-mute">Objetivo
                <Editable multiline allowEmpty value={current.goal || ''} onSave={(goal) => projects.update(current.id, { goal })} placeholder="¿Qué quieres lograr con este proyecto?" className="mt-1 text-sm" />
              </label>
            </Card>
          )}

          {current && (
            <Card title="Tareas del proyecto">
              <QuickAdd placeholder="Agregar tarea al proyecto y pulsar Enter"
                onAdd={(title) => tasks.add({ title, done: false, due_date: null, priority: 'media', project_id: current.id })} />
              <ul className="mt-3">
                {projTasks.length === 0 && <Notice>Sin tareas todavía. Las que agregues aquí también aparecen en «Tareas».</Notice>}
                {projTasks.map((t) => <TaskItem key={t.id} task={t} onUpdate={tasks.update} onRemove={tasks.remove} projects={projects.rows} showDate />)}
              </ul>
            </Card>
          )}

          <Card title={current ? 'Notas del proyecto' : 'Notas sueltas'}
            action={<button onClick={() => notes.add({ title: 'Nueva nota', content: '', project_id: pid })} className="inline-flex items-center gap-1 text-xs text-accent"><Plus size={14} /> Nueva nota</button>}>
            {notes.loading ? <Notice>Cargando notas…</Notice> : notes.error ? <Notice onRetry={notes.reload}>{notes.error}</Notice>
              : projNotes.length === 0 ? <Notice>Aún no hay notas aquí.</Notice> : (
              <ul className="space-y-4">
                {projNotes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-line p-3">
                    <div className="flex items-center gap-2">
                      <Editable value={n.title} onSave={(title) => notes.update(n.id, { title })} aria-label="Título de la nota" className="text-sm font-medium" />
                      <button onClick={() => notes.remove(n.id, 'Nota eliminada')} aria-label="Eliminar nota" className="p-1 text-faint hover:text-danger"><Trash2 size={14} /></button>
                    </div>
                    <Editable multiline allowEmpty value={n.content || ''} onSave={(content) => notes.update(n.id, { content })} placeholder="Escribe aquí…" className="mt-1 text-sm" aria-label="Contenido de la nota" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
