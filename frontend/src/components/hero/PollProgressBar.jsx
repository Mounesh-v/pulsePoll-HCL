export default function PollProgressBar({
  label,
  value,
  votes,
  color,
  animateAttr = 'preview-bar',
  optionAttr = 'preview-option',
}) {
  return (
    <div data-animate={optionAttr} className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="tabular-nums text-subtle">
          {value}%
          {typeof votes === 'number' ? (
            <span className="ml-2 text-xs text-muted">{votes}</span>
          ) : null}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-soft/55">
        <div
          data-animate={animateAttr}
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}
