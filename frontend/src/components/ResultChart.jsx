import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

const COLORS = ['#0866F5', '#0799CC', '#16865D', '#6F96A8', '#2F6F8F', '#5A8FA8']

const truncate = (value, length = 18) =>
  value?.length > length ? `${value.slice(0, length)}...` : value

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-soft">
      <p className="max-w-[220px] font-medium text-ink">{data.text}</p>
      <p className="mt-1 text-sm text-subtle">
        {data.votes} {data.votes === 1 ? 'vote' : 'votes'} · {data.percentage}%
      </p>
    </div>
  )
}

export default function ResultChart({ results = [], totalVotes = 0 }) {
  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface-soft/25 px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted shadow-card">
          <BarChart3 size={22} />
        </span>
        <p className="mt-4 font-display text-xl text-ink">No votes yet</p>
        <p className="mt-1.5 max-w-xs text-sm text-subtle">
          Results will appear here as soon as the first vote is cast.
        </p>
      </div>
    )
  }

  const data = results.map((result) => {
    const percentage = totalVotes
      ? Math.round((result.votes / totalVotes) * 100)
      : 0

    return {
      ...result,
      percentage,
      summary: `${result.votes} · ${percentage}%`,
    }
  })

  return (
    <div className="w-full">
      <ResponsiveContainer
        width="100%"
        height={Math.max(230, data.length * 58)}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 76, bottom: 4, left: 0 }}
          barCategoryGap={16}
        >
          <CartesianGrid
            strokeDasharray="2 6"
            horizontal={false}
            stroke="#D5E5ED"
          />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="text"
            width={136}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#536B7D', fontSize: 12 }}
            tickFormatter={(value) => truncate(value)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#C7DFE9' }} />
          <Bar
            dataKey="votes"
            radius={[999, 999, 999, 999]}
            maxBarSize={18}
            background={{ fill: '#EAF2F6', radius: 999 }}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.optionId}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
            <LabelList
              dataKey="summary"
              position="right"
              style={{
                fill: '#536B7D',
                fontSize: 11,
                fontWeight: 500,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4">
        {data.map((entry, index) => (
          <span
            key={entry.optionId}
            className="inline-flex items-center gap-2 text-xs text-subtle"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            {entry.text}
          </span>
        ))}
      </div>
    </div>
  )
}
