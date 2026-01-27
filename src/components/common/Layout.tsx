import { ReactNode } from 'react'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-lavender-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-mwd-blue-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-mwd-blue-600">
            Data provided by the{' '}
            <a
              href="https://www.mwdh2o.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mwd-blue-800 hover:text-mwd-blue-700 font-medium"
            >
              Metropolitan Water District of Southern California
            </a>{' '}
            WINS API
          </p>
        </div>
      </footer>
    </div>
  )
}
