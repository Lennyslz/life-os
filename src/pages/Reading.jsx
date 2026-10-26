import { useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import Card, { Notice } from '../components/ui/Card'
import Editable from '../components/ui/Editable'
import { useTable } from '../hooks/useTable'
import { formatShort, todayISO } from '../utils/dates'
import { field, btn } from '../utils/ui'

export default function Reading() {
  const entries = useTable('readings')
  const blank = { entry_date: todayISO(), passage: '', reflection: '', prayer: '' }
  const [form, setForm] = useState(blank)
  const [q, setQ] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    if (!form.passage.trim() && !form.reflection.trim() && !form.prayer.trim()) return
    entries.add({ ...form, passage: form.passage.trim(), reflection: form.reflection.trim(), prayer: form.prayer.trim() }, 'Registro guardado')
    setForm(blank)
  }

  const term = q.trim().toLowerCase()
  const rows = entries.rows
    .filter((r) => !term || [r.passage, r.reflection, r.prayer].some((x) => (x || '').toLowerCase().includes(term)))
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date) || (b.created_at || '').localeCompare(a.created_at || ''))

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-semibold">Lectura y oración</h1>

      <Card title="Nuevo registro">
        <form onSubmit={submit} className="space-y-2">
          <div className="flex gap-2">
            <input value={form.passage} onChange={set('passage')} placeholder="Pasaje leído (ej. Salmo 23)" aria-label="Pasaje" className={`${field} min-w-0 flex-1`} />
            <input type="date" value={form.entry_date} onChange={set('entry_date')} aria-label="Fecha" className={field} />
          </div>
          <textarea rows={3} value={form.reflection} onChange={set('reflection')} placeholder="Reflexión: ¿qué me dice este pasaje?" aria-label="Reflexión" className={`${field} w-full resize-y`} />
          <textarea rows={2} value={form.prayer} onChange={set('prayer')} placeholder="Oración o notas personales" aria-label="Oración" className={`${field} w-full resize-y`} />
          <button className={btn}>Guardar registro</button>
        </form>
      </Card>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en mis registros" aria-label="Buscar" className={`${field} w-full pl-9`} />
      </div>

      {entries.loading ? <Notice>Cargando…</Notice> : entries.error ? <Notice onRetry={entries.reload}>{entries.error}</Notice>
        : rows.length === 0 ? <Notice>{term ? 'Sin resultados.' : 'Todavía no hay registros. Escribe el primero arriba.'}</Notice> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-mute">{formatShort(r.entry_date)}</span>
                  <button onClick={() => entries.remove(r.id, 'Registro eliminado')} aria-label="Eliminar registro" className="p-1 text-faint hover:text-danger"><Trash2 size={14} /></button>
                </div>
                <Editable allowEmpty value={r.passage || ''} onSave={(passage) => entries.update(r.id, { passage })} placeholder="Pasaje" aria-label="Pasaje" className="text-base font-medium" />
                <Editable multiline allowEmpty value={r.reflection || ''} onSave={(reflection) => entries.update(r.id, { reflection })} placeholder="Reflexión" aria-label="Reflexión" className="mt-1 text-sm" />
                <Editable multiline allowEmpty value={r.prayer || ''} onSave={(prayer) => entries.update(r.id, { prayer })} placeholder="Oración o notas" aria-label="Oración" className="mt-1 text-sm text-mute" />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
