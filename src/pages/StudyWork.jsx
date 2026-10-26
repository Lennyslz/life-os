import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Card, { Notice } from '../components/ui/Card'
import Editable from '../components/ui/Editable'
import { useTable } from '../hooks/useTable'
import { formatShort, todayISO } from '../utils/dates'
import { field, btn } from '../utils/ui'

const TYPES = ['Entrega', 'Examen', 'Clase', 'Responsabilidad', 'Otro']
const STATUSES = [['pendiente', 'Pendiente'], ['en_progreso', 'En progreso'], ['hecho', 'Hecho']]

export default function StudyWork() {
  const items = useTable('work_items')
  const [area, setArea] = useState('estudio')
  const blank = { title: '', subject: '', type: 'Entrega', due_date: '' }
  const [form, setForm] = useState(blank)
  const today = todayISO()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) return
    items.add({ title, kind: area, subject: form.subject.trim() || null, type: form.type, due_date: form.due_date || null, status: 'pendiente' }, 'Actividad guardada')
    setForm({ ...blank, type: form.type })
  }
  const rows = items.rows.filter((i) => i.kind === area)
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold">Estudio y trabajo</h1>
        <div className="flex rounded-lg border border-line p-0.5 text-sm" role="group" aria-label="Área">
          {[['estudio', 'Estudio'], ['trabajo', 'Trabajo']].map(([k, l]) => (
            <button key={k} onClick={() => setArea(k)} aria-pressed={area === k} className={`rounded-md px-4 py-1 ${area === k ? 'bg-raised text-ink' : 'text-mute'}`}>{l}</button>
          ))}
        </div>
      </div>

      <Card>
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-6">
          <input value={form.title} onChange={set('title')} placeholder={area === 'estudio' ? 'Ej. Entregar proyecto de programación' : 'Ej. Enviar informe semanal'}
            aria-label="Título" className={`${field} sm:col-span-6`} />
          <input value={form.subject} onChange={set('subject')} placeholder={area === 'estudio' ? 'Materia' : 'Empresa o equipo'} aria-label="Materia o empresa" className={`${field} sm:col-span-2`} />
          <select value={form.type} onChange={set('type')} aria-label="Tipo" className={`${field} sm:col-span-2`}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <input type="date" value={form.due_date} onChange={set('due_date')} aria-label="Fecha límite" className={`${field} sm:col-span-1`} />
          <button className={`${btn} sm:col-span-1`}>Agregar</button>
        </form>
      </Card>

      {items.loading ? <Notice>Cargando…</Notice> : items.error ? <Notice onRetry={items.reload}>{items.error}</Notice> : (
        <div className="grid gap-4 md:grid-cols-3">
          {STATUSES.map(([key, label]) => {
            const col = rows.filter((r) => r.status === key)
            return (
              <section key={key} aria-label={label}>
                <h2 className="mb-2 flex items-center justify-between text-sm font-medium text-mute">{label}<span className="text-xs text-faint">{col.length}</span></h2>
                <ul className="space-y-2">
                  {col.length === 0 && <li className="rounded-lg border border-dashed border-line p-3 text-xs text-faint">Sin actividades</li>}
                  {col.map((r) => {
                    const late = r.status !== 'hecho' && r.due_date && r.due_date < today
                    return (
                      <li key={r.id} className="rounded-lg border border-line bg-surface p-3">
                        <Editable value={r.title} onSave={(title) => items.update(r.id, { title })} aria-label="Título" className={`text-sm ${r.status === 'hecho' ? 'text-faint line-through' : ''}`} />
                        <p className="mt-1 flex flex-wrap gap-x-2 px-1.5 text-xs text-mute">
                          {r.subject && <span>{r.subject}</span>}<span className="rounded bg-raised px-1.5">{r.type}</span>
                          {r.due_date && <span className={late ? 'text-danger' : ''}>{late ? 'Vencida · ' : ''}{formatShort(r.due_date)}</span>}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <select value={r.status} onChange={(e) => items.update(r.id, { status: e.target.value })} aria-label="Estado" className={`${field} flex-1 py-1 text-xs`}>
                            {STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                          </select>
                          <input type="date" value={r.due_date || ''} onChange={(e) => items.update(r.id, { due_date: e.target.value || null })} aria-label="Fecha límite" className={`${field} py-1 text-xs`} />
                          <button onClick={() => items.remove(r.id, 'Actividad eliminada')} aria-label="Eliminar" className="p-1 text-faint hover:text-danger"><Trash2 size={14} /></button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
