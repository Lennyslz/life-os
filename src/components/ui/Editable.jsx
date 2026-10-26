import { useEffect, useState } from 'react'

// Texto editable en el sitio: se guarda al salir del campo (o con Enter si es de una línea).
export default function Editable({ value, onSave, multiline = false, allowEmpty = false, className = '', ...rest }) {
  const [v, setV] = useState(value ?? '')
  useEffect(() => setV(value ?? ''), [value])
  const commit = () => {
    const t = v.trim()
    if (!allowEmpty && !t) return setV(value ?? '')
    if (t !== (value ?? '')) onSave(t)
  }
  const props = {
    value: v,
    onChange: (e) => setV(e.target.value),
    onBlur: commit,
    className: `w-full rounded-md bg-transparent px-1.5 py-1 hover:bg-raised/60 focus:bg-bg focus:outline focus:outline-1 focus:outline-accent ${className}`,
    ...rest,
  }
  return multiline
    ? <textarea rows={3} {...props} className={`${props.className} resize-y`} />
    : <input {...props} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
}
