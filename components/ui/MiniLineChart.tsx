// SVG line chart for trend display (zero dependencies)
interface MiniLineChartProps {
  data: { label: string; value: number }[]
  height?: number
  color?: string
}

export function MiniLineChart({ data, height = 80, color = '#3b82f6' }: MiniLineChartProps) {
  if (!data || data.length < 2) return null

  const W = 100
  const padX = 2
  const padY = 4
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const toX = (i: number) => padX + (i / (data.length - 1)) * (W - padX * 2)
  const toY = (v: number) => padY + ((max - v) / range) * (height - padY * 2)

  const polyPoints = data.map((d, i) => `${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`).join(' ')
  const areaPoints = [
    `${toX(0).toFixed(1)},${height}`,
    ...data.map((d, i) => `${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`),
    `${toX(data.length - 1).toFixed(1)},${height}`,
  ].join(' ')

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }}>
        <polygon points={areaPoints} fill={color} fillOpacity="0.12" />
        <polyline
          points={polyPoints}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.value)} r="1.8" fill={color} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span
            key={i}
            className="text-slate-400 dark:text-slate-500 truncate text-center"
            style={{ fontSize: 9, width: `${100 / data.length}%` }}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
