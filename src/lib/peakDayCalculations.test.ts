import { describe, it, expect } from 'vitest'
import { MeterInterval } from '../api/types'
import {
  acreFeeToDailyCFS,
  aggregateToYearSummary,
  getChargeYearConfig,
  findTrailingMaxPeak,
  type YearPeakSummary,
} from './peakDayCalculations'

// Helper to create a MeterInterval record
function makeInterval(
  date: string,
  volume: number,
  meterId = 'OC-01',
  intervalNum = 1
): MeterInterval {
  return {
    MeterDate: date,
    MeterID: meterId,
    Flow: 0, // Flow is not used in aggregation; volume is
    StartDate: date,
    EndDate: date,
    BillCustID: '',
    IntervalNum: intervalNum,
    EndMeterReading: 0,
    Volume: volume,
    ProcessedFlag: '',
  }
}

// ---------------------------------------------------------------------------
// acreFeeToDailyCFS
// ---------------------------------------------------------------------------
describe('acreFeeToDailyCFS', () => {
  it('converts 0 AF to 0 CFS', () => {
    expect(acreFeeToDailyCFS(0)).toBe(0)
  })

  it('converts 1 AF/day to ~0.50417 CFS', () => {
    // 1 AF = 43560 CF; spread over 86400 seconds = 0.504166... CFS
    const cfs = acreFeeToDailyCFS(1)
    expect(cfs).toBeCloseTo(0.50417, 4)
  })

  it('converts 1.983 AF/day to ~1 CFS', () => {
    // 1 CFS sustained for a full day = 1.983 AF
    // So 1.983 AF should convert back to ~1 CFS
    const cfs = acreFeeToDailyCFS(1.983)
    expect(cfs).toBeCloseTo(1.0, 1)
  })

  it('scales linearly', () => {
    const cfs10 = acreFeeToDailyCFS(10)
    const cfs20 = acreFeeToDailyCFS(20)
    expect(cfs20).toBeCloseTo(cfs10 * 2, 10)
  })
})

