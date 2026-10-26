export default function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-4 md:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-mute">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Notice({ children, onRetry }) {
  return (
    <p className="text-sm text-mute">
      {children}
      {onRetry && (
        <button onClick={onRetry} className="ml-2 text-accent underline underline-offset-2">Reintentar</button>
      )}
    </p>
  )
}
