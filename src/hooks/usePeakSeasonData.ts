import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
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

export function usePeakSeasonData(
  connectionIds: string[],
  years: number[],
  enabled: boolean = true
) {
  const shouldFetch = enabled && connectionIds.length > 0 && years.length > 0

  const queries = useMemo(() => {
    if (!shouldFetch) return []
    return connectionIds.flatMap((connId) =>
      years.map((year) => ({
        queryKey: ['peakSeason', connId, year] as const,
        queryFn: () =>
          fetchApi<MeterInterval[]>(
            `MeterInterval/${connId}/${year}-05-01/${year}-09-30`
          ),
        staleTime: 24 * 60 * 60 * 1000,
        retry: 1,
        enabled: shouldFetch,
      }))
    )
  }, [connectionIds, years, shouldFetch])

  const results = useQueries({ queries })

  return useMemo(() => {
    if (!shouldFetch || queries.length === 0) {
      return {
        yearData: [] as YearPeakSummary[],
        isLoading: false,
        loadingProgress: 1,
        hasErrors: false,
      }
    }

    const totalQueries = queries.length
    const completedQueries = results.filter((r) => !r.isLoading).length
    const isLoading = results.some((r) => r.isLoading)
    const hasErrors = results.some((r) => r.isError)
    const loadingProgress =
      totalQueries > 0 ? completedQueries / totalQueries : 1

    // Group interval data by year
    // Result index maps to: connectionIds[ci] × years[yi]
    // index = ci * years.length + yi
    const yearIntervals = new Map<number, MeterInterval[]>()
    for (const year of years) {
      yearIntervals.set(year, [])
    }

    let resultIdx = 0
    for (let ci = 0; ci < connectionIds.length; ci++) {
      for (let yi = 0; yi < years.length; yi++) {
        const result = results[resultIdx]
        if (result?.data && !result.isLoading) {
          yearIntervals.get(years[yi])!.push(...result.data)
        }
        resultIdx++
      }
    }

    const yearData: YearPeakSummary[] = years.map((year) =>
      aggregateToYearSummary(year, yearIntervals.get(year) || [])
    )

    return { yearData, isLoading, loadingProgress, hasErrors }
  }, [results, queries, years, connectionIds, shouldFetch])
}

function aggregateToYearSummary(
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
  // Daily avg CFS = totalVolume(AF) * 43560(CF/AF) / 86400(s/day)
  const dailyFlows: DailyAgencyFlow[] = Array.from(dailyVolumeMap.entries())
    .map(([date, volumeAF]) => {
      const [, m, d] = date.split('-')
      return {
        date,
        displayDate: `${m}/${d}`,
        totalCFS: Number(((volumeAF * 43560) / 86400).toFixed(2)),
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
