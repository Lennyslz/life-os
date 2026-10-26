// Cambia CURRENCY si usas otra moneda (código ISO: GTQ, USD, MXN...).
export const CURRENCY = 'GTQ'
export const fmt = (n) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: CURRENCY }).format(n || 0)
export const CATEGORIES = {
  gasto: ['Comida', 'Transporte', 'Hogar', 'Salud', 'Estudio', 'Ocio', 'Ofrendas', 'Otros'],
  ingreso: ['Salario', 'Trabajo extra', 'Regalo', 'Otros'],
}
