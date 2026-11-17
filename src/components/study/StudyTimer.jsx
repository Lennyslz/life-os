import { useState } from 'react'
import { Coffee, Pause, Play, Square, X } from 'lucide-react'
import Card from '../ui/Card'
import { fmtClock } from '../../utils/study'
import { field, btn, btnGhost } from '../../utils/ui'

const PRESETS = [[25, '25 min'], [50, '50 min'], [90, '1 h 30']]
const clamp = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0))
const num = `${field} w-full text-center tabular-nums`

export default function StudyTimer({ study }) {
  const { timer, cfg, setCfg, activeCourses, courses, remainingMs, notice } = study
  const [newCourse, setNewCourse] = useState('')
  const [formError, setFormError] = useState(null)

  const courseId = activeCourses.some((c) => c.id === cfg.courseId) ? cfg.courseId : activeCourses[0]?.id || ''
  const courseName = (id) => courses.rows.find((c) => c.id === id)?.name || 'Curso'

  const begin = () => {
    const durationMs = (cfg.h * 3600 + cfg.m * 60 + cfg.s) * 1000
    if (!courseId) return setFormError('Elige o crea un curso primero.')
    if (durationMs < 1000) return setFormError('Configura una duración mayor que cero.')
    if (durationMs > 86400000) return setFormError('La duración máxima es de 24 horas.')
    setFormError(null)
    study.start({ courseId, durationMs })
  }
  const beginBreak = () => {
    if (cfg.breakMin < 1) return setFormError('El descanso debe durar al menos 1 minuto.')
    setFormError(null)
    study.start({ phase: 'break', durationMs: cfg.breakMin * 60000 })
  }
  const addCourse = async (e) => {
    e.preventDefault()
    const name = newCourse.trim()
    if (!name) return
    setNewCourse('')
    const created = await courses.add({ name, archived: false }, 'Curso creado')
    if (created) setCfg({ courseId: created.id })
  }
  const cancel = () => {
    if (timer.phase === 'study' && !window.confirm('¿Cancelar la sesión? El tiempo transcurrido no se registrará.')) return
    study.cancel()
  }

  const banner = notice && (
    <div role="status" className={`mb-3 flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${notice.kind === 'info' ? 'border-line text-mute' : 'border-accent/40 bg-accent/10 text-accent'}`}>
      <span>{notice.text}</span>
      <button onClick={study.dismissNotice} aria-label="Cerrar aviso" className="shrink-0 p-0.5"><X size={14} /></button>
    </div>
  )

  // ---- sesión en curso (estudio o descanso) ----
  if (timer) {
    const isBreak = timer.phase === 'break'
    const pct = Math.min(100, ((timer.durationMs - remainingMs) / timer.durationMs) * 100)
    return (
      <Card title={isBreak ? 'Descanso' : 'Sesión de estudio'}>
        <p className={`text-sm ${isBreak ? 'text-sky' : 'text-accent'}`}>
          {isBreak ? 'Descanso · no cuenta como estudio' : courseName(timer.courseId)}
          {timer.status === 'paused' && <span className="ml-2 text-mute">· en pausa</span>}
        </p>
        <p className="my-3 text-5xl font-semibold tabular-nums" role="timer" aria-label="Tiempo restante">{fmtClock(remainingMs)}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full ${isBreak ? 'bg-sky' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {timer.status === 'running'
            ? <button onClick={study.pause} className={`${btnGhost} inline-flex items-center gap-1.5`}><Pause size={15} /> Pausar</button>
            : <button onClick={study.resume} className={`${btn} inline-flex items-center gap-1.5`}><Play size={15} /> Reanudar</button>}
          {isBreak
            ? <button onClick={study.finishEarly} className={btnGhost}>Saltar descanso</button>
            : <button onClick={study.finishEarly} className={`${btnGhost} inline-flex items-center gap-1.5`}><Square size={14} /> Finalizar y guardar</button>}
          <button onClick={cancel} className="rounded-lg px-3 py-2 text-sm text-faint hover:text-danger">Cancelar</button>
        </div>
      </Card>
    )
  }

  // ---- configuración ----
  return (
    <Card title="Temporizador de estudio">
      {banner}
      {courses.loading ? <p className="text-sm text-mute">Cargando cursos…</p>
        : courses.error ? <p className="text-sm text-mute">No se pudieron cargar los cursos: {courses.error} <button onClick={courses.reload} className="text-accent underline">Reintentar</button></p>
        : (
        <div className="space-y-3">
          {activeCourses.length === 0 ? (
            <form onSubmit={addCourse} className="space-y-2">
              <p className="text-sm text-mute">Aún no tienes cursos. Crea el primero para empezar a registrar estudio.</p>
              <div className="flex gap-2">
                <input value={newCourse} onChange={(e) => setNewCourse(e.target.value)} placeholder="Nombre del curso" aria-label="Nombre del curso" className={`${field} min-w-0 flex-1`} />
                <button className={btn}>Crear</button>
              </div>
            </form>
          ) : (
            <label className="block text-xs text-mute">Curso
              <select value={courseId} onChange={(e) => setCfg({ courseId: e.target.value })} className={`${field} mt-1 w-full`}>
                {activeCourses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}

          <div>
            <div className="grid grid-cols-3 gap-2">
              {[['h', 'horas', 99], ['m', 'minutos', 59], ['s', 'segundos', 59]].map(([k, label, max]) => (
                <label key={k} className="text-xs text-mute">{label}
                  <input type="number" min="0" max={max} inputMode="numeric" value={cfg[k]} onFocus={(e) => e.target.select()}
                    onChange={(e) => setCfg({ [k]: clamp(e.target.value, max) })} className={`${num} mt-1`} />
                </label>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {PRESETS.map(([min, label]) => (
                <button key={min} onClick={() => setCfg({ h: Math.floor(min / 60), m: min % 60, s: 0 })} className="rounded-md bg-raised px-2 py-1 text-xs text-mute hover:text-ink">{label}</button>
              ))}
            </div>
          </div>

          {formError && <p className="text-sm text-danger" role="alert">{formError}</p>}
          <button onClick={begin} className={`${btn} inline-flex w-full items-center justify-center gap-1.5`}><Play size={15} /> Iniciar estudio</button>

          <div className="flex items-end gap-2 border-t border-line pt-3">
            <label className="w-24 text-xs text-mute">Descanso (min)
              <input type="number" min="1" max="120" value={cfg.breakMin} onFocus={(e) => e.target.select()}
                onChange={(e) => setCfg({ breakMin: clamp(e.target.value, 120) })} className={`${num} mt-1`} />
            </label>
            <button onClick={beginBreak} className={`${btnGhost} inline-flex items-center gap-1.5`}><Coffee size={15} /> Iniciar descanso</button>
          </div>
        </div>
      )}
    </Card>
  )
}
