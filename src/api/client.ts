const BASE_URL = import.meta.env.DEV
  ? '/wins/Public/api'
  : 'https://webservices.mwdsc.org/wins/Public/api'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

export async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = `${BASE_URL}/${endpoint}${endpoint.includes('?') ? '&' : '?'}type=json`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function buildApiUrl(endpoint: string): string {
  return `https://webservices.mwdsc.org/wins/Public/api/${endpoint}${endpoint.includes('?') ? '&' : '?'}type=json`
}
