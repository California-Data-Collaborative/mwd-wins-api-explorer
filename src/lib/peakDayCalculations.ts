import { MeterInterval } from '../api/types'

export interface DailyAgencyFlow {
  date: string
  displayDate: string
  totalCFS: number
  totalVolumeAF: number
  isPeakDay: boolean
}

export interface YearPeakSummary {
  year: number
  dailyFlows: DailyAgencyFlow[]
  peakDay: DailyAgencyFlow | null
  peakDayCFS: number
  totalSeasonVolumeAF: number
  daysWithData: number
}

/**
 * Convert acre-feet to daily average CFS.
 * Daily avg CFS = volume(AF) * 43560(CF/AF) / 86400(s/day)
 */
export function acreFeeToDailyCFS(volumeAF: number): number {
  return (volumeAF * 43560) / 86400
}

/**
 * Aggregate raw 15-minute meter interval records into a per-year summary
 * of daily agency flows (summed across all connections), identifying the
 * peak day within the season.
 */
export function aggregateToYearSummary(
  year: number,
  intervals: MeterInterval[]
): YearPeakSummary {
  if (intervals.length === 0) {
    return {
      year,
      dailyFlows: [],
      peakDay: null,
      peakDayCFS: 0,
      totalSeasonVolumeAF: 0,
      daysWithData: 0,
    }
  }

  // Sum volume by date across all connections/intervals
  const dailyVolumeMap = new Map<string, number>()
  for (const interval of intervals) {
    const date = interval.MeterDate.split('T')[0]
    dailyVolumeMap.set(date, (dailyVolumeMap.get(date) || 0) + interval.Volume)
  }

  // Convert to daily average CFS
  const dailyFlows: DailyAgencyFlow[] = Array.from(dailyVolumeMap.entries())
    .map(([date, volumeAF]) => {
      const [, m, d] = date.split('-')
      return {
        date,
        displayDate: `${m}/${d}`,
        totalCFS: Number(acreFeeToDailyCFS(volumeAF).toFixed(2)),
        totalVolumeAF: Number(volumeAF.toFixed(4)),
        isPeakDay: false,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  // Find and mark peak day
  let peakDay: DailyAgencyFlow | null = null
  if (dailyFlows.length > 0) {
    const peakIdx = dailyFlows.reduce(
      (maxIdx, flow, idx) =>
        flow.totalCFS > dailyFlows[maxIdx].totalCFS ? idx : maxIdx,
      0
    )
    dailyFlows[peakIdx].isPeakDay = true
    peakDay = dailyFlows[peakIdx]
  }

  const totalSeasonVolumeAF = dailyFlows.reduce(
    (sum, d) => sum + d.totalVolumeAF,
    0
  )

  return {
    year,
    dailyFlows,
    peakDay,
    peakDayCFS: peakDay?.totalCFS ?? 0,
    totalSeasonVolumeAF: Number(totalSeasonVolumeAF.toFixed(2)),
    daysWithData: dailyFlows.length,
  }
}

/**
 * Determine which years fall in the current and upcoming charge windows.
 * Charge year Y uses peak seasons Y-4, Y-3, Y-2 (three-year trailing max with one-year lag).
 */
export function getChargeYearConfig(currentYear: number) {
  return {
    currentChargeYear: currentYear,
    upcomingChargeYear: currentYear + 1,
    currentChargeYears: [currentYear - 4, currentYear - 3, currentYear - 2] as const,
    upcomingChargeYears: [currentYear - 3, currentYear - 2, currentYear - 1] as const,
    allYears: [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1],
  }
}

/**
 * Find the year with the highest peak day CFS from a set of year summaries,
 * filtered to only the specified years.
 */
export function findTrailingMaxPeak(
  yearData: YearPeakSummary[],
  windowYears: readonly number[]
): YearPeakSummary | null {
  const relevant = yearData.filter((y) => windowYears.includes(y.year))
  return relevant.reduce<YearPeakSummary | null>(
    (max, y) => (!max || y.peakDayCFS > max.peakDayCFS ? y : max),
    null
  )
}
