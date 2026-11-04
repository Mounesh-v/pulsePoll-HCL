import { Activity, Users } from 'lucide-react'

export default function VoteStatsRow({
  totalVotes = 248,
  activeViewers = 36,
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-line bg-surface-soft/30 px-3.5 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <Users size={14} className="text-primary" />
          Total votes
        </div>
        <p className="mt-1.5 font-display text-2xl tabular-nums text-ink">
          {totalVotes.toLocaleString()}
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-surface-soft/30 px-3.5 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <Activity size={14} className="text-cyan" />
          Watching now
        </div>
        <p className="mt-1.5 font-display text-2xl tabular-nums text-ink">
          {activeViewers}
        </p>
      </div>
    </div>
  )
}
