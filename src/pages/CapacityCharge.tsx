import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { useServiceConnectionsByAgency } from '../hooks/useServiceConnections'
import { useAgencies } from '../hooks/useAgencies'
import {
  usePeakSeasonData,
  type YearPeakSummary,
  type DailyAgencyFlow,
} from '../hooks/usePeakSeasonData'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorMessage } from '../components/common/ErrorMessage'

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: DailyAgencyFlow }[]
}) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white border border-mwd-blue-200 rounded-lg p-3 shadow-lg">
      <p className="font-medium text-mwd-blue-800">{data.date}</p>
      <p className="text-sm text-mwd-blue-600">
        Daily Avg: <strong>{data.totalCFS.toFixed(2)} CFS</strong>
      </p>
      <p className="text-sm text-mwd-blue-600">
        Volume: {data.totalVolumeAF.toFixed(2)} AF
      </p>
      {data.isPeakDay && (
        <p className="text-sm font-bold text-red-600 mt-1">Peak Day</p>
      )}
    </div>
  )
}

export function CapacityCharge() {
  const [searchParams, setSearchParams] = useSearchParams()
  const agencyParam = searchParams.get('agency')

  const {
    data: connections,
    isLoading: connectionsLoading,
    error: connectionsError,
  } = useServiceConnectionsByAgency()
  const { data: memberAgencies, isLoading: agenciesLoading } = useAgencies()

  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // Stable charge year configuration
  const chargeConfig = useMemo(() => {
    const cy = new Date().getFullYear()
    return {
      currentChargeYear: cy,
      upcomingChargeYear: cy + 1,
      currentChargeYears: [cy - 4, cy - 3, cy - 2],
      upcomingChargeYears: [cy - 3, cy - 2, cy - 1],
      allYears: [cy - 4, cy - 3, cy - 2, cy - 1],
    }
  }, [])

  const {
    currentChargeYear,
    upcomingChargeYear,
    currentChargeYears,
    upcomingChargeYears,
    allYears,
  } = chargeConfig

  // Build agency list from connections
  const agencies = useMemo(() => {
    if (!connections) return []
    return [...new Set(connections.map((c) => c.Agency))].sort()
  }, [connections])

  // Get active connections for selected agency
  const agencyConnections = useMemo(() => {
    if (!connections || !agencyParam) return []
    return connections.filter(
      (c) => c.Agency === agencyParam && c.Status === 'A'
    )
  }, [connections, agencyParam])

  const connectionIds = useMemo(
    () => agencyConnections.map((c) => c.Connection),
    [agencyConnections]
  )

  const effectiveSelectedYear = selectedYear ?? allYears[allYears.length - 1]

  // Fetch peak season data
  const { yearData, isLoading: peakLoading, loadingProgress } =
    usePeakSeasonData(
      connectionIds,
      allYears,
      !!agencyParam && connectionIds.length > 0
    )

  // Compute current and upcoming trailing max
  const currentPeak = useMemo(() => {
    const relevant = yearData.filter((y) =>
      currentChargeYears.includes(y.year)
    )
    return relevant.reduce<YearPeakSummary | null>(
      (max, y) => (!max || y.peakDayCFS > max.peakDayCFS ? y : max),
      null
    )
  }, [yearData, currentChargeYears])

  const upcomingPeak = useMemo(() => {
    const relevant = yearData.filter((y) =>
      upcomingChargeYears.includes(y.year)
    )
    return relevant.reduce<YearPeakSummary | null>(
      (max, y) => (!max || y.peakDayCFS > max.peakDayCFS ? y : max),
      null
    )
  }, [yearData, upcomingChargeYears])

  const selectedYearData = yearData.find((y) => y.year === effectiveSelectedYear)

  const isMemberAgency = useMemo(() => {
    if (!memberAgencies || !agencyParam) return false
    return memberAgencies.some((ma) => ma.LongName === agencyParam)
  }, [memberAgencies, agencyParam])

  const handleAgencyChange = (agencyName: string) => {
    if (agencyName) {
      setSearchParams({ agency: agencyName })
    } else {
      setSearchParams({})
    }
    setSelectedYear(null)
  }

  const isLoading = connectionsLoading || agenciesLoading

  if (connectionsError) {
    return (
      <ErrorMessage
        title="Failed to load data"
        message={connectionsError.message}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-mwd-blue-800">
          Capacity Charge
        </h1>
        <p className="mt-1 text-mwd-blue-600">
          Peak day flow analysis for MWD capacity charge calculations
        </p>
      </div>

      {/* Agency Selector */}
      {isLoading ? (
        <LoadingSpinner text="Loading agencies..." />
      ) : (
        <div className="card p-4">
          <label className="label mb-2 block">Select Agency</label>
          <select
            value={agencyParam || ''}
            onChange={(e) => handleAgencyChange(e.target.value)}
            className="input w-full max-w-lg"
          >
            <option value="">-- Select an agency --</option>
            {agencies.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {agencyParam && (
            <div className="mt-2 flex items-center gap-2 text-sm text-mwd-blue-500">
              <span>{agencyConnections.length} active connections</span>
              {isMemberAgency ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-mwd-blue-400 text-white">
                  Member Agency
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-lavender-200 text-mwd-blue-700">
                  Sub-agency
                </span>
              )}
              <Link
                to="/agencies"
                className="text-mwd-blue-600 hover:text-mwd-blue-800 underline ml-2"
              >
                View connections
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Content when agency is selected */}
      {agencyParam && !isLoading && (
        <>
          {/* Info Banner */}
          <div className="card p-4 bg-lavender-50 border-mwd-blue-300">
            <p className="text-sm text-mwd-blue-700">
              The capacity charge is based on the{' '}
              <strong>highest single-day flow</strong> (in CFS) across all
              connections during the peak season (May 1 &ndash; Sep 30), using a{' '}
              <strong>three-year trailing maximum</strong> with a{' '}
              <strong>one-year lag</strong>.
              {!isMemberAgency && (
                <>
                  {' '}
                  This sub-agency&apos;s peak day contributes to its member
                  agency&apos;s capacity charge allocation from MWD.
                </>
              )}
            </p>
          </div>

          {/* Loading Progress */}
          {peakLoading && (
            <div className="card p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-mwd-blue-600 mb-1">
                    <span>Loading peak season data...</span>
                    <span>{Math.round(loadingProgress * 100)}%</span>
                  </div>
                  <div className="w-full bg-lavender-200 rounded-full h-2">
                    <div
                      className="bg-mwd-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-mwd-blue-500 mt-2">
                Fetching interval data for {connectionIds.length} connections
                across {allYears.length} peak seasons
              </p>
            </div>
          )}

          {/* Summary Cards */}
          {(currentPeak || upcomingPeak) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Charge */}
              <div className="card p-5 border-2 border-mwd-blue-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-mwd-blue-800">
                    Current Charge ({currentChargeYear})
                  </h3>
                  <span className="text-xs px-2 py-1 bg-mwd-blue-100 text-mwd-blue-700 rounded">
                    Summers {currentChargeYears[0]}&ndash;
                    {currentChargeYears[2]}
                  </span>
                </div>
                {currentPeak?.peakDay ? (
                  <>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: '#164876' }}
                    >
                      {currentPeak.peakDayCFS.toFixed(2)}{' '}
                      <span className="text-base font-normal">CFS</span>
                    </p>
                    <p className="text-sm text-mwd-blue-500 mt-1">
                      Peak set on {currentPeak.peakDay.date} (Summer{' '}
                      {currentPeak.year})
                    </p>
                  </>
                ) : (
                  <p className="text-mwd-blue-500">
                    {peakLoading ? 'Loading...' : 'No data available'}
                  </p>
                )}
              </div>

              {/* Upcoming Charge */}
              <div className="card p-5 border-2 border-mwd-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-mwd-blue-800">
                    Upcoming Charge ({upcomingChargeYear})
                  </h3>
                  <span className="text-xs px-2 py-1 bg-lavender-100 text-mwd-blue-700 rounded">
                    Summers {upcomingChargeYears[0]}&ndash;
                    {upcomingChargeYears[2]}
                  </span>
                </div>
                {upcomingPeak?.peakDay ? (
                  <>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: '#2e74a8' }}
                    >
                      {upcomingPeak.peakDayCFS.toFixed(2)}{' '}
                      <span className="text-base font-normal">CFS</span>
                    </p>
                    <p className="text-sm text-mwd-blue-500 mt-1">
                      Peak set on {upcomingPeak.peakDay.date} (Summer{' '}
                      {upcomingPeak.year})
                    </p>
                    {currentPeak &&
                      currentPeak.peakDayCFS > 0 &&
                      upcomingPeak.peakDayCFS !== currentPeak.peakDayCFS && (
                        <p
                          className={`text-sm mt-1 font-medium ${
                            upcomingPeak.peakDayCFS > currentPeak.peakDayCFS
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {upcomingPeak.peakDayCFS > currentPeak.peakDayCFS
                            ? '\u2191'
                            : '\u2193'}{' '}
                          {Math.abs(
                            upcomingPeak.peakDayCFS - currentPeak.peakDayCFS
                          ).toFixed(2)}{' '}
                          CFS (
                          {upcomingPeak.peakDayCFS > currentPeak.peakDayCFS
                            ? '+'
                            : ''}
                          {(
                            ((upcomingPeak.peakDayCFS -
                              currentPeak.peakDayCFS) /
                              currentPeak.peakDayCFS) *
                            100
                          ).toFixed(1)}
                          %)
                        </p>
                      )}
                  </>
                ) : (
                  <p className="text-mwd-blue-500">
                    {peakLoading ? 'Loading...' : 'No data available'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Year Peak Summary Table */}
          {yearData.some((y) => y.dailyFlows.length > 0) && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-mwd-blue-200">
                <h3 className="font-semibold text-mwd-blue-800">
                  Peak Day by Year
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-lavender-50">
                      <th className="text-left px-4 py-3 font-medium text-mwd-blue-700">
                        Summer
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-mwd-blue-700">
                        Peak Day
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-mwd-blue-700">
                        Peak CFS
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-mwd-blue-700">
                        Peak Day Vol (AF)
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-mwd-blue-700">
                        Current ({currentChargeYear})
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-mwd-blue-700">
                        Upcoming ({upcomingChargeYear})
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-mwd-blue-700">
                        Days
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearData.map((yd) => {
                      const isInCurrent = currentChargeYears.includes(yd.year)
                      const isInUpcoming = upcomingChargeYears.includes(yd.year)
                      const isCurrentMax =
                        currentPeak?.year === yd.year &&
                        currentPeak?.peakDayCFS === yd.peakDayCFS
                      const isUpcomingMax =
                        upcomingPeak?.year === yd.year &&
                        upcomingPeak?.peakDayCFS === yd.peakDayCFS

                      return (
                        <tr
                          key={yd.year}
                          className={`border-b border-mwd-blue-100 ${
                            isCurrentMax || isUpcomingMax ? 'bg-lavender-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedYear(yd.year)}
                              className="text-mwd-blue-600 hover:text-mwd-blue-800 font-medium"
                            >
                              {yd.year}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-mwd-blue-800">
                            {yd.peakDay?.date ?? '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-mwd-blue-800">
                            {yd.peakDayCFS > 0
                              ? yd.peakDayCFS.toFixed(2)
                              : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-mwd-blue-600">
                            {yd.peakDay
                              ? yd.peakDay.totalVolumeAF.toFixed(2)
                              : '\u2014'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isInCurrent && (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                                  isCurrentMax
                                    ? 'bg-mwd-blue-600 text-white font-bold'
                                    : 'bg-mwd-blue-200 text-mwd-blue-600'
                                }`}
                              >
                                {isCurrentMax ? '\u2605' : '\u2713'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isInUpcoming && (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                                  isUpcomingMax
                                    ? 'bg-mwd-blue-400 text-white font-bold'
                                    : 'bg-lavender-200 text-mwd-blue-600'
                                }`}
                              >
                                {isUpcomingMax ? '\u2605' : '\u2713'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-mwd-blue-500">
                            {yd.daysWithData}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Year Tabs + Chart */}
          {yearData.some((y) => y.dailyFlows.length > 0) && (
            <div className="card">
              {/* Year Tabs */}
              <div className="p-4 border-b border-mwd-blue-200 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-mwd-blue-600 mr-2">
                  Peak Season:
                </span>
                {allYears.map((year) => {
                  const yd = yearData.find((y) => y.year === year)
                  return (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        effectiveSelectedYear === year
                          ? 'text-white'
                          : 'bg-lavender-100 text-mwd-blue-700 hover:bg-lavender-200'
                      }`}
                      style={
                        effectiveSelectedYear === year
                          ? { backgroundColor: '#164876' }
                          : undefined
                      }
                    >
                      {year}
                      {yd && yd.peakDayCFS > 0
                        ? ` (${yd.peakDayCFS.toFixed(1)})`
                        : ''}
                    </button>
                  )
                })}
              </div>

              {/* Chart */}
              {selectedYearData && selectedYearData.dailyFlows.length > 0 ? (
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h3 className="font-semibold text-mwd-blue-800">
                      Daily Average Flow &mdash; Summer {effectiveSelectedYear}
                    </h3>
                    {selectedYearData.peakDay && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-block w-3 h-3 rounded bg-red-500" />
                        <span className="text-mwd-blue-700">
                          Peak: {selectedYearData.peakDay.date} (
                          {selectedYearData.peakDayCFS.toFixed(2)} CFS)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedYearData.dailyFlows}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="displayDate"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          label={{
                            value: 'Daily Avg CFS',
                            angle: -90,
                            position: 'insideLeft',
                          }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        {selectedYearData.peakDay && (
                          <ReferenceLine
                            y={selectedYearData.peakDayCFS}
                            stroke="#ef4444"
                            strokeDasharray="5 5"
                            strokeWidth={1}
                          />
                        )}
                        <Bar dataKey="totalCFS" name="Daily Avg CFS">
                          {selectedYearData.dailyFlows.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.isPeakDay ? '#ef4444' : '#4a90c4'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="bg-lavender-50 rounded-lg p-3">
                      <p className="text-xs text-mwd-blue-500">
                        Season Volume
                      </p>
                      <p className="font-semibold text-mwd-blue-800">
                        {selectedYearData.totalSeasonVolumeAF.toLocaleString()}{' '}
                        AF
                      </p>
                    </div>
                    <div className="bg-lavender-50 rounded-lg p-3">
                      <p className="text-xs text-mwd-blue-500">Peak Day CFS</p>
                      <p className="font-semibold text-mwd-blue-800">
                        {selectedYearData.peakDayCFS.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-lavender-50 rounded-lg p-3">
                      <p className="text-xs text-mwd-blue-500">
                        Peak Day Volume
                      </p>
                      <p className="font-semibold text-mwd-blue-800">
                        {selectedYearData.peakDay?.totalVolumeAF.toFixed(2) ??
                          '\u2014'}{' '}
                        AF
                      </p>
                    </div>
                    <div className="bg-lavender-50 rounded-lg p-3">
                      <p className="text-xs text-mwd-blue-500">
                        Days with Data
                      </p>
                      <p className="font-semibold text-mwd-blue-800">
                        {selectedYearData.daysWithData}
                      </p>
                    </div>
                  </div>
                </div>
              ) : selectedYearData ? (
                <div className="p-8 text-center text-mwd-blue-500">
                  <p className="font-medium">
                    No data available for Summer {effectiveSelectedYear}
                  </p>
                  <p className="text-sm">
                    Interval data may not be available for this period
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* No data at all */}
          {!peakLoading &&
            yearData.length > 0 &&
            yearData.every((y) => y.dailyFlows.length === 0) && (
              <div className="card p-8 text-center text-mwd-blue-500">
                <p className="font-medium">No peak season data available</p>
                <p className="text-sm mt-1">
                  No interval data was found for {agencyParam}&apos;s
                  connections during the May&ndash;September peak seasons of{' '}
                  {allYears.join(', ')}.
                </p>
              </div>
            )}
        </>
      )}

      {/* No agency selected */}
      {!agencyParam && !isLoading && (
        <div className="card p-12 text-center text-mwd-blue-500">
          <svg
            className="mx-auto h-12 w-12 text-mwd-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <p className="mt-4 font-medium">
            Select an agency to view capacity charge analysis
          </p>
          <p className="text-sm mt-1">
            Choose an agency from the dropdown above, or navigate here from the{' '}
            <Link
              to="/agencies"
              className="text-mwd-blue-600 hover:text-mwd-blue-800 underline"
            >
              Agencies page
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
