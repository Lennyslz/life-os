import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import Card, { Notice } from '../components/ui/Card'
import { useTable } from '../hooks/useTable'
import { useToast } from '../components/ui/Toast'
import { CATEGORIES, fmt } from '../utils/money'
import { capitalize, formatShort, pad, todayISO } from '../utils/dates'
import { field, btn, btnGhost } from '../utils/ui'

export default function Expenses() {
  const tx = useTable('transactions')
  const toast = useToast()
  const now = new Date()
  const [cur, setCur] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const blank = { kind: 'gasto', amount: '', category: 'Comida', description: '', tx_date: todayISO() }
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState(null)

  const prefix = `${cur.y}-${pad(cur.m + 1)}`
  const rows = tx.rows.filter((t) => t.tx_date.startsWith(prefix))
    .sort((a, b) => b.tx_date.localeCompare(a.tx_date) || (b.created_at || '').localeCompare(a.created_at || ''))
  const sum = (kind) => rows.filter((t) => t.kind === kind).reduce((s, t) => s + Number(t.amount), 0)
  const income = sum('ingreso')
  const spent = sum('gasto')
  const byCat = Object.entries(rows.filter((t) => t.kind === 'gasto').reduce((a, t) => ((a[t.category] = (a[t.category] || 0) + Number(t.amount)), a), {}))
    .sort((a, b) => b[1] - a[1])

  const shift = (n) => setCur(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setKind = (kind) => setForm({ ...form, kind, category: CATEGORIES[kind][0] })

  const submit = (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!(amount > 0)) return toast('Escribe un monto mayor que 0', 'error')
    const payload = { ...form, amount, description: form.description.trim() || null }
    if (editId) { tx.update(editId, payload); toast('Movimiento actualizado') }
    else tx.add(payload, 'Movimiento guardado')
    setForm({ ...blank, kind: form.kind, category: CATEGORIES[form.kind][0] })
    setEditId(null)
  }
  const edit = (t) => {
    setEditId(t.id)
    setForm({ kind: t.kind, amount: String(t.amount), category: t.category, description: t.description || '', tx_date: t.tx_date })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const label = capitalize(new Date(cur.y, cur.m, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' }))
  const nav = (
    <div className="flex items-center gap-1">
      <button onClick={() => shift(-1)} aria-label="Mes anterior" className="rounded-md p-1 text-mute hover:text-ink"><ChevronLeft size={18} /></button>
      <span className="min-w-32 text-center text-sm">{label}</span>
      <button onClick={() => shift(1)} aria-label="Mes siguiente" className="rounded-md p-1 text-mute hover:text-ink"><ChevronRight size={18} /></button>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><h1 className="text-3xl font-semibold">Gastos</h1>{nav}</div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[['Ingresos', income, 'text-accent'], ['Gastos', spent, 'text-danger'], ['Balance', income - spent, income - spent < 0 ? 'text-danger' : 'text-ink']].map(([l, v, c]) => (
          <Card key={l}><p className="text-sm text-mute">{l}</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${c}`}>{fmt(v)}</p></Card>
        ))}
      </div>

      <Card title={editId ? 'Editar movimiento' : 'Nuevo movimiento'}>
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-6">
          <div className="flex rounded-lg border border-line p-0.5 text-sm sm:col-span-2" role="group" aria-label="Tipo">
            {['gasto', 'ingreso'].map((k) => (
              <button type="button" key={k} onClick={() => setKind(k)} aria-pressed={form.kind === k}
                className={`flex-1 rounded-md py-1 ${form.kind === k ? 'bg-raised text-ink' : 'text-mute'}`}>{capitalize(k)}</button>
            ))}
          </div>
          <input type="number" min="0" step="0.01" inputMode="decimal" value={form.amount} onChange={set('amount')} placeholder="Monto" aria-label="Monto" className={`${field} sm:col-span-2`} />
          <select value={form.category} onChange={set('category')} aria-label="Categoría" className={`${field} sm:col-span-2`}>{CATEGORIES[form.kind].map((c) => <option key={c}>{c}</option>)}</select>
          <input value={form.description} onChange={set('description')} placeholder="Descripción (opcional)" aria-label="Descripción" className={`${field} sm:col-span-3`} />
          <input type="date" value={form.tx_date} onChange={set('tx_date')} aria-label="Fecha" className={`${field} sm:col-span-1`} />
          <button className={`${btn} sm:col-span-1`}>{editId ? 'Guardar' : 'Agregar'}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(blank) }} className={`${btnGhost} sm:col-span-1`}>Cancelar</button>}
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Gastos por categoría">
          {byCat.length === 0 ? <Notice>Sin gastos este mes.</Notice> : (
            <ul className="space-y-3">
              {byCat.map(([c, v]) => (
                <li key={c}>
                  <div className="flex justify-between text-sm"><span>{c}</span><span className="tabular-nums text-mute">{fmt(v)}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-raised"><div className="h-full rounded-full bg-accent" style={{ width: `${(v / spent) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Movimientos" className="lg:col-span-2">
          {tx.loading ? <Notice>Cargando…</Notice> : tx.error ? <Notice onRetry={tx.reload}>{tx.error}</Notice>
            : rows.length === 0 ? <Notice>Sin movimientos en {label}. Agrega uno arriba.</Notice> : (
            <ul className="divide-y divide-line/60">
              {rows.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-20 shrink-0 text-xs text-mute">{formatShort(t.tx_date)}</span>
                  <span className="min-w-0 flex-1 truncate">{t.description || t.category}<span className="ml-2 text-xs text-mute">{t.description ? t.category : ''}</span></span>
                  <span className={`tabular-nums ${t.kind === 'ingreso' ? 'text-accent' : ''}`}>{t.kind === 'ingreso' ? '+' : '−'}{fmt(Number(t.amount))}</span>
                  <button onClick={() => edit(t)} aria-label="Editar movimiento" className="p-1 text-faint hover:text-ink"><Pencil size={14} /></button>
                  <button onClick={() => tx.remove(t.id, 'Movimiento eliminado')} aria-label="Eliminar movimiento" className="p-1 text-faint hover:text-danger"><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
