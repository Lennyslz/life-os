import { todayISO } from './dates'

export const PRIORITIES = {
  alta: { label: 'Alta', dot: 'bg-danger' },
  media: { label: 'Media', dot: 'bg-warn' },
  baja: { label: 'Baja', dot: 'bg-faint' },
}
export const CATEGORIES = ['Personal', 'Estudio', 'Trabajo', 'Proyecto', 'Salud', 'Fe']

// El estado se deduce de los datos: no se guarda por separado.
export const taskStatus = (t) => {
  if (t.done) return 'Completada'
  if (t.due_date && t.due_date < todayISO()) return 'Vencida'
  return 'Pendiente'
}

export const byTimeThenCreated = (a, b) =>
  (a.due_time || '99').localeCompare(b.due_time || '99') ||
  (a.created_at || '').localeCompare(b.created_at || '')
