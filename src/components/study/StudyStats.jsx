import Card, { Notice } from '../ui/Card'
import { fmtDuration } from '../../utils/study'

const Tile = ({ label, value }) => (
  <div className="rounded-lg bg-bg px-3 py-3">
    <p className="text-xs text-mute">{label}</p>
    <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
  </div>
)

export default function StudyStats({ study, action }) {
  const { stats, sessions, courses } = study
  const list = Object.entries(stats.byCourse).sort((a, b) => b[1].seconds - a[1].seconds)
  const name = (id) => {
    const c = courses.rows.find((x) => x.id === id)
    return c ? `${c.name}${c.archived ? ' (archivado)' : ''}` : 'Curso eliminado'
  }

  return (
    <Card title="Tiempo de estudio" action={action}>
      {sessions.loading ? <Notice>Cargando estudio…</Notice>
        : sessions.error ? <Notice onRetry={sessions.reload}>No se pudo cargar el historial: {sessions.error}</Notice>
        : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Total acumulado" value={fmtDuration(stats.total)} />
            <Tile label="Hoy" value={fmtDuration(stats.today)} />
            <Tile label="Esta semana" value={fmtDuration(stats.week)} />
            <Tile label="Sesiones" value={stats.count} />
          </div>
          {sessions.pending > 0 && (
            <p className="mt-3 text-xs text-warn">{sessions.pending} sesión(es) pendiente(s) de sincronizar; se reintenta automáticamente.</p>
          )}
          <h3 className="mb-2 mt-5 text-xs text-mute">Por curso</h3>
          {list.length === 0 ? <Notice>Todavía no hay sesiones registradas. Inicia el temporizador para empezar.</Notice> : (
            <ul className="space-y-3">
              {list.map(([id, v]) => (
                <li key={id}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate">{name(id)}</span>
                    <span className="shrink-0 tabular-nums text-mute">{fmtDuration(v.seconds)} · {v.count} {v.count === 1 ? 'sesión' : 'sesiones'}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-raised"><div className="h-full rounded-full bg-accent" style={{ width: `${(v.seconds / stats.total) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  )
}
