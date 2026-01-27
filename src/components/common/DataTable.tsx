import { useState, useMemo } from 'react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T
  pageSize?: number
  emptyMessage?: string
}

export function DataTable<T extends object>({
  data,
  columns,
  keyField,
  pageSize = 25,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn as keyof T]
      const bVal = b[sortColumn as keyof T]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(data.length / pageSize)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-mwd-blue-500">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-mwd-blue-200">
          <thead className="bg-lavender-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-medium text-mwd-blue-600 uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-lavender-200' : ''
                  }`}
                  onClick={() =>
                    column.sortable !== false && handleSort(String(column.key))
                  }
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable !== false && sortColumn === column.key && (
                      <svg
                        className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-mwd-blue-100">
            {paginatedData.map((item) => (
              <tr key={String(item[keyField])} className="hover:bg-lavender-50">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-4 py-3 text-sm text-mwd-blue-800 whitespace-nowrap"
                  >
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-mwd-blue-200 bg-lavender-100">
          <p className="text-sm text-mwd-blue-600">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, data.length)} of {data.length} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary text-sm py-1"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary text-sm py-1"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
