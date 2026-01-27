import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
import { CurrentFlow } from '../api/types'

export function useCurrentFlow(meterId: string | null) {
  return useQuery({
    queryKey: ['currentFlow', meterId],
    queryFn: () => fetchApi<CurrentFlow[]>(`WOCurrentFlow/${meterId}`),
    enabled: !!meterId,
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes as per user preference
  })
}
