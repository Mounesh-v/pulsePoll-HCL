import { useEffect, useRef } from 'react'
import { BarChart3, Share2 } from 'lucide-react'
import gsap from 'gsap'
import AnalyticsFloatCard from './AnalyticsFloatCard'
import LiveStatusBadge from './LiveStatusBadge'
import PollProgressBar from './PollProgressBar'
import VoteStatsRow from './VoteStatsRow'

const POLL_OPTIONS = [
  { label: 'Live analytics', value: 44, votes: 109, color: '#0866F5' },
  { label: 'Team collaboration', value: 28, votes: 69, color: '#0799CC' },
  { label: 'Integrations', value: 18, votes: 45, color: '#16865D' },
  { label: 'Custom branding', value: 10, votes: 25, color: '#6F96A8' },
]

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function HeroPollIllustration() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current

    if (!root || prefersReducedMotion()) {
      return undefined
    }

    const ctx = gsap.context(() => {
      const stage = root.querySelector('[data-float="stage"]')
      const analytics = root.querySelector('[data-animate="analytics-float"]')
      const chip = root.querySelector('[data-float="chip"]')

      if (analytics) {
        gsap.from(analytics, {
          opacity: 0,
          y: 18,
          scale: 0.96,
          duration: 0.7,
          ease: 'power3.out',
          delay: 1.25,
        })
      }

      if (stage) {
        gsap.to(stage, {
          y: -10,
          duration: 3.4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 1.4,
        })
      }

      if (analytics) {
        gsap.to(analytics, {
          y: -6,
          duration: 2.8,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 2.1,
        })
      }

      if (chip) {
        gsap.to(chip, {
          y: 6,
          duration: 3.1,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 1.6,
        })
      }
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      id="preview"
      data-animate="preview-visual"
      className="scroll-mt-28"
    >
      <div className="relative mx-auto w-full max-w-xl pb-8 lg:max-w-none lg:pb-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 -z-10 sm:-inset-8"
        >
          <div className="absolute right-4 top-8 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-6 left-2 h-36 w-36 rounded-full bg-cyan/20 blur-3xl" />
          <div className="absolute inset-x-10 top-1/3 h-28 rounded-full bg-surface/50 blur-2xl" />
        </div>

        <div
          data-float="chip"
          className="absolute -right-2 -top-3 z-10 hidden rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-subtle shadow-card sm:inline-flex"
        >
          Product preview
        </div>

        <div data-float="stage" className="relative will-change-transform">
          <div className="rounded-[2rem] border border-line bg-surface p-5 shadow-soft sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <LiveStatusBadge />
              <span className="text-xs font-medium text-muted">
                Results update instantly
              </span>
            </div>

            <div data-animate="preview-question">
              <h2 className="mt-6 font-display text-3xl leading-tight text-ink sm:text-[2.1rem]">
                What should we build next?
              </h2>
              <p className="mt-2 text-sm text-subtle">
                Choose the direction you are most excited about.
              </p>
            </div>

            <div className="mt-7 space-y-5">
              {POLL_OPTIONS.map((option) => (
                <PollProgressBar
                  key={option.label}
                  label={option.label}
                  value={option.value}
                  votes={option.votes}
                  color={option.color}
                />
              ))}
            </div>

            <div className="mt-7">
              <VoteStatsRow totalVotes={248} activeViewers={36} />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-soft/30 px-4 py-3.5">
              <span className="inline-flex items-center gap-2 text-sm text-subtle">
                <BarChart3 size={16} className="text-primary" />
                Everyone sees the same live result
              </span>
              <span className="hidden text-xs font-medium text-muted sm:inline">
                #PulsePoll
              </span>
            </div>
          </div>

          <AnalyticsFloatCard />

          <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-2 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-xs font-medium text-subtle shadow-card sm:flex">
            <Share2 size={14} className="text-cyan" />
            Share one link
          </div>
        </div>
      </div>
    </div>
  )
}