// ---------------------------------------------------------------------------
// aggregateToYearSummary
// ---------------------------------------------------------------------------
describe('aggregateToYearSummary', () => {
  it('returns empty summary for no intervals', () => {
    const result = aggregateToYearSummary(2024, [])
    expect(result.year).toBe(2024)
    expect(result.dailyFlows).toHaveLength(0)
    expect(result.peakDay).toBeNull()
    expect(result.peakDayCFS).toBe(0)
    expect(result.totalSeasonVolumeAF).toBe(0)
    expect(result.daysWithData).toBe(0)
  })

  it('aggregates a single interval into one daily flow', () => {
    const intervals = [makeInterval('2024-07-15', 1.983)]
    const result = aggregateToYearSummary(2024, intervals)

    expect(result.daysWithData).toBe(1)
    expect(result.dailyFlows).toHaveLength(1)

    const day = result.dailyFlows[0]
    expect(day.date).toBe('2024-07-15')
    expect(day.displayDate).toBe('07/15')
    expect(day.totalVolumeAF).toBeCloseTo(1.983, 3)
    // 1.983 AF ≈ 1.0 CFS
    expect(day.totalCFS).toBeCloseTo(1.0, 1)
    expect(day.isPeakDay).toBe(true)
  })

  it('sums multiple intervals on the same day', () => {
    // 96 intervals of equal volume should sum correctly
    const volumePerInterval = 2.0 / 96 // total 2.0 AF for the day
    const intervals = Array.from({ length: 96 }, (_, i) =>
      makeInterval('2024-08-01', volumePerInterval, 'OC-01', i + 1)
    )
    const result = aggregateToYearSummary(2024, intervals)

    expect(result.daysWithData).toBe(1)
    expect(result.dailyFlows[0].totalVolumeAF).toBeCloseTo(2.0, 2)
    // 2.0 AF → ~1.00833 CFS
    expect(result.dailyFlows[0].totalCFS).toBeCloseTo(
      acreFeeToDailyCFS(2.0),
      1
    )
  })

  it('sums volumes across multiple connections on the same day', () => {
    const intervals = [
      makeInterval('2024-07-20', 1.0, 'OC-01'),
      makeInterval('2024-07-20', 1.5, 'OC-02'),
      makeInterval('2024-07-20', 0.5, 'OC-03'),
    ]
    const result = aggregateToYearSummary(2024, intervals)

    expect(result.daysWithData).toBe(1)
    // Total volume = 1.0 + 1.5 + 0.5 = 3.0 AF
    expect(result.dailyFlows[0].totalVolumeAF).toBeCloseTo(3.0, 4)
    expect(result.dailyFlows[0].totalCFS).toBeCloseTo(
      acreFeeToDailyCFS(3.0),
      1
    )
  })

  it('identifies the correct peak day across multiple days', () => {
    const intervals = [
      makeInterval('2024-06-01', 2.0), // lower
      makeInterval('2024-07-15', 5.0), // highest
      makeInterval('2024-08-20', 3.0), // middle
    ]
    const result = aggregateToYearSummary(2024, intervals)

    expect(result.daysWithData).toBe(3)
    expect(result.peakDay).not.toBeNull()
    expect(result.peakDay!.date).toBe('2024-07-15')
    expect(result.peakDay!.isPeakDay).toBe(true)
    expect(result.peakDayCFS).toBeCloseTo(acreFeeToDailyCFS(5.0), 1)

    // Non-peak days should NOT be marked
    const nonPeakDays = result.dailyFlows.filter((d) => !d.isPeakDay)
    expect(nonPeakDays).toHaveLength(2)
  })

  it('only marks one peak day even when there are ties', () => {
    const intervals = [
      makeInterval('2024-06-01', 5.0),
      makeInterval('2024-07-15', 5.0),
    ]
    const result = aggregateToYearSummary(2024, intervals)

    const peakDays = result.dailyFlows.filter((d) => d.isPeakDay)
    expect(peakDays).toHaveLength(1)
    // First occurrence wins (reduce keeps earlier index on equal)
    expect(peakDays[0].date).toBe('2024-06-01')
  })

  it('sorts daily flows chronologically', () => {
    const intervals = [
      makeInterval('2024-09-01', 1.0),
      makeInterval('2024-05-15', 2.0),
      makeInterval('2024-07-04', 3.0),
    ]
    const result = aggregateToYearSummary(2024, intervals)

    const dates = result.dailyFlows.map((d) => d.date)
    expect(dates).toEqual(['2024-05-15', '2024-07-04', '2024-09-01'])
  })

  it('computes total season volume correctly', () => {
    const intervals = [
      makeInterval('2024-06-01', 2.0),
      makeInterval('2024-07-15', 3.0),
      makeInterval('2024-08-20', 1.5),
    ]
    const result = aggregateToYearSummary(2024, intervals)

    expect(result.totalSeasonVolumeAF).toBeCloseTo(6.5, 1)
  })

  it('handles ISO datetime format in MeterDate', () => {
    const intervals = [
      makeInterval('2024-07-15T00:00:00Z', 2.0),
      makeInterval('2024-07-15T12:00:00Z', 1.0),
    ]
    const result = aggregateToYearSummary(2024, intervals)

    // Both should aggregate to the same day
    expect(result.daysWithData).toBe(1)
    expect(result.dailyFlows[0].totalVolumeAF).toBeCloseTo(3.0, 4)
  })

  it('handles mixed connections across multiple days', () => {
    const intervals = [
      // Day 1: two connections
      makeInterval('2024-07-01', 1.0, 'OC-01'),
      makeInterval('2024-07-01', 2.0, 'OC-02'),
      // Day 2: three connections — this should be peak
      makeInterval('2024-07-02', 1.5, 'OC-01'),
      makeInterval('2024-07-02', 2.5, 'OC-02'),
      makeInterval('2024-07-02', 1.0, 'OC-03'),
      // Day 3: one connection
      makeInterval('2024-07-03', 0.5, 'OC-01'),
    ]
    const result = aggregateToYearSummary(2024, intervals)

    expect(result.daysWithData).toBe(3)
    // Day 1: 3.0 AF, Day 2: 5.0 AF (peak), Day 3: 0.5 AF
    expect(result.peakDay!.date).toBe('2024-07-02')
    expect(result.peakDay!.totalVolumeAF).toBeCloseTo(5.0, 4)
    expect(result.peakDayCFS).toBeCloseTo(acreFeeToDailyCFS(5.0), 1)
  })
})

