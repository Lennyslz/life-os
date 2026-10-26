import { useCallback, useEffect, useMemo, useState } from 'react'
import { repo } from '../services/repo'
import { useToast } from '../components/ui/Toast'

// Estado + CRUD optimista de una tabla. Si la operación falla, revierte y avisa.
export function useTable(table) {
  const toast = useToast()
  const r = useMemo(() => repo(table), [table])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setRows(await r.list()) }
    catch (e) { setError(e.message || 'Error de conexión') }
    finally { setLoading(false) }
  }, [r])

  useEffect(() => { load() }, [load])

  const add = async (row, okMsg) => {
    const tempId = `tmp-${crypto.randomUUID()}`
    setRows((p) => [...p, { id: tempId, created_at: new Date().toISOString(), ...row }])
    try {
      const created = await r.insert(row)
      setRows((p) => p.map((x) => (x.id === tempId ? created : x)))
      if (okMsg) toast(okMsg)
      return created
    } catch (e) {
      setRows((p) => p.filter((x) => x.id !== tempId))
      toast(`No se pudo guardar: ${e.message}`, 'error')
    }
  }

  const update = async (id, patch) => {
    let prev
    setRows((p) => p.map((x) => (x.id === id ? ((prev = x), { ...x, ...patch }) : x)))
    try { await r.update(id, patch) }
    catch (e) {
      setRows((p) => p.map((x) => (x.id === id ? prev : x)))
      toast(`No se pudo actualizar: ${e.message}`, 'error')
    }
  }

  const remove = async (id, okMsg) => {
    let prev
    setRows((p) => p.filter((x) => (x.id === id ? ((prev = x), false) : true)))
    try { await r.remove(id); if (okMsg) toast(okMsg) }
    catch (e) {
      setRows((p) => [...p, prev])
      toast(`No se pudo eliminar: ${e.message}`, 'error')
    }
  }

  return { rows, loading, error, reload: load, add, update, remove }
}
