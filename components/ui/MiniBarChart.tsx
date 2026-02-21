// SVG bar chart for comparison display (zero dependencies)
interface BarData {
  label: string
  value: number
  value2?: number
}

interface MiniBarChartProps {
  data: BarData[]
  height?: number
  color?: string
  color2?: string
}

export function MiniBarChart({
  data,
  height = 80,
  color = '#3b82f6',
  color2 = '#f59e0b',
}: MiniBarChartProps) {
  if (!data || data.length === 0) return null

  const W = 100
  const padX = 2
  const padY = 4
  const allValues = data.flatMap(d => [d.value, d.value2 ?? 0])
  const maxV = Math.max(...allValues, 1)
  const barW = (W - padX * 2) / data.length
  const gap = barW * 0.2

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const x = padX + i * barW + gap / 2
          const w = barW - gap
          const h1 = (d.value / maxV) * (height - padY * 2)
          const h2 = d.value2 != null ? (d.value2 / maxV) * (height - padY * 2) : 0
          const y1 = height - padY - h1
          const y2 = y1 - h2
          return (
            <g key={i}>
              <rect x={x} y={y1} width={w} height={h1} fill={color} rx="1" />
              {d.value2 != null && d.value2 > 0 && (
                <rect x={x} y={y2} width={w} height={h2} fill={color2} rx="1" />
              )}
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span
            key={i}
            className="text-slate-400 dark:text-slate-500 text-center truncate"
            style={{ fontSize: 9, width: `${100 / data.length}%` }}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
