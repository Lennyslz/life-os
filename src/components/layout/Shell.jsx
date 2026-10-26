import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar, { NAV } from './Sidebar'
import MyDay from '../../pages/MyDay'
import Tasks from '../../pages/Tasks'
import Habits from '../../pages/Habits'
import Calendar from '../../pages/Calendar'
import StudyWork from '../../pages/StudyWork'
import Projects from '../../pages/Projects'
import Expenses from '../../pages/Expenses'
import Reading from '../../pages/Reading'
import { useTable } from '../../hooks/useTable'
import { DEFAULT_HABITS } from '../../utils/habits'

const readPage = () => {
  const h = window.location.hash.slice(1)
  return NAV.some((n) => n.id === h) ? h : 'dia'
}

export default function Shell({ user, onSignOut }) {
  const tasks = useTable('tasks')
  const habits = useTable('habits')
  const logs = useTable('habit_logs')
  const gratitudes = useTable('gratitudes')
  const projects = useTable('projects')

  const [page, setPage] = useState(readPage)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('lifeos:sidebar') === 'collapsed')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const f = () => setPage(readPage())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])

  // Crea los dos hábitos iniciales la primera vez que no existe ninguno.
  const seeded = useRef(false)
  useEffect(() => {
    if (habits.loading || habits.error || habits.rows.length > 0 || seeded.current) return
    seeded.current = true
    DEFAULT_HABITS.forEach((h) => habits.add(h))
  }, [habits])

  const navigate = (id) => { window.location.hash = id; setMobileOpen(false) }
  const toggle = () => setCollapsed((c) => {
    localStorage.setItem('lifeos:sidebar', c ? 'expanded' : 'collapsed')
    return !c
  })

  const current = NAV.find((n) => n.id === page)
  let view
  if (page === 'dia') view = <MyDay {...{ tasks, habits, logs, gratitudes, projects }} onNavigate={navigate} />
  else if (page === 'tareas') view = <Tasks tasks={tasks} projects={projects} />
  else if (page === 'habitos') view = <Habits habits={habits} logs={logs} />
  else if (page === 'calendario') view = <Calendar tasks={tasks} projects={projects} />
  else if (page === 'estudio') view = <StudyWork />
  else if (page === 'proyectos') view = <Projects projects={projects} tasks={tasks} />
  else if (page === 'gastos') view = <Expenses />
  else view = <Reading />

  return (
    <div className="flex h-full">
      <Sidebar page={page} onNavigate={navigate} collapsed={collapsed} onToggle={toggle}
        mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} user={user} onSignOut={onSignOut} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-3 border-b border-line px-4 md:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="rounded-md p-2 text-mute hover:text-ink"><Menu size={20} /></button>
          <span className="text-sm font-medium">{current.label}</span>
        </div>
        <main className="flex-1 overflow-y-auto">{view}</main>
      </div>
    </div>
  )
}
