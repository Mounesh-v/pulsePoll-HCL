import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CircleDot,
  Clock,
  Copy,
  Link2,
  Loader2,
  Lock,
  Radio,
  RefreshCw,
  ShieldCheck,
  Users,
  Vote,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import ResultChart from '../components/ResultChart'
import { useAuth } from '../context/useAuth'
import { useWebSocket } from '../hooks/useWebSocket'
import { getApiErrorMessage, pollApi } from '../services/api'

const formatDate = (value) => {
  if (!value) {
    return 'No expiry'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const applyCountToResults = (current, optionId, count) => {
  if (!current || typeof count !== 'number' || count < 0) {
    return current
  }

  const option = current.results.find((item) => item.optionId === optionId)

  if (!option) {
    return current
  }

  const delta = count - option.votes

  return {
    ...current,
    totalVotes: Math.max(0, current.totalVotes + delta),
    results: current.results.map((item) =>
      item.optionId === optionId ? { ...item, votes: count } : item,
    ),
  }
}

export default function PollDetails() {
  const { id } = useParams()

  return <PollDetailsView key={id} pollId={id} />
}

function PollDetailsView({ pollId }) {
  const { user, isAuthenticated } = useAuth()
  const [poll, setPoll] = useState(null)
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [resultsError, setResultsError] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [votedOptionId, setVotedOptionId] = useState('')
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [voteMessage, setVoteMessage] = useState('')
  const [voteError, setVoteError] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const loadPoll = useCallback(async () => {
    try {
      const pollResponse = await pollApi.get(pollId)
      setPoll(pollResponse.data)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Could not load this poll'))
      setIsLoading(false)
      return
    }

    try {
      const resultsResponse = await pollApi.getResults(pollId)
      setResults(resultsResponse.data)
    } catch (resultsLoadError) {
      setResultsError(
        getApiErrorMessage(resultsLoadError, 'Could not load live results'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [pollId])

  useEffect(() => {
    let cancelled = false

    pollApi
      .get(pollId)
      .then((pollResponse) => {
        if (cancelled) {
          return null
        }

        setPoll(pollResponse.data)

        return pollApi
          .getResults(pollId)
          .then((resultsResponse) => {
            if (!cancelled) {
              setResults(resultsResponse.data)
            }
          })
          .catch((resultsLoadError) => {
            if (!cancelled) {
              setResultsError(
                getApiErrorMessage(
                  resultsLoadError,
                  'Could not load live results',
                ),
              )
            }
          })
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, 'Could not load this poll'))
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
  }, [pollId])

  const handleRetry = () => {
    setIsLoading(true)
    setError('')
    setResultsError('')
    loadPoll()
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)

    return () => clearInterval(timer)
  }, [])

  const isExpired = poll?.expiresAt
    ? new Date(poll.expiresAt).getTime() <= now
    : false
  const isOpen = poll?.status === 'active' && !isExpired
  const isOwner = Boolean(
    user?.id && poll?.creatorId && user.id === poll.creatorId,
  )

  const handleLiveEvent = useCallback((event) => {
    if (!event?.optionId) {
      return
    }

    setResults((current) =>
      applyCountToResults(current, event.optionId, event.count),
    )
  }, [])

  const { status: socketStatus } = useWebSocket(pollId, {
    onMessage: handleLiveEvent,
    enabled: Boolean(isOpen),
  })

  const refreshResults = async () => {
    setResultsError('')

    try {
      const response = await pollApi.getResults(pollId)
      setResults(response.data)
    } catch (refreshError) {
      setResultsError(
        getApiErrorMessage(refreshError, 'Could not load live results'),
      )
    }
  }

  const handleVote = async () => {
    if (!selectedOption || isVoting || hasVoted || !isOpen) {
      return
    }

    setIsVoting(true)
    setVoteError('')
    setVoteMessage('')

    try {
      const response = await pollApi.vote(pollId, selectedOption)
      const count = response?.data?.count

      setHasVoted(true)
      setVotedOptionId(selectedOption)
      setVoteMessage('Your vote is in. Watch the results update live.')

      if (typeof count === 'number') {
        setResults((current) =>
          applyCountToResults(current, selectedOption, count),
        )
      }
    } catch (voteFailure) {
      const status = voteFailure?.response?.status

      if (status === 409) {
        setHasVoted(true)
        setVoteError('This browser has already voted in this poll.')
      } else if (status === 403) {
        setPoll((current) =>
          current ? { ...current, status: 'closed' } : current,
        )
        setVoteError('This poll is closed and no longer accepting votes.')
      } else {
        setVoteError(
          getApiErrorMessage(voteFailure, 'Could not submit your vote'),
        )
      }
    } finally {
      setIsVoting(false)
    }
  }

  const handleClosePoll = async () => {
    if (!window.confirm('Close this poll? Voting will stop immediately.')) {
      return
    }

    setIsClosing(true)
    setVoteError('')

    try {
      await pollApi.close(pollId)
      setPoll((current) =>
        current ? { ...current, status: 'closed' } : current,
      )
    } catch (closeError) {
      setVoteError(getApiErrorMessage(closeError, 'Could not close the poll'))
    } finally {
      setIsClosing(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const liveLabel =
    socketStatus === 'open'
      ? 'Live'
      : socketStatus === 'connecting'
        ? 'Connecting'
        : socketStatus === 'reconnecting'
          ? 'Reconnecting'
          : 'Offline'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-5 w-32 animate-pulse rounded-full bg-surface-soft/60" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-96 animate-pulse rounded-[2rem] border border-line bg-surface" />
            <div className="h-96 animate-pulse rounded-[2rem] border border-line bg-surface" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <CircleDot size={26} />
          </span>
          <h1 className="mt-5 font-display text-3xl text-ink">
            Poll unavailable
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-subtle">
            {error || 'This poll may have been removed or the link is invalid.'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface-soft/35"
            >
              <RefreshCw size={16} />
              Try again
            </button>
            <Link
              to={isAuthenticated ? '/dashboard' : '/'}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:bg-ink"
            >
              {isAuthenticated ? 'Back to dashboard' : 'Back home'}
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-subtle transition hover:text-ink"
        >
          <ArrowLeft size={16} />
          {isAuthenticated ? 'Back to dashboard' : 'Back to home'}
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isOpen
                    ? 'bg-live/10 text-live'
                    : 'bg-surface-soft/60 text-subtle'
                }`}
              >
                {isOpen ? <Radio size={13} /> : <Lock size={13} />}
                {isOpen ? 'Accepting votes' : 'Voting closed'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <CalendarDays size={13} />
                Ends {formatDate(poll.expiresAt)}
              </span>
            </div>

            <h1 className="mt-4 font-display text-4xl leading-[1.04] text-ink sm:text-5xl">
              {poll.question}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-subtle">
              <span className="inline-flex items-center gap-1.5">
                <Users size={15} className="text-muted" />
                {results?.totalVotes ?? 0}{' '}
                {(results?.totalVotes ?? 0) === 1 ? 'vote' : 'votes'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BarChart3 size={15} className="text-muted" />
                {poll.options?.length || 0} options
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} className="text-muted" />
                Created {formatDate(poll.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-card transition hover:bg-surface-soft/35"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-live" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Share poll
                </>
              )}
            </button>

            {isOwner && isOpen && (
              <button
                type="button"
                onClick={handleClosePoll}
                disabled={isClosing}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-surface px-4 py-2.5 text-sm font-medium text-rose-600 shadow-card transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isClosing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Lock size={16} />
                )}
                {isClosing ? 'Closing...' : 'Close poll'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="rounded-[2rem] border border-line bg-surface p-5 shadow-card sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-ink">
                  Live results
                </h2>
                <p className="mt-1 text-sm text-subtle">
                  {results?.totalVotes ?? 0} total{' '}
                  {(results?.totalVotes ?? 0) === 1 ? 'vote' : 'votes'} counted
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isOpen && socketStatus === 'open'
                    ? 'bg-live/10 text-live'
                    : isOpen
                      ? 'bg-cyan/10 text-cyan'
                      : 'bg-surface-soft/60 text-subtle'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOpen && socketStatus === 'open'
                      ? 'bg-live'
                      : isOpen
                        ? 'bg-cyan'
                        : 'bg-muted'
                  }`}
                />
                {isOpen ? liveLabel : 'Final results'}
              </span>
            </div>

            <div className="mt-6">
              {resultsError ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-rose-700">
                    {resultsError}
                  </p>
                  <button
                    type="button"
                    onClick={refreshResults}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
                  >
                    <RefreshCw size={13} />
                    Retry
                  </button>
                </div>
              ) : results ? (
                <ResultChart
                  results={results.results}
                  totalVotes={results.totalVotes}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {[72, 54, 66, 40].map((width, index) => (
                    <div
                      key={index}
                      className="h-8 animate-pulse rounded-full bg-surface-soft/45"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-[2rem] border border-line bg-surface p-5 shadow-card sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Vote size={18} />
                </span>
                <div>
                  <h2 className="font-display text-xl text-ink">
                    Cast your vote
                  </h2>
                  <p className="text-xs text-subtle">Pick one option below.</p>
                </div>
              </div>

              {isOpen ? (
                <div className="mt-5 space-y-2.5">
                  {poll.options.map((option) => {
                    const isSelected = selectedOption === option.id
                    const isVotedOption = votedOptionId === option.id

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedOption(option.id)
                          setVoteError('')
                        }}
                        disabled={hasVoted || isVoting}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm transition ${
                          isSelected || isVotedOption
                            ? 'border-primary bg-primary/5 text-ink ring-2 ring-primary/10'
                            : 'border-line bg-surface text-subtle hover:border-primary/30 hover:bg-surface-soft/25'
                        } disabled:cursor-not-allowed disabled:opacity-80`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected || isVotedOption
                              ? 'border-primary bg-primary text-surface'
                              : 'border-muted/50 bg-surface'
                          }`}
                        >
                          {(isSelected || isVotedOption) && <Check size={12} />}
                        </span>
                        <span className="font-medium">{option.text}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-line bg-surface-soft/30 px-4 py-6 text-center">
                  <Lock size={22} className="mx-auto text-muted" />
                  <p className="mt-2 font-display text-lg text-ink">
                    This poll is closed
                  </p>
                  <p className="mt-1 text-xs text-subtle">
                    You can still see the final results.
                  </p>
                </div>
              )}

              {isOpen && (
                <button
                  type="button"
                  onClick={handleVote}
                  disabled={!selectedOption || isVoting || hasVoted}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-surface shadow-card transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVoting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Submitting...
                    </>
                  ) : hasVoted ? (
                    <>
                      <Check size={17} />
                      Vote recorded
                    </>
                  ) : (
                    <>
                      <Vote size={17} />
                      Submit vote
                    </>
                  )}
                </button>
              )}

              {voteMessage && (
                <div className="mt-3 rounded-2xl border border-live/15 bg-live/10 px-3.5 py-2.5 text-xs font-medium text-live">
                  {voteMessage}
                </div>
              )}

              {voteError && (
                <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  {voteError}
                </div>
              )}

              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
                <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                Voting is anonymous. One vote is allowed per browser.
              </p>
            </section>

            <section className="rounded-[2rem] border border-line bg-surface p-5 shadow-card sm:p-6">
              <div className="flex items-center gap-2 font-display text-xl text-ink">
                <Link2 size={18} className="text-primary" />
                Share this poll
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-subtle">
                Share the link anyone can use to view results and vote.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  readOnly
                  value={window.location.href}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-surface-soft/30 px-3 py-2.5 text-xs text-subtle outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-surface transition hover:bg-ink"
                  aria-label="Copy poll link"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
