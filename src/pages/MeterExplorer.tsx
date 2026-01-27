import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useMeters } from '../hooks/useMeters'
import { useServiceConnectionsByAgency } from '../hooks/useServiceConnections'
import { useCurrentFlow } from '../hooks/useCurrentFlow'
import { useMeterInterval } from '../hooks/useMeterInterval'
import { useMeterRead } from '../hooks/useMeterRead'
import { SearchInput } from '../components/common/SearchInput'
import { DateRangePicker } from '../components/common/DateRangePicker'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { StatCard } from '../components/common/StatCard'
import { DataTable } from '../components/common/DataTable'

type ChartType = 'flow' | 'volume' | 'cumulative'

export function MeterExplorer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || searchParams.get('meter') || ''

  const { data: meters, isLoading: metersLoading, error: metersError, refetch } = useMeters()
  const { data: connections } = useServiceConnectionsByAgency()

  const [search, setSearch] = useState(initialSearch)
  const [selectedMeter, setSelectedMeter] = useState<string | null>(initialSearch || null)

  // Interval data state
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 8), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'))
  const [chartType, setChartType] = useState<ChartType>('flow')
  const [showTable, setShowTable] = useState(false)

  // Hooks
  const { data: currentFlow, isLoading: flowLoading } = useCurrentFlow(selectedMeter)
  const {
    data: intervalData,
    isLoading: intervalLoading,
    error: intervalError,
    refetch: refetchInterval,
  } = useMeterInterval(selectedMeter, fromDate, toDate)
  const { data: meterRead } = useMeterRead(selectedMeter, fromDate, toDate)

  const filteredMeters = useMemo(() => {
    if (!meters) return []
    return meters.filter((meter) =>
      meter.MeterID.toLowerCase().includes(search.toLowerCase())
    )
  }, [meters, search])

  const connectionInfo = useMemo(() => {
    if (!connections || !selectedMeter) return null
    return connections.find((c) => c.Connection === selectedMeter)
  }, [connections, selectedMeter])

  const chartData = useMemo(() => {
    if (!intervalData) return []

    let cumulativeVolume = 0
    return intervalData.map((item) => {
      cumulativeVolume += item.Volume

      // Parse date string manually to avoid timezone issues
      // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SSZ" formats
      const dateStr = item.MeterDate.split('T')[0]
      const [, month, day] = dateStr.split('-').map(Number)

      // IntervalNum 1-96 represents 15-minute intervals starting at 00:00
      const hours = Math.floor((item.IntervalNum - 1) / 4)
      const minutes = ((item.IntervalNum - 1) % 4) * 15

      return {
        ...item,
        datetime: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        dateOnly: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
        cumulativeVolume: Number(cumulativeVolume.toFixed(4)),
      }
    })
  }, [intervalData])

  const stats = useMemo(() => {
    if (!intervalData || intervalData.length === 0) {
      return { totalVolume: 0, avgFlow: 0, maxFlow: 0, minFlow: 0 }
    }

    const totalVolume = intervalData.reduce((sum, item) => sum + item.Volume, 0)
    const flows = intervalData.map((item) => item.Flow)
    const avgFlow = flows.reduce((sum, f) => sum + f, 0) / flows.length
    const maxFlow = Math.max(...flows)
    const minFlow = Math.min(...flows)

    return {
      totalVolume: Number(totalVolume.toFixed(4)),
      avgFlow: Number(avgFlow.toFixed(2)),
      maxFlow: Number(maxFlow.toFixed(2)),
      minFlow: Number(minFlow.toFixed(2)),
    }
  }, [intervalData])

  const handleSearch = (value: string) => {
    setSearch(value)
    if (value) {
      setSearchParams({ search: value })
    } else {
      setSearchParams({})
    }
  }

  const handleMeterSelect = (meterId: string) => {
    setSelectedMeter(meterId)
    setSearchParams({ meter: meterId })
  }

  const exportData = (exportFormat: 'csv' | 'json') => {
    if (!intervalData) return

    if (exportFormat === 'csv') {
      const headers = ['MeterID', 'Date', 'Interval', 'Flow (CFS)', 'Volume (AF)', 'End Reading']
      const rows = intervalData.map((item) => [
        item.MeterID,
        item.MeterDate,
        item.IntervalNum,
        item.Flow,
        item.Volume,
        item.EndMeterReading,
      ])
      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
      downloadFile(csv, `${selectedMeter}_interval_data.csv`, 'text/csv')
    } else {
      const json = JSON.stringify(
        {
          meter: selectedMeter,
          dateRange: { from: fromDate, to: toDate },
          data: intervalData,
        },
        null,
        2
      )
      downloadFile(json, `${selectedMeter}_interval_data.json`, 'application/json')
    }
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const tableColumns = [
    { key: 'MeterDate', header: 'Date' },
    { key: 'IntervalNum', header: 'Interval' },
    { key: 'Flow', header: 'Flow (CFS)' },
    { key: 'Volume', header: 'Volume (AF)' },
    { key: 'EndMeterReading', header: 'End Reading' },
  ]

  if (metersError) {
    return (
      <ErrorMessage
        title="Failed to load meters"
        message={metersError.message}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mwd-blue-800">Meter Explorer</h1>
        <p className="mt-1 text-mwd-blue-600">
          Search meters, view details, and visualize interval data
        </p>
      </div>

      {metersLoading ? (
        <LoadingSpinner text="Loading meters..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Meter List - Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <div className="p-4 border-b border-mwd-blue-200">
                <SearchInput
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search meters (e.g., OC-81)..."
                />
                <p className="mt-2 text-sm text-mwd-blue-500">
                  {filteredMeters.length} meters found
                </p>
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredMeters.slice(0, 100).map((meter) => (
                  <button
                    key={meter.MeterID}
                    onClick={() => handleMeterSelect(meter.MeterID)}
                    className={`w-full px-4 py-3 text-left border-b border-mwd-blue-100 hover:bg-lavender-50 transition-colors ${
                      selectedMeter === meter.MeterID ? 'bg-lavender-100' : ''
                    }`}
                  >
                    <p className="font-medium text-mwd-blue-800">{meter.MeterID}</p>
                    {meter.Size && (
                      <p className="text-sm text-mwd-blue-500">Size: {meter.Size}</p>
                    )}
                  </button>
                ))}
                {filteredMeters.length > 100 && (
                  <p className="px-4 py-3 text-sm text-mwd-blue-500 bg-lavender-100">
                    Showing first 100 of {filteredMeters.length} meters. Refine your search.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedMeter ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-mwd-blue-800">
                        {selectedMeter}
                      </h2>
                      {connectionInfo?.Status === 'A' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/playground?endpoint=meter-interval&MeterID=${selectedMeter}`}
                      className="btn-secondary text-sm"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      API Playground
                    </Link>
                  </div>
                </div>

                {/* Connection Details & Current Flow */}
                <div className="card p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-mwd-blue-800 rounded-lg p-3">
                      <p className="text-xs font-medium text-white/80">Current Flow</p>
                      {flowLoading ? (
                        <p className="text-xl font-bold text-white">...</p>
                      ) : currentFlow && currentFlow[0] ? (
                        <p className="text-xl font-bold text-white">
                          {currentFlow[0].Flow} <span className="text-xs font-normal">CFS</span>
                        </p>
                      ) : (
                        <p className="text-xl font-bold text-white">N/A</p>
                      )}
                    </div>
                    {connectionInfo && (
                      <>
                        <div className="bg-lavender-100 rounded-lg p-3">
                          <p className="text-xs font-medium text-mwd-blue-600">Capacity</p>
                          <p className="text-xl font-bold text-mwd-blue-800">
                            {connectionInfo.OriginalCapacity || 'N/A'}
                            <span className="text-xs font-normal"> CFS</span>
                          </p>
                        </div>
                        <div className="bg-lavender-100 rounded-lg p-3">
                          <p className="text-xs font-medium text-mwd-blue-600">Reading Type</p>
                          <p className="text-xl font-bold text-mwd-blue-800">
                            {connectionInfo.ReadingType}
                          </p>
                        </div>
                        <div className="bg-lavender-100 rounded-lg p-3">
                          <p className="text-xs font-medium text-mwd-blue-600">Size</p>
                          <p className="text-xl font-bold text-mwd-blue-800">
                            {connectionInfo.Size}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {connectionInfo && (
                    <div className="mt-4 pt-4 border-t border-mwd-blue-200 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-mwd-blue-500">Agency:</span>{' '}
                        <span className="text-mwd-blue-800">{connectionInfo.Agency}</span>
                      </div>
                      <div>
                        <span className="text-mwd-blue-500">Feeder:</span>{' '}
                        <span className="text-mwd-blue-800">{connectionInfo.Feeder}</span>
                      </div>
                      <div>
                        <span className="text-mwd-blue-500">Station:</span>{' '}
                        <span className="text-mwd-blue-800">{connectionInfo.Station || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-mwd-blue-500">Activated:</span>{' '}
                        <span className="text-mwd-blue-800">{connectionInfo.ActivationDate}</span>
                      </div>
                      {connectionInfo.RequestedCapacity && (
                        <div>
                          <span className="text-mwd-blue-500">Requested:</span>{' '}
                          <span className="text-mwd-blue-800">{connectionInfo.RequestedCapacity} CFS</span>
                        </div>
                      )}
                      {connectionInfo.LocationComments && (
                        <div className="col-span-2 sm:col-span-3">
                          <span className="text-mwd-blue-500">Notes:</span>{' '}
                          <span className="text-mwd-blue-800">{connectionInfo.LocationComments}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Date Range Picker */}
                <div className="card p-4">
                  <DateRangePicker
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                  />
                </div>

                {/* Interval Data Section */}
                {intervalLoading ? (
                  <LoadingSpinner text="Loading interval data..." />
                ) : intervalError ? (
                  <ErrorMessage
                    title="Failed to load interval data"
                    message={intervalError.message}
                    onRetry={() => refetchInterval()}
                  />
                ) : intervalData && intervalData.length > 0 ? (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard
                        label="Total Volume"
                        value={`${stats.totalVolume} AF`}
                        icon={
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        }
                      />
                      <StatCard
                        label="Avg Flow"
                        value={`${stats.avgFlow} CFS`}
                        icon={
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        }
                      />
                      <StatCard label="Max Flow" value={`${stats.maxFlow} CFS`} />
                      <StatCard label="Min Flow" value={`${stats.minFlow} CFS`} />
                    </div>

                    {/* Meter Readings */}
                    {meterRead && meterRead[0] && (
                      <div className="card p-4">
                        <h3 className="font-semibold text-mwd-blue-800 mb-3">Meter Readings</h3>
                        <div className="flex flex-wrap gap-8">
                          <div>
                            <p className="text-sm text-mwd-blue-500">Begin Reading</p>
                            <p className="text-xl font-semibold text-mwd-blue-800">{meterRead[0].BeginReading.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-mwd-blue-500">End Reading</p>
                            <p className="text-xl font-semibold text-mwd-blue-800">{meterRead[0].EndReading.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-mwd-blue-500">Difference</p>
                            <p className="text-xl font-semibold text-mwd-blue-400">
                              {(meterRead[0].EndReading - meterRead[0].BeginReading).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chart */}
                    <div className="card">
                      <div className="p-4 border-b border-mwd-blue-200 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-2">
                          {(['flow', 'volume', 'cumulative'] as ChartType[]).map((type) => (
                            <button
                              key={type}
                              onClick={() => setChartType(type)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                chartType === type
                                  ? 'bg-mwd-blue-800 text-white'
                                  : 'bg-lavender-100 text-mwd-blue-700 hover:bg-lavender-200'
                              }`}
                            >
                              {type === 'flow' ? 'Flow' : type === 'volume' ? 'Volume' : 'Cumulative'}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => exportData('csv')} className="btn-secondary text-sm">
                            Export CSV
                          </button>
                          <button onClick={() => exportData('json')} className="btn-secondary text-sm">
                            Export JSON
                          </button>
                        </div>
                      </div>

                      <div className="p-4 h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'flow' ? (
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="datetime" tick={{ fontSize: 12 }} tickLine={false} interval="preserveStartEnd" />
                              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} label={{ value: 'Flow (CFS)', angle: -90, position: 'insideLeft' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                              <Legend />
                              <Line type="monotone" dataKey="Flow" stroke="#2c3c5b" strokeWidth={2} dot={false} name="Flow (CFS)" />
                            </LineChart>
                          ) : chartType === 'volume' ? (
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="datetime" tick={{ fontSize: 12 }} tickLine={false} interval="preserveStartEnd" />
                              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} label={{ value: 'Volume (AF)', angle: -90, position: 'insideLeft' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                              <Legend />
                              <Bar dataKey="Volume" fill="#82aed6" name="Volume (AF)" />
                            </BarChart>
                          ) : (
                            <AreaChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="datetime" tick={{ fontSize: 12 }} tickLine={false} interval="preserveStartEnd" />
                              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} label={{ value: 'Cumulative Volume (AF)', angle: -90, position: 'insideLeft' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                              <Legend />
                              <Area type="monotone" dataKey="cumulativeVolume" stroke="#2c3c5b" fill="#82aed6" name="Cumulative Volume (AF)" />
                            </AreaChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Data Table Toggle */}
                    <div className="card">
                      <button
                        onClick={() => setShowTable(!showTable)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-lavender-50 transition-colors"
                      >
                        <span className="font-medium text-mwd-blue-800">
                          Data Table ({intervalData.length} records)
                        </span>
                        <svg
                          className={`h-5 w-5 text-mwd-blue-500 transition-transform ${showTable ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showTable && (
                        <DataTable
                          data={intervalData}
                          columns={tableColumns}
                          keyField="IntervalNum"
                          pageSize={50}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="card p-8 text-center text-mwd-blue-500">
                    <p className="font-medium">No interval data available for this date range</p>
                    <p className="text-sm">Try selecting a different date range above</p>
                  </div>
                )}
              </div>
            ) : (
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="mt-4 font-medium">Select a meter</p>
                <p className="text-sm">
                  Search and click on a meter to view details and interval data
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
