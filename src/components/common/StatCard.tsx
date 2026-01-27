import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  subtext?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({ label, value, icon, subtext, trend }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-mwd-blue-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-mwd-blue-800">{value}</p>
          {subtext && <p className="mt-1 text-sm text-mwd-blue-500">{subtext}</p>}
          {trend && (
            <p
              className={`mt-1 text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : '-'}
              {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-lavender-100 rounded-lg text-mwd-blue-800">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
