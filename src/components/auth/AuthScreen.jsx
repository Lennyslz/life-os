import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { data, error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) return setMsg({ error: true, text: error.message })
    if (mode === 'signup' && !data.session) setMsg({ text: 'Revisa tu correo para confirmar la cuenta y luego inicia sesión.' })
  }

  const input = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none'
  return (
    <main className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-surface p-6">
        <h1 className="text-lg font-semibold">Life OS</h1>
        <p className="text-sm text-mute">{mode === 'login' ? 'Inicia sesión para ver tus datos.' : 'Crea tu cuenta con correo y contraseña.'}</p>
        <label className="block text-sm">Correo
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1`} autoComplete="email" />
        </label>
        <label className="block text-sm">Contraseña
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} mt-1`}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </label>
        {msg && <p className={`text-sm ${msg.error ? 'text-danger' : 'text-accent'}`} role="alert">{msg.text}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-bg disabled:opacity-60">
          {busy ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(null) }} className="w-full text-sm text-mute hover:text-ink">
          {mode === 'login' ? 'No tengo cuenta' : 'Ya tengo cuenta'}
        </button>
      </form>
    </main>
  )
}
