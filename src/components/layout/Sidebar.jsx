import { BookOpen, CalendarDays, CheckSquare, Cloud, Flame, FolderKanban, GraduationCap, HardDrive, LogOut, PanelLeftClose, PanelLeftOpen, Sun, Wallet, X } from 'lucide-react'

export const NAV = [
  { id: 'dia', label: 'Mi día', icon: Sun },
  { id: 'tareas', label: 'Tareas', icon: CheckSquare },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  { id: 'habitos', label: 'Hábitos', icon: Flame },
  { id: 'estudio', label: 'Estudio y trabajo', icon: GraduationCap },
  { id: 'proyectos', label: 'Proyectos y notas', icon: FolderKanban },
  { id: 'gastos', label: 'Gastos', icon: Wallet },
  { id: 'lectura', label: 'Lectura y oración', icon: BookOpen },
]

export default function Sidebar({ page, onNavigate, collapsed, onToggle, mobileOpen, onClose, user, onSignOut }) {
  const slim = collapsed && !mobileOpen // en móvil el menú siempre se muestra completo
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-sidebar transition-[width,transform] duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${slim ? 'w-16' : 'w-64'}`}
        aria-label="Navegación principal"
      >
        <div className={`flex h-14 items-center ${slim ? 'justify-center' : 'justify-between px-4'}`}>
          {!slim && <span className="text-sm font-semibold">Life OS</span>}
          <button onClick={mobileOpen ? onClose : onToggle} aria-label={mobileOpen ? 'Cerrar menú' : collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            className="rounded-md p-2 text-mute hover:bg-raised hover:text-ink">
            {mobileOpen ? <X size={18} /> : collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => onNavigate(id)} title={slim ? label : undefined}
              aria-current={page === id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${slim ? 'justify-center px-0' : ''} ${
                page === id ? 'bg-raised text-ink' : 'text-mute hover:bg-raised/60 hover:text-ink'
              }`}>
              <Icon size={18} className="shrink-0" />
              {!slim && <span className="truncate">{label}</span>}
            </button>
          ))}
        </nav>

        <div className={`border-t border-line p-3 text-xs text-mute ${slim ? 'flex flex-col items-center gap-2' : ''}`}>
          {user ? (
            <div className="flex items-center gap-2" title={user.email}>
              <Cloud size={14} className="shrink-0 text-accent" />
              {!slim && <span className="truncate">{user.email}</span>}
              <button onClick={onSignOut} aria-label="Cerrar sesión" className="ml-auto p-1 hover:text-ink"><LogOut size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2" title="Modo local: los datos solo están en este navegador">
              <HardDrive size={14} className="shrink-0" />
              {!slim && <span>Modo local · solo este dispositivo</span>}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
