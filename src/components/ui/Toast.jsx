import { createContext, useCallback, useContext, useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'

const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((text, type = 'ok') => {
    const id = crypto.randomUUID()
    setItems((p) => [...p, { id, text, type }])
    setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), type === 'error' ? 6000 : 2200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg border border-line bg-raised px-3 py-2 text-sm shadow-lg">
            {t.type === 'error'
              ? <AlertCircle size={16} className="text-danger" />
              : <Check size={16} className="text-accent" />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
