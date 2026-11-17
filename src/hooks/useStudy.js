import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { repo } from '../services/repo'
import { useTable } from './useTable'
import { useToast } from '../components/ui/Toast'
import { beep, computeStats, fmtClock, fmtDuration } from '../utils/study'

const sessionsRepo = repo('study_sessions')
const read = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
}
const write = (k, v) => {
  try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)) } catch { /* sin almacenamiento */ }
}

/**
 * Cursos + sesiones de estudio + temporizador.
 *
 * Temporizador: el estado persistido (localStorage) guarda MARCAS DE TIEMPO, no un contador:
 *   { id, phase, courseId, durationMs, status, startedAt, segmentStart, accumulatedMs }
 *   transcurrido = accumulatedMs + (si corre) ahora - segmentStart
 * El intervalo de 250 ms solo repinta; si la pestaña se duerme o se recarga, el cálculo sigue siendo exacto.
 *
 * Registro: al terminar, la sesión se guarda PRIMERO en una cola persistente y luego se sube a la base.
 * Su id nace al iniciar la sesión; la clave primaria evita duplicados aunque se reintente o se pulse varias veces.
 */
export function useStudy(userKey = 'local') {
  const toast = useToast()
  const courses = useTable('courses')
  const kTimer = `lifeos:timer:${userKey}`
  const kPend = `lifeos:pending-sessions:${userKey}`
  const kCfg = `lifeos:timer-cfg:${userKey}`

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(() => read(kPend, []))
  const [timer, setTimer] = useState(() => read(kTimer, null))
  const [now, setNow] = useState(() => Date.now())
  const [notice, setNotice] = useState(null)
  const [cfg, setCfgState] = useState(() => ({ h: 0, m: 25, s: 0, breakMin: 5, courseId: '', ...read(kCfg, {}) }))
  const finishing = useRef(null)
  const flushing = useRef(false)
  const warned = useRef(false)

  // ---------- sesiones (carga y cola de envío) ----------
  const load = useCallback(async () => {
    try { setRows(await sessionsRepo.list()); setError(null) }
    catch (e) { setError(e.message || 'Error de conexión') }
    finally { setLoading(false) }
  }, [])

  const flush = useCallback(async () => {
    if (flushing.current) return
    const queue = read(kPend, [])
    if (!queue.length) return
    flushing.current = true
    const saved = []
    let failed = 0
    for (const s of queue) {
      try { await sessionsRepo.insert(s); saved.push(s) }
      catch (e) { if (e.code === '23505') saved.push(s); else failed++ } // 23505 = ya estaba guardada
    }
    const done = new Set(saved.map((s) => s.id))
    const rest = read(kPend, []).filter((s) => !done.has(s.id))
    write(kPend, rest.length ? rest : null)
    setPending(rest)
    if (saved.length) setRows((p) => [...p, ...saved.filter((s) => !p.some((x) => x.id === s.id))])
    flushing.current = false
    if (failed && !warned.current) {
      warned.current = true
      toast('No se pudo guardar la sesión de estudio. Se reintentará automáticamente.', 'error')
    }
    if (!failed) warned.current = false
  }, [kPend, toast])

  const enqueue = useCallback((session) => {
    const q = [...read(kPend, []).filter((x) => x.id !== session.id), session]
    write(kPend, q)
    setPending(q)
    flush()
  }, [kPend, flush])

  useEffect(() => { load(); flush() }, [load, flush])
  useEffect(() => {
    const id = setInterval(flush, 20000)
    const onVisible = () => { if (!document.hidden) { setNow(Date.now()); load(); flush() } }
    window.addEventListener('online', flush)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      window.removeEventListener('online', flush)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [flush, load])

  // ---------- temporizador ----------
  const persist = useCallback((t) => { setTimer(t); write(kTimer, t) }, [kTimer])

  useEffect(() => {
    const onStorage = (e) => { if (e.key === kTimer) setTimer(read(kTimer, null)) } // otra pestaña
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [kTimer])

  useEffect(() => {
    if (timer?.status !== 'running') return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [timer?.status])

  const elapsedMs = timer
    ? Math.max(0, timer.accumulatedMs + (timer.status === 'running' ? now - timer.segmentStart : 0))
    : 0
  const remainingMs = timer ? Math.max(0, timer.durationMs - elapsedMs) : 0

  const complete = useCallback((early = false) => {
    const t = read(kTimer, null) // la fuente de verdad es el almacenamiento persistido
    if (!t || finishing.current === t.id) return // evita doble registro
    finishing.current = t.id
    const nowMs = Date.now()
    const running = t.status === 'running'
    const elapsed = Math.max(0, Math.min(t.durationMs, t.accumulatedMs + (running ? nowMs - t.segmentStart : 0)))

    if (t.phase === 'break') {
      persist(null)
      setNotice({ kind: 'break', text: 'Descanso terminado. ¡Listo para otra sesión!' })
      if (!early) beep()
      return
    }
    const secs = Math.round(elapsed / 1000)
    persist(null)
    if (secs < 1) { setNotice({ kind: 'info', text: 'Sesión finalizada sin tiempo de estudio; no se registró nada.' }); return }
    const endMs = !early && running ? t.segmentStart + (t.durationMs - t.accumulatedMs) : nowMs
    enqueue({
      id: t.id,
      course_id: t.courseId,
      started_at: t.startedAt,
      ended_at: new Date(endMs).toISOString(),
      duration_seconds: secs,
      status: early ? 'ended_early' : 'completed',
    })
    setNotice({ kind: 'done', text: `${early ? 'Sesión guardada' : '¡Tiempo cumplido! Sesión guardada'}: ${fmtDuration(secs)}.` })
    if (!early) beep()
  }, [kTimer, persist, enqueue])

  useEffect(() => {
    if (timer?.status === 'running' && remainingMs === 0) complete(false)
  }, [timer, remainingMs, complete])

  useEffect(() => {
    document.title = timer ? `${fmtClock(remainingMs)} · ${timer.phase === 'study' ? 'Estudio' : 'Descanso'}` : 'Life OS'
    return () => { document.title = 'Life OS' }
  }, [timer, remainingMs])

  const start = ({ courseId, durationMs, phase = 'study' }) => {
    finishing.current = null
    setNotice(null)
    setNow(Date.now())
    persist({
      id: crypto.randomUUID(), phase, courseId: courseId || null, durationMs, status: 'running',
      startedAt: new Date().toISOString(), segmentStart: Date.now(), accumulatedMs: 0,
    })
  }
  const pause = () => {
    const t = read(kTimer, null)
    if (t?.status === 'running') persist({ ...t, status: 'paused', accumulatedMs: t.accumulatedMs + (Date.now() - t.segmentStart), segmentStart: null })
  }
  const resume = () => {
    const t = read(kTimer, null)
    if (t?.status === 'paused') { setNow(Date.now()); persist({ ...t, status: 'running', segmentStart: Date.now() }) }
  }
  const cancel = () => { finishing.current = timer?.id ?? null; persist(null); setNotice(null) } // no registra nada
  const setCfg = (patch) => setCfgState((c) => { const n = { ...c, ...patch }; write(kCfg, n); return n })

  const activeCourses = courses.rows.filter((c) => !c.archived)
  const allSessions = useMemo(
    () => [...rows, ...pending.filter((p) => !rows.some((r) => r.id === p.id)).map((p) => ({ ...p, _pending: true }))],
    [rows, pending],
  )
  const stats = useMemo(() => computeStats(allSessions), [allSessions])

  return {
    courses, activeCourses,
    sessions: { rows: allSessions, loading, error, reload: load, pending: pending.length },
    stats, timer, cfg, setCfg, elapsedMs, remainingMs, notice, dismissNotice: () => setNotice(null),
    start, pause, resume, cancel, finishEarly: () => complete(true),
  }
}
