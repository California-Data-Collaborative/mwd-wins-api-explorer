import { Link } from 'react-router-dom'
import { useAgencies } from '../hooks/useAgencies'
import { useMeters } from '../hooks/useMeters'
import { useServiceConnectionsByAgency } from '../hooks/useServiceConnections'
import { StatCard } from '../components/common/StatCard'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function Dashboard() {
  const { data: agencies, isLoading: agenciesLoading } = useAgencies()
  const { data: meters, isLoading: metersLoading } = useMeters()
  const { data: connections, isLoading: connectionsLoading } = useServiceConnectionsByAgency()

  const isLoading = agenciesLoading || metersLoading || connectionsLoading

  const feederCount = connections
    ? new Set(connections.map((c) => c.Feeder)).size
    : 0

  const activeConnections = connections
    ? connections.filter((c) => c.Status === 'A').length
    : 0

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-mwd-blue-800">
          MWD WINS API Explorer
        </h1>
        <p className="mt-3 text-lg text-mwd-blue-600 max-w-2xl mx-auto">
          Explore water meter data from the Metropolitan Water District of Southern California.
          View interval flow data, meter readings, and service connections.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <LoadingSpinner text="Loading data..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Member Agencies"
            value={agencies?.length ?? 0}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            label="Total Meters"
            value={meters?.length ?? 0}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            label="Active Connections"
            value={activeConnections}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            label="Feeders"
            value={feederCount}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          to="/agencies"
          title="Browse Agencies"
          description="Explore member and sub-agencies with their service connections. Filter by status or reading type."
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <FeatureCard
          to="/meters"
          title="Meter Explorer"
          description="Search meters, view details, current flow, and visualize interval data with interactive charts."
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <FeatureCard
          to="/playground"
          title="API Playground"
          description="Test API calls directly. View responses and generate code snippets for your applications."
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          }
        />
      </div>

      {/* Quick Start */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-mwd-blue-800 mb-4">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLink
            to="/meters?meter=OC-81"
            title="View OC-81 Flow Data"
            description="Popular meter from MWDOC"
          />
          <QuickLink
            to="/agencies"
            title="Browse All Agencies"
            description="27 member agencies"
          />
          <QuickLink
            to="/playground"
            title="Try the API"
            description="Build custom queries"
          />
        </div>
      </div>
    </div>
  )
}

interface FeatureCardProps {
  to: string
  title: string
  description: string
  icon: React.ReactNode
}

function FeatureCard({ to, title, description, icon }: FeatureCardProps) {
  return (
    <Link
      to={to}
      className="card p-6 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-lavender-100 rounded-lg text-mwd-blue-800 group-hover:bg-mwd-blue-100 transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-mwd-blue-800 group-hover:text-mwd-blue-600 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-mwd-blue-600">{description}</p>
        </div>
      </div>
    </Link>
  )
}

interface QuickLinkProps {
  to: string
  title: string
  description: string
}

function QuickLink({ to, title, description }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="block p-4 bg-lavender-100 rounded-lg hover:bg-lavender-200 transition-colors"
    >
      <p className="font-medium text-mwd-blue-800">{title}</p>
      <p className="text-sm text-mwd-blue-600">{description}</p>
    </Link>
  )
}
