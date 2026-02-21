// SVG circular arc gauge for score display
interface ScoreGaugeProps {
  score: number
  size?: number
  showLabel?: boolean
}

export function ScoreGauge({ score, size = 144, showLabel = true }: ScoreGaugeProps) {
  const r = (size / 2) * 0.75
  const circumference = 2 * Math.PI * r
  const clamped = Math.min(100, Math.max(0, score))
  const offset = circumference - (clamped / 100) * circumference
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label =
    score >= 85 ? 'Excellent' :
    score >= 70 ? 'Bon' :
    score >= 50 ? 'Partiel' :
    score >= 25 ? 'Insuffisant' : 'Critique'
  const cx = size / 2
  const cy = size / 2
  const sw = Math.round(size * 0.083)

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            className="dark:stroke-slate-700"
            strokeWidth={sw}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-slate-900 dark:text-slate-100 leading-none"
            style={{ fontSize: Math.round(size * 0.21) }}
          >
            {score}
          </span>
          <span
            className="text-slate-500 dark:text-slate-400"
            style={{ fontSize: Math.round(size * 0.1) }}
          >
            /100
          </span>
        </div>
      </div>
      {showLabel && (
        <div
          className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: color + '20', color }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
