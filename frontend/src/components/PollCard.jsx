import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  CircleDot,
  ListChecks,
  Lock,
  Users,
} from 'lucide-react'

const formatDate = (value) => {
  if (!value) {
    return 'No expiry'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export default function PollCard({
  poll,
  onClose,
  isClosing = false,
  voteCount,
}) {
  const [isExpired] = useState(() =>
    poll.expiresAt
      ? new Date(poll.expiresAt).getTime() <= Date.now()
      : false,
  )
  const isActive = poll.status === 'active' && !isExpired

  return (
    <article className="group flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
              isActive
                ? 'bg-live/10 text-live'
                : 'bg-surface-soft/60 text-subtle'
            }`}
          >
            <CircleDot size={11} />
            {isActive ? 'Live' : isExpired ? 'Expired' : 'Closed'}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <CalendarDays size={13} />
            {formatDate(poll.expiresAt)}
          </span>
        </div>

        <Link to={`/polls/${poll.id}`} className="mt-3 block">
          <h3 className="line-clamp-2 font-display text-[1.35rem] leading-snug text-ink transition group-hover:text-primary">
            {poll.question}
          </h3>
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <ListChecks size={14} className="text-muted" />
            {poll.options?.length || 0} options
          </span>
          {typeof voteCount === 'number' && (
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-muted" />
              {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
            </span>
          )}
          <span>Created {formatDate(poll.createdAt)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <Link
          to={`/polls/${poll.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-surface"
        >
          View
          <ArrowUpRight size={15} />
        </Link>

        {onClose && isActive && (
          <button
            type="button"
            onClick={() => onClose(poll.id)}
            disabled={isClosing}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-xs font-medium text-subtle transition hover:border-ink/20 hover:bg-surface-soft/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Lock size={13} />
            {isClosing ? 'Closing' : 'Close'}
          </button>
        )}
      </div>
    </article>
  )
}
