import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Layers,
  ListChecks,
  Plus,
  Radio,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react'
import PollCard from '../components/PollCard'
import { useAuth } from '../context/useAuth'
import { getApiErrorMessage, pollApi } from '../services/api'

const isPollLive = (poll) => {
  const expired = poll.expiresAt
    ? new Date(poll.expiresAt).getTime() <= Date.now()
    : false

  return poll.status === 'active' && !expired
}

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

const loadVoteCounts = async (nextPolls) => {
  const entries = await Promise.all(
    nextPolls.map(async (poll) => {
      try {
        const response = await pollApi.getResults(poll.id)
        return [poll.id, response.data?.totalVotes ?? 0]
      } catch {
        return [poll.id, 0]
      }
    }),
  )

  return Object.fromEntries(entries)
}

export default function Dashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const [polls, setPolls] = useState([])
  const [voteCounts, setVoteCounts] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [closingId, setClosingId] = useState(null)

  const loadPolls = useCallback(async () => {
    try {
      const result = await pollApi.getMine()
      const nextPolls = [...(result.data || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      )
      setPolls(nextPolls)
      setVoteCounts(await loadVoteCounts(nextPolls))
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Could not load your polls'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    pollApi
      .getMine()
      .then((result) => {
        if (cancelled) {
          return null
        }

        const nextPolls = [...(result.data || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        )
        setPolls(nextPolls)

        return loadVoteCounts(nextPolls).then((counts) => {
          if (!cancelled) {
            setVoteCounts(counts)
          }
        })
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, 'Could not load your polls'))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (location.hash !== '#my-polls') {
      return
    }

    const target = document.getElementById('my-polls')

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  const handleRefresh = () => {
    setIsLoading(true)
    setError('')
    loadPolls()
  }

  const handleClosePoll = async (pollId) => {
    if (!window.confirm('Close this poll? Voting will stop immediately.')) {
      return
    }

    setClosingId(pollId)
    setError('')

    try {
      await pollApi.close(pollId)
      setPolls((current) =>
        current.map((poll) =>
          poll.id === pollId ? { ...poll, status: 'closed' } : poll,
        ),
      )
    } catch (closeError) {
      setError(getApiErrorMessage(closeError, 'Could not close the poll'))
    } finally {
      setClosingId(null)
    }
  }

  const liveCount = polls.filter(isPollLive).length
  const totalVotes = Object.values(voteCounts).reduce(
    (sum, count) => sum + count,
    0,
  )
  const featuredPoll = polls.find(isPollLive)
  const firstName = user?.name?.split(' ')[0] || 'there'

  const stats = [
    {
      label: 'Total polls',
      value: polls.length,
      icon: Layers,
      className: 'bg-primary/10 text-primary',
    },
    {
      label: 'Live now',
      value: liveCount,
      icon: Radio,
      className: 'bg-live/10 text-live',
    },
    {
      label: 'Total votes',
      value: totalVotes,
      icon: Users,
      className: 'bg-cyan/10 text-cyan',
    },
  ]

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-subtle">
            <Sparkles size={14} className="text-primary" />
            Your workspace
          </span>
          <h1 className="mt-4 font-display text-4xl leading-[1.02] text-ink sm:text-5xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-subtle">
            Create a poll, share the link, and watch the results move.
          </p>
        </div>

        <Link
          to="/polls/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-surface shadow-card transition hover:bg-ink"
        >
          <Plus size={17} />
          Create poll
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 shadow-card"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.className}`}
              >
                <Icon size={21} />
              </span>
              <div>
                <p className="font-display text-3xl leading-none text-ink">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                  {stat.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {featuredPoll && (
        <section className="mt-6 overflow-hidden rounded-[2rem] border border-line bg-surface shadow-soft">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-live/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-live">
                  <span className="h-1.5 w-1.5 rounded-full bg-live" />
                  Live now
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  Featured poll
                </span>
              </div>

              <Link to={`/polls/${featuredPoll.id}`} className="group">
                <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight text-ink transition group-hover:text-primary sm:text-4xl">
                  {featuredPoll.question}
                </h2>
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks size={15} className="text-muted" />
                  {featuredPoll.options?.length || 0} options
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={15} className="text-muted" />
                  {voteCounts[featuredPoll.id] ?? 0}{' '}
                  {(voteCounts[featuredPoll.id] ?? 0) === 1 ? 'vote' : 'votes'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-muted" />
                  Ends {formatDate(featuredPoll.expiresAt)}
                </span>
              </div>
            </div>

            <Link
              to={`/polls/${featuredPoll.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:bg-ink"
            >
              View live results
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      )}

      <div
        id="my-polls"
        className="mt-10 flex scroll-mt-24 items-center justify-between"
      >
        <div>
          <h2 className="font-display text-2xl text-ink">Recent polls</h2>
          <p className="mt-1 text-sm text-subtle">
            Everything you have created, newest first.
          </p>
        </div>
        {!isLoading && polls.length > 0 && (
          <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-subtle">
            {polls.length} {polls.length === 1 ? 'poll' : 'polls'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 grid gap-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-3xl border border-line bg-surface p-6"
            >
              <div className="h-4 w-24 rounded-full bg-surface-soft/60" />
              <div className="mt-5 h-5 w-3/5 rounded bg-surface-soft/50" />
              <div className="mt-3 h-3 w-2/5 rounded bg-surface-soft/40" />
            </div>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-muted/40 bg-surface px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Activity size={26} />
          </span>
          <h3 className="mt-5 font-display text-2xl text-ink">
            Your first poll is one click away
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-subtle">
            Ask a question, add a few options, and share the link. Results
            update live as votes come in.
          </p>
          <Link
            to="/polls/new"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-surface transition hover:bg-ink"
          >
            Create your first poll
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onClose={handleClosePoll}
              isClosing={closingId === poll.id}
              voteCount={voteCounts[poll.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
