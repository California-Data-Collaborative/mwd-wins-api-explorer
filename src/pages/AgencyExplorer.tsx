import { useState, useMemo } from 'react'
import { useAgencies } from '../hooks/useAgencies'
import { useServiceConnectionsByAgency } from '../hooks/useServiceConnections'
import { SearchInput } from '../components/common/SearchInput'
import { DataTable } from '../components/common/DataTable'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { ServiceConnection } from '../api/types'
import { Link } from 'react-router-dom'

interface AgencyInfo {
  name: string
  shortName?: string
  orgId?: string
  isMemberAgency: boolean
  connectionCount: number
}

export function AgencyExplorer() {
  const { data: memberAgencies, isLoading: agenciesLoading, error: agenciesError, refetch: refetchAgencies } = useAgencies()
  const { data: connections, isLoading: connectionsLoading, error: connectionsError, refetch: refetchConnections } = useServiceConnectionsByAgency()

  const [search, setSearch] = useState('')
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [readingTypeFilter, setReadingTypeFilter] = useState<string>('all')
  const [showOnlyMemberAgencies, setShowOnlyMemberAgencies] = useState(false)

  const isLoading = agenciesLoading || connectionsLoading
  const error = agenciesError || connectionsError

  // Build a complete list of agencies from service connections
  const allAgencies = useMemo(() => {
    if (!connections) return []

    // Get unique agency names from connections
    const agencyNames = new Set(connections.map((c) => c.Agency))

    // Create agency info objects
    const agencies: AgencyInfo[] = Array.from(agencyNames).map((name) => {
      const memberAgency = memberAgencies?.find((ma) => ma.LongName === name)
      const connectionCount = connections.filter((c) => c.Agency === name).length

      return {
        name,
        shortName: memberAgency?.ShortName,
        orgId: memberAgency?.OrgID,
        isMemberAgency: !!memberAgency,
        connectionCount,
      }
    })

    // Sort: member agencies first, then alphabetically
    return agencies.sort((a, b) => {
      if (a.isMemberAgency && !b.isMemberAgency) return -1
      if (!a.isMemberAgency && b.isMemberAgency) return 1
      return a.name.localeCompare(b.name)
    })
  }, [connections, memberAgencies])

  const filteredAgencies = useMemo(() => {
    return allAgencies.filter((agency) => {
      const matchesSearch =
        agency.name.toLowerCase().includes(search.toLowerCase()) ||
        (agency.shortName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (agency.orgId?.toLowerCase().includes(search.toLowerCase()) ?? false)

      const matchesMemberFilter = !showOnlyMemberAgencies || agency.isMemberAgency

      return matchesSearch && matchesMemberFilter
    })
  }, [allAgencies, search, showOnlyMemberAgencies])

  const agencyConnections = useMemo(() => {
    if (!connections || !selectedAgency) return []

    return connections.filter((conn) => {
      const matchesAgency = conn.Agency === selectedAgency
      const matchesStatus = statusFilter === 'all' || conn.Status === statusFilter
      const matchesReadingType = readingTypeFilter === 'all' || conn.ReadingType === readingTypeFilter
      return matchesAgency && matchesStatus && matchesReadingType
    })
  }, [connections, selectedAgency, statusFilter, readingTypeFilter])

  const selectedAgencyInfo = useMemo(() => {
    return allAgencies.find((a) => a.name === selectedAgency)
  }, [allAgencies, selectedAgency])

  const connectionColumns = [
    {
      key: 'Connection',
      header: 'Connection',
      render: (item: ServiceConnection) => (
        <Link
          to={`/meters?search=${item.Connection}`}
          className="text-mwd-blue-600 hover:text-mwd-blue-800 font-medium"
        >
          {item.Connection}
        </Link>
      ),
    },
    {
      key: 'Status',
      header: 'Status',
      render: (item: ServiceConnection) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            item.Status === 'A'
              ? 'bg-green-100 text-green-800'
              : item.Status === 'R'
              ? 'bg-lavender-100 text-mwd-blue-700'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {item.Status === 'A' ? 'Active' : item.Status === 'R' ? 'Retired' : item.Status}
        </span>
      ),
    },
    { key: 'Feeder', header: 'Feeder' },
    { key: 'OriginalCapacity', header: 'Capacity (CFS)' },
    { key: 'ReadingType', header: 'Reading Type' },
    { key: 'Size', header: 'Size' },
  ]

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load data"
        message={error.message}
        onRetry={() => {
          refetchAgencies()
          refetchConnections()
        }}
      />
    )
  }

  const memberAgencyCount = allAgencies.filter((a) => a.isMemberAgency).length
  const subAgencyCount = allAgencies.filter((a) => !a.isMemberAgency).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mwd-blue-800">Agency Explorer</h1>
        <p className="mt-1 text-mwd-blue-600">
          Browse agencies and their service connections
        </p>
        {!isLoading && (
          <p className="mt-1 text-sm text-mwd-blue-500">
            {memberAgencyCount} member agencies, {subAgencyCount} sub-agencies/retail agencies
          </p>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading agencies..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agency List */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="p-4 border-b border-mwd-blue-200 space-y-3">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search agencies..."
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showOnlyMemberAgencies}
                    onChange={(e) => setShowOnlyMemberAgencies(e.target.checked)}
                    className="rounded border-mwd-blue-300 text-mwd-blue-600 focus:ring-mwd-blue-400"
                  />
                  <span className="text-mwd-blue-600">Show only member agencies</span>
                </label>
                <p className="text-xs text-mwd-blue-500">
                  {filteredAgencies.length} agencies shown
                </p>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {filteredAgencies.map((agency) => (
                  <button
                    key={agency.name}
                    onClick={() => setSelectedAgency(agency.name)}
                    className={`w-full px-4 py-3 text-left border-b border-mwd-blue-100 hover:bg-lavender-50 transition-colors ${
                      selectedAgency === agency.name ? 'bg-lavender-100' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-mwd-blue-800 truncate">
                            {agency.shortName || agency.name}
                          </p>
                          {agency.isMemberAgency && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-mwd-blue-400 text-white flex-shrink-0">
                              Member
                            </span>
                          )}
                        </div>
                        {agency.shortName && (
                          <p className="text-sm text-mwd-blue-500 truncate">{agency.name}</p>
                        )}
                      </div>
                      <span className="text-sm text-mwd-blue-400 ml-2 flex-shrink-0">
                        {agency.connectionCount}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="lg:col-span-2">
            {selectedAgency ? (
              <div className="card">
                <div className="p-4 border-b border-mwd-blue-200">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-mwd-blue-800">
                          {selectedAgency}
                        </h2>
                        {selectedAgencyInfo?.isMemberAgency && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-mwd-blue-400 text-white">
                            Member Agency
                          </span>
                        )}
                      </div>
                      {!selectedAgencyInfo?.isMemberAgency && (
                        <p className="text-sm text-mwd-blue-500 mt-1">
                          Sub-agency / Retail agency
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input text-sm py-1.5"
                      >
                        <option value="all">All Status</option>
                        <option value="A">Active</option>
                        <option value="R">Retired</option>
                        <option value="M">MWD</option>
                      </select>
                      <select
                        value={readingTypeFilter}
                        onChange={(e) => setReadingTypeFilter(e.target.value)}
                        className="input text-sm py-1.5"
                      >
                        <option value="all">All Reading Types</option>
                        <option value="AMR">AMR</option>
                        <option value="MANUAL">Manual</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DataTable
                  data={agencyConnections}
                  columns={connectionColumns}
                  keyField="Connection"
                  emptyMessage="No connections found for this agency"
                />
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <p className="mt-4 font-medium">Select an agency</p>
                <p className="text-sm">
                  Click on an agency to view its service connections
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
