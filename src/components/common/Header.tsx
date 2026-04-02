import { Link, useLocation } from 'react-router-dom'

const navigation = [
  { name: 'Dashboard', path: '/' },
  { name: 'Agencies', path: '/agencies' },
  { name: 'Meters', path: '/meters' },
  { name: 'Capacity Charge', path: '/capacity-charge' },
  { name: 'API Playground', path: '/playground' },
]

export function Header() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-mwd-blue-900" style={{ backgroundColor: '#164876' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <svg
              className="h-8 w-8 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" />
            </svg>
            <span className="font-semibold text-xl text-white">
              MWD WINS Explorer
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-mwd-blue-800'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <a
            href="https://webservices.mwdsc.org/wins/Public/Help"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-sm text-white/80 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            API Docs
          </a>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="md:hidden border-t border-mwd-blue-900 px-4 py-2 flex gap-1 overflow-x-auto" style={{ backgroundColor: '#164876' }}>
        {navigation.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white text-mwd-blue-800'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
