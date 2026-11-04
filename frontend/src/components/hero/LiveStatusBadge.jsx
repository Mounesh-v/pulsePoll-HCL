export default function LiveStatusBadge({
  label = 'Live poll',
  animateAttr = 'live-indicator',
}) {
  return (
    <span
      data-animate={animateAttr}
      className="inline-flex items-center gap-2 rounded-full bg-live/10 px-3 py-1.5 text-xs font-semibold text-live"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
      </span>
      {label}
    </span>
  )
}
