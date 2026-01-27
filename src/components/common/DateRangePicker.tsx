import { format, subDays } from 'date-fns'

interface DateRangePickerProps {
  fromDate: string
  toDate: string
  onFromDateChange: (date: string) => void
  onToDateChange: (date: string) => void
}

const presets = [
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
]

export function DateRangePicker({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: DateRangePickerProps) {
  const applyPreset = (days: number) => {
    const to = new Date()
    const from = subDays(to, days)
    onFromDateChange(format(from, 'yyyy-MM-dd'))
    onToDateChange(format(to, 'yyyy-MM-dd'))
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
      <div className="flex gap-3">
        <div>
          <label htmlFor="fromDate" className="label">
            From
          </label>
          <input
            type="date"
            id="fromDate"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="toDate" className="label">
            To
          </label>
          <input
            type="date"
            id="toDate"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {presets.map((preset) => (
          <button
            key={preset.days}
            onClick={() => applyPreset(preset.days)}
            className="px-3 py-2 text-sm font-medium text-mwd-blue-700 bg-lavender-100 rounded-lg hover:bg-lavender-200 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
