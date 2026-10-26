import Card from '../ui/Card'

export default function DailyProgress({ tasks }) {
  const total = tasks.length
  const done = tasks.filter((t) => t.done).length
  const pct = total ? Math.round((done / total) * 100) : null

  return (
    <Card title="Progreso del día">
      {pct === null ? (
        <p className="text-sm text-mute">Aún no hay tareas para hoy.</p>
      ) : (
        <>
          <p className="text-3xl font-semibold tabular-nums">{pct}%</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised" role="progressbar"
            aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso diario">
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-sm text-mute">
            {done} {done === 1 ? 'completada' : 'completadas'} · {total - done} {total - done === 1 ? 'pendiente' : 'pendientes'}
          </p>
        </>
      )}
    </Card>
  )
}
