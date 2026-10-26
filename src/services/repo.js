import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Una única interfaz (list/insert/update/remove) con dos backends:
//  - Supabase (si hay variables de entorno)
//  - localStorage (modo local)
const PAGE = 1000

const cloud = (table) => ({
  async list() {
    let all = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from(table).select('*').order('created_at').range(from, from + PAGE - 1)
      if (error) throw error
      all = all.concat(data)
      if (data.length < PAGE) return all
    }
  },
  async insert(row) {
    const { data, error } = await supabase.from(table).insert(row).select().single()
    if (error) throw error
    return data
  },
  async update(id, patch) {
    const { error } = await supabase.from(table).update(patch).eq('id', id)
    if (error) throw error
  },
  async remove(id) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  },
})

const key = (t) => `lifeos:${t}`
const read = (t) => {
  try { return JSON.parse(localStorage.getItem(key(t))) || [] } catch { return [] }
}
const write = (t, rows) => localStorage.setItem(key(t), JSON.stringify(rows))

const local = (table) => ({
  async list() { return read(table) },
  async insert(row) {
    const created = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }
    write(table, [...read(table), created])
    return created
  },
  async update(id, patch) { write(table, read(table).map((r) => (r.id === id ? { ...r, ...patch } : r))) },
  async remove(id) { write(table, read(table).filter((r) => r.id !== id)) },
})

export const repo = (table) => (isSupabaseConfigured ? cloud(table) : local(table))
