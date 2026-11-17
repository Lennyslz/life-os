import { useState } from 'react'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import Card, { Notice } from '../components/ui/Card'
import Editable from '../components/ui/Editable'
import StudyTimer from '../components/study/StudyTimer'
import StudyStats from '../components/study/StudyStats'
import { fmtDuration, STATUS_LABEL } from '../utils/study'
import { capitalize } from '../utils/dates'
import { field, btn } from '../utils/ui'

const PAGE = 30

export default function Study({ study }) {
  const { courses, sessions, stats, timer } = study
  const [name, setName] = useState('')
  const [shown, setShown] = useState(PAGE)

  const hasHistory = (id) => sessions.rows.some((s) => s.course_id === id)
  const inUse = (id) => timer?.courseId === id
  const courseName = (id) => courses.rows.find((c) => c.id === id)?.name || 'Curso eliminado'
  const active = courses.rows.filter((c) => !c.archived)
  const archived = courses.rows.filter((c) => c.archived)
  const history = [...sessions.rows].sort((a, b) => b.ended_at.localeCompare(a.ended_at))

  const add = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    courses.add({ name: n, archived: false }, 'Curso creado')
    setName('')
  }
  const remove = (c) => {
    if (hasHistory(c.id) || inUse(c.id)) return
    if (window.confirm(`¿Eliminar el curso «${c.name}»? No tiene historial de estudio.`)) courses.remove(c.id, 'Curso eliminado')
  }

  const row = (c) => (
    <li key={c.id} className="flex items-center gap-2 py-2">
      <div className="min-w-0 flex-1">
        <Editable value={c.name} onSave={(n) => courses.update(c.id, { name: n })} aria-label="Nombre del curso" className="text-sm" />
        <p className="px-1.5 text-xs text-mute">
          {stats.byCourse[c.id] ? `${fmtDuration(stats.byCourse[c.id].seconds)} · ${stats.byCourse[c.id].count} sesiones` : 'Sin sesiones'}
        </p>
      </div>
      <button onClick={() => courses.update(c.id, { archived: !c.archived })} disabled={inUse(c.id) && !c.archived}
        aria-label={c.archived ? 'Restaurar curso' : 'Archivar curso'} title={c.archived ? 'Restaurar' : 'Archivar (conserva el historial)'}
        className="p-1.5 text-faint hover:text-ink disabled:opacity-40">
        {c.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
      </button>
      <button onClick={() => remove(c)} disabled={hasHistory(c.id) || inUse(c.id)} aria-label="Eliminar curso"
        title={hasHistory(c.id) ? 'Tiene historial de estudio: archívalo en vez de eliminarlo' : inUse(c.id) ? 'Hay una sesión en curso' : 'Eliminar'}
        className="p-1.5 text-faint hover:text-danger disabled:cursor-not-allowed disabled:opacity-30">
        <Trash2 size={16} />
      </button>
    </li>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-semibold">Cursos y tiempo</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StudyTimer study={study} />
        <div className="lg:col-span-2"><StudyStats study={study} /></div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Mis cursos">
          <form onSubmit={add} className="mb-2 flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nuevo curso" aria-label="Nuevo curso" className={`${field} min-w-0 flex-1`} />
            <button className={btn}>Agregar</button>
          </form>
          {courses.loading ? <Notice>Cargando…</Notice> : courses.error ? <Notice onRetry={courses.reload}>{courses.error}</Notice>
            : active.length === 0 ? <Notice>No tienes cursos activos.</Notice>
            : <ul className="divide-y divide-line/60">{active.map(row)}</ul>}
          {archived.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-mute">Archivados ({archived.length})</summary>
              <ul className="divide-y divide-line/60">{archived.map(row)}</ul>
            </details>
          )}
          <p className="mt-3 text-xs text-faint">Los cursos con historial no se pueden eliminar; se archivan y su tiempo se conserva.</p>
        </Card>

        <Card title="Historial de sesiones">
          {sessions.loading ? <Notice>Cargando…</Notice> : history.length === 0 ? <Notice>Aún no hay sesiones.</Notice> : (
            <>
              <ul className="divide-y divide-line/60">
                {history.slice(0, shown).map((s) => {
                  const start = new Date(s.started_at)
                  const end = new Date(s.ended_at)
                  const t = (d) => d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <li key={s.id} className="py-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="truncate">{courseName(s.course_id)}</span>
                        <span className="shrink-0 tabular-nums">{fmtDuration(s.duration_seconds)}</span>
                      </div>
                      <p className="text-xs text-mute">
                        {capitalize(start.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }))} · {t(start)}–{t(end)} · {STATUS_LABEL[s.status]}
                        {s._pending && <span className="ml-1 text-warn">· pendiente de sincronizar</span>}
                      </p>
                    </li>
                  )
                })}
              </ul>
              {history.length > shown && (
                <button onClick={() => setShown(shown + PAGE)} className="mt-3 text-xs text-accent underline underline-offset-2">Mostrar más</button>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
