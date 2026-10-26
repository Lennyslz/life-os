import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function QuickAdd({ onAdd, placeholder = 'Escribe una tarea y pulsa Enter' }) {
  const [text, setText] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const title = text.trim()
    if (!title) return
    onAdd(title)
    setText('')
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 focus-within:border-accent">
      <Plus size={18} className="shrink-0 text-faint" aria-hidden />
      <input
        id="quick-add"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label="Nueva tarea"
        autoComplete="off"
        className="w-full bg-transparent text-sm placeholder:text-faint focus:outline-none"
      />
    </form>
  )
}
