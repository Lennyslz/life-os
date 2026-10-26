import { useState } from 'react'
import { History, Pencil, Trash2 } from 'lucide-react'
import Card, { Notice } from '../ui/Card'
import { formatShort, todayISO } from '../../utils/dates'

export default function GratitudePanel({ items }) {
  const today = todayISO()
  const [text, setText] = useState('')
  const [history, setHistory] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')

  const todays = items.rows.filter((g) => g.entry_date === today)
  const past = items.rows
    .filter((g) => g.entry_date < today)
    .reduce((acc, g) => ((acc[g.entry_date] ||= []).push(g), acc), {})
  const pastDates = Object.keys(past).sort().reverse()

  const submit = (e) => {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    items.add({ content, entry_date: today }, 'Agradecimiento guardado')
    setText('')
  }
  const saveEdit = () => {
    const content = editText.trim()
    if (content) items.update(editId, { content })
    setEditId(null)
  }

  const renderRow = (g) => (
    <li key={g.id} className="group flex items-start gap-2 py-1.5 text-sm">
      {editId === g.id ? (
        <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={saveEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null) }}
          aria-label="Editar agradecimiento"
          className="w-full rounded-md border border-line bg-bg px-2 py-1" />
      ) : (
        <>
          <span className="flex-1 break-words">{g.content}</span>
          <button onClick={() => { setEditId(g.id); setEditText(g.content) }} aria-label="Editar agradecimiento" className="p-1 text-faint hover:text-ink"><Pencil size={14} /></button>
          <button onClick={() => items.remove(g.id, 'Agradecimiento eliminado')} aria-label="Eliminar agradecimiento" className="p-1 text-faint hover:text-danger"><Trash2 size={14} /></button>
        </>
      )}
    </li>
  )

  return (
    <Card title="Agradecimientos del día"
      action={
        <button onClick={() => setHistory(!history)} aria-pressed={history}
          className="inline-flex items-center gap-1 text-xs text-mute hover:text-ink">
          <History size={14} /> Historial
        </button>
      }>
      {items.loading ? <Notice>Cargando…</Notice>
        : items.error ? <Notice onRetry={items.reload}>No se pudieron cargar: {items.error}</Notice>
        : (
        <>
          <form onSubmit={submit} className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Hoy agradezco por…"
              aria-label="Nuevo agradecimiento" autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm placeholder:text-faint focus:border-accent focus:outline-none" />
            <button type="submit" className="rounded-lg bg-raised px-3 text-sm hover:bg-line">Guardar</button>
          </form>

          {todays.length > 0 && <ul className="mt-3 divide-y divide-line/60">{todays.map(renderRow)}</ul>}

          {history && (
            <div className="mt-4 space-y-3 border-t border-line pt-3">
              {pastDates.length === 0 && <p className="text-sm text-mute">Todavía no hay días anteriores.</p>}
              {pastDates.map((d) => (
                <div key={d}>
                  <h3 className="text-xs text-mute">{formatShort(d)}</h3>
                  <ul>{past[d].map(renderRow)}</ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