// ---------------------------------------------------------------------------
// getChargeYearConfig
// ---------------------------------------------------------------------------
describe('getChargeYearConfig', () => {
  it('computes correct windows for 2026', () => {
    const config = getChargeYearConfig(2026)

    expect(config.currentChargeYear).toBe(2026)
    expect(config.upcomingChargeYear).toBe(2027)
    expect(config.currentChargeYears).toEqual([2022, 2023, 2024])
    expect(config.upcomingChargeYears).toEqual([2023, 2024, 2025])
    expect(config.allYears).toEqual([2022, 2023, 2024, 2025])
  })

  it('computes correct windows for 2021 (matches known data)', () => {
    // "2017, 2018 & 2019 flows are used to calculate the 2021 charge"
    const config = getChargeYearConfig(2021)

    expect(config.currentChargeYears).toEqual([2017, 2018, 2019])
    expect(config.upcomingChargeYears).toEqual([2018, 2019, 2020])
  })

  it('allYears contains exactly 4 unique sorted years', () => {
    const config = getChargeYearConfig(2030)

    expect(config.allYears).toHaveLength(4)
    expect(config.allYears).toEqual([2026, 2027, 2028, 2029])
    // Should be sorted
    for (let i = 1; i < config.allYears.length; i++) {
      expect(config.allYears[i]).toBeGreaterThan(config.allYears[i - 1])
    }
  })

  it('current and upcoming windows overlap by 2 years', () => {
    const config = getChargeYearConfig(2026)
    const overlap = config.currentChargeYears.filter((y) =>
      config.upcomingChargeYears.includes(y)
    )
    expect(overlap).toHaveLength(2)
    expect(overlap).toEqual([2023, 2024])
  })
})

// ---------------------------------------------------------------------------
// findTrailingMaxPeak
// ---------------------------------------------------------------------------
describe('findTrailingMaxPeak', () => {
  const yearData: YearPeakSummary[] = [
    {
      year: 2022,
      dailyFlows: [],
      peakDay: { date: '2022-07-15', displayDate: '07/15', totalCFS: 30.0, totalVolumeAF: 59.49, isPeakDay: true },
      peakDayCFS: 30.0,
      totalSeasonVolumeAF: 500,
      daysWithData: 153,
    },
    {
      year: 2023,
      dailyFlows: [],
      peakDay: { date: '2023-08-02', displayDate: '08/02', totalCFS: 45.0, totalVolumeAF: 89.235, isPeakDay: true },
      peakDayCFS: 45.0,
      totalSeasonVolumeAF: 600,
      daysWithData: 153,
    },
    {
      year: 2024,
      dailyFlows: [],
      peakDay: { date: '2024-06-28', displayDate: '06/28', totalCFS: 38.0, totalVolumeAF: 75.354, isPeakDay: true },
      peakDayCFS: 38.0,
      totalSeasonVolumeAF: 550,
      daysWithData: 153,
    },
    {
      year: 2025,
      dailyFlows: [],
      peakDay: { date: '2025-07-20', displayDate: '07/20', totalCFS: 50.0, totalVolumeAF: 99.15, isPeakDay: true },
      peakDayCFS: 50.0,
      totalSeasonVolumeAF: 650,
      daysWithData: 153,
    },
  ]

  it('finds max peak in current charge window (2022-2024)', () => {
    const result = findTrailingMaxPeak(yearData, [2022, 2023, 2024])
    expect(result).not.toBeNull()
    expect(result!.year).toBe(2023)
    expect(result!.peakDayCFS).toBe(45.0)
  })

  it('finds max peak in upcoming charge window (2023-2025)', () => {
    const result = findTrailingMaxPeak(yearData, [2023, 2024, 2025])
    expect(result).not.toBeNull()
    expect(result!.year).toBe(2025)
    expect(result!.peakDayCFS).toBe(50.0)
  })

  it('returns null for empty year data', () => {
    const result = findTrailingMaxPeak([], [2022, 2023, 2024])
    expect(result).toBeNull()
  })

  it('returns null when no years match the window', () => {
    const result = findTrailingMaxPeak(yearData, [2010, 2011, 2012])
    expect(result).toBeNull()
  })

  it('handles window with a single year', () => {
    const result = findTrailingMaxPeak(yearData, [2024])
    expect(result).not.toBeNull()
    expect(result!.year).toBe(2024)
    expect(result!.peakDayCFS).toBe(38.0)
  })

  it('correctly picks max when all years have same peak', () => {
    const tiedData: YearPeakSummary[] = [
      { year: 2022, dailyFlows: [], peakDay: null, peakDayCFS: 40.0, totalSeasonVolumeAF: 0, daysWithData: 0 },
      { year: 2023, dailyFlows: [], peakDay: null, peakDayCFS: 40.0, totalSeasonVolumeAF: 0, daysWithData: 0 },
    ]
    const result = findTrailingMaxPeak(tiedData, [2022, 2023])
    expect(result).not.toBeNull()
    // First year wins on tie (reduce picks later only if strictly greater)
    expect(result!.year).toBe(2022)
  })

  it('ignores years outside the window', () => {
    // 2025 has the highest peak (50.0) but is not in the window
    const result = findTrailingMaxPeak(yearData, [2022, 2024])
    expect(result).not.toBeNull()
    expect(result!.peakDayCFS).toBe(38.0) // 2024, not 2025's 50.0
  })
})
