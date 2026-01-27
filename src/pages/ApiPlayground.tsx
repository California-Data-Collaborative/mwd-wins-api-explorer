import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { API_ENDPOINTS, buildEndpointPath } from '../api/endpoints'
import { buildApiUrl } from '../api/client'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function ApiPlayground() {
  const [searchParams] = useSearchParams()
  const initialEndpoint = searchParams.get('endpoint') || 'meter-interval'

  const [selectedEndpointId, setSelectedEndpointId] = useState(initialEndpoint)
  const [params, setParams] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    const meterFromUrl = searchParams.get('MeterID')
    if (meterFromUrl) initial.MeterID = meterFromUrl
    initial.FromDate = format(subDays(new Date(), 7), 'yyyy-MM-dd')
    initial.ToDate = format(new Date(), 'yyyy-MM-dd')
    return initial
  })
  const [response, setResponse] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeLanguage, setCodeLanguage] = useState<'javascript' | 'python' | 'curl'>('javascript')

  const selectedEndpoint = useMemo(
    () => API_ENDPOINTS.find((e) => e.id === selectedEndpointId),
    [selectedEndpointId]
  )

  const requestUrl = useMemo(() => {
    if (!selectedEndpoint) return ''
    const path = buildEndpointPath(selectedEndpoint, params)
    return buildApiUrl(path)
  }, [selectedEndpoint, params])

  const handleParamChange = (name: string, value: string) => {
    setParams((prev) => ({ ...prev, [name]: value }))
  }

  const executeRequest = async () => {
    setIsLoading(true)
    setError(null)
    setResponse(null)
    setResponseStatus(null)
    setResponseTime(null)

    const startTime = performance.now()

    try {
      const res = await fetch(requestUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      const endTime = performance.now()
      setResponseTime(Math.round(endTime - startTime))
      setResponseStatus(res.status)

      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getCodeSnippet = () => {
    switch (codeLanguage) {
      case 'javascript':
        return `const response = await fetch(
  '${requestUrl}'
);
const data = await response.json();
console.log(data);`
      case 'python':
        return `import requests

response = requests.get(
    '${requestUrl}'
)
data = response.json()
print(data)`
      case 'curl':
        return `curl '${requestUrl}'`
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mwd-blue-800">API Playground</h1>
        <p className="mt-1 text-mwd-blue-600">
          Test API calls directly and generate code snippets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Builder */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="font-semibold text-mwd-blue-800 mb-4">Request</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Endpoint</label>
                <select
                  value={selectedEndpointId}
                  onChange={(e) => setSelectedEndpointId(e.target.value)}
                  className="input"
                >
                  {API_ENDPOINTS.map((endpoint) => (
                    <option key={endpoint.id} value={endpoint.id}>
                      {endpoint.name}
                    </option>
                  ))}
                </select>
                {selectedEndpoint && (
                  <p className="mt-1 text-sm text-mwd-blue-500">
                    {selectedEndpoint.description}
                  </p>
                )}
              </div>

              {selectedEndpoint?.parameters.map((param) => (
                <div key={param.name}>
                  <label className="label">
                    {param.name}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={param.type === 'date' ? 'date' : 'text'}
                    value={params[param.name] || ''}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    className="input"
                  />
                  <p className="mt-1 text-sm text-mwd-blue-500">{param.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* URL Preview */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-mwd-blue-800">URL Preview</h3>
              <button
                onClick={() => copyToClipboard(requestUrl)}
                className="text-sm text-mwd-blue-600 hover:text-mwd-blue-700"
              >
                Copy
              </button>
            </div>
            <div className="bg-lavender-100 rounded-lg p-3 overflow-x-auto">
              <code className="text-sm text-mwd-blue-700 break-all">{requestUrl}</code>
            </div>
          </div>

          <button
            onClick={executeRequest}
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Executing...' : 'Execute Request'}
          </button>

          {/* Code Snippets */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-mwd-blue-800">Code Snippet</h3>
              <div className="flex gap-1">
                {(['javascript', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLanguage(lang)}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      codeLanguage === lang
                        ? 'text-white'
                        : 'bg-lavender-100 text-mwd-blue-700 hover:bg-lavender-200'
                    }`}
                    style={codeLanguage === lang ? { backgroundColor: '#164876' } : undefined}
                  >
                    {lang === 'javascript' ? 'JS' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                <code>{getCodeSnippet()}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(getCodeSnippet())}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Response */}
        <div className="card">
          <div className="p-4 border-b border-mwd-blue-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-mwd-blue-800">Response</h2>
              {responseStatus && (
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {responseStatus}
                  </span>
                  {responseTime && (
                    <span className="text-sm text-mwd-blue-500">{responseTime}ms</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <LoadingSpinner text="Fetching data..." />
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : response ? (
              <div className="relative">
                <pre className="bg-lavender-100 rounded-lg p-4 overflow-auto max-h-[600px] text-sm">
                  <code className="text-mwd-blue-700">{response}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(response)}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-white border border-mwd-blue-200 text-mwd-blue-600 rounded hover:bg-lavender-50"
                >
                  Copy JSON
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-mwd-blue-500">
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
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-4 font-medium">No response yet</p>
                <p className="text-sm">Click "Execute Request" to see the API response</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Reference */}
      <div className="card p-4">
        <h2 className="font-semibold text-mwd-blue-800 mb-4">Available Endpoints</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-mwd-blue-200">
            <thead className="bg-lavender-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-mwd-blue-600 uppercase">
                  Endpoint
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-mwd-blue-600 uppercase">
                  Path
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-mwd-blue-600 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mwd-blue-100">
              {API_ENDPOINTS.map((endpoint) => (
                <tr
                  key={endpoint.id}
                  className="hover:bg-lavender-50 cursor-pointer"
                  onClick={() => setSelectedEndpointId(endpoint.id)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-mwd-blue-600">
                    {endpoint.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-mwd-blue-500 font-mono">
                    {endpoint.path}
                  </td>
                  <td className="px-4 py-3 text-sm text-mwd-blue-500">
                    {endpoint.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
