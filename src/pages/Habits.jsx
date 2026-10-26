import HabitTracker from '../components/habits/HabitTracker'

export default function Habits({ habits, logs }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-semibold">Hábitos</h1>
      <HabitTracker habits={habits} logs={logs} />
    </div>
  )
}
