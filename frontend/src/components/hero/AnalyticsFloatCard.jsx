import { TrendingUp } from 'lucide-react'

const sparkPoints = [8, 14, 11, 18, 16, 22, 20, 27]

export default function AnalyticsFloatCard({
  label = 'Engagement',
  value = '+18%',
  animateAttr = 'analytics-float',
}) {
  const width = 88
  const height = 28
  const max = Math.max(...sparkPoints)
  const min = Math.min(...sparkPoints)
  const range = max - min || 1

  const path = sparkPoints
    .map((point, index) => {
      const x = (index / (sparkPoints.length - 1)) * width
      const y = height - ((point - min) / range) * (height - 4) - 2
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div
      data-animate={animateAttr}
      className="pointer-events-none absolute -bottom-5 -left-3 z-10 w-[11.5rem] rounded-2xl border border-line bg-surface p-3.5 shadow-card sm:-left-5 sm:w-[12.5rem]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {label}
          </p>
          <p className="mt-1 font-display text-xl text-ink">{value}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TrendingUp size={15} />
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 h-7 w-full overflow-visible"
        aria-hidden="true"
      >
        <path
          d={path}
          fill="none"
          stroke="#0866F5"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
