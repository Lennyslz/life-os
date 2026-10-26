// Todas las fechas "de calendario" se guardan como 'YYYY-MM-DD' en hora LOCAL,
// para evitar desfases por zona horaria.
export const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)
export const formatLong = (d) =>
  capitalize(d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
export const formatShort = (iso) =>
  capitalize(parseISO(iso).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }))
export const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}
