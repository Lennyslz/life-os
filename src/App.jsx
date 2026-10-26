import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { ToastProvider } from './components/ui/Toast'
import AuthScreen from './components/auth/AuthScreen'
import Shell from './components/layout/Shell'

export default function App() {
  // undefined = comprobando sesión; null = sin sesión
  const [session, setSession] = useState(isSupabaseConfigured ? undefined : null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  let content
  if (session === undefined) content = <p className="p-8 text-sm text-mute">Cargando…</p>
  else if (isSupabaseConfigured && !session) content = <AuthScreen />
  else content = <Shell key={session?.user.id ?? 'local'} user={session?.user} onSignOut={() => supabase.auth.signOut()} />

  return <ToastProvider>{content}</ToastProvider>
}
