import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
import { MeterInterval } from '../api/types'
import { aggregateToYearSummary } from '../lib/peakDayCalculations'
import type { YearPeakSummary } from '../lib/peakDayCalculations'

export type { DailyAgencyFlow, YearPeakSummary } from '../lib/peakDayCalculations'

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
