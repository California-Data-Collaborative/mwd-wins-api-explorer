import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
import { MeterInterval } from '../api/types'

export function useMeterInterval(
  meterId: string | null,
  fromDate: string | null,
  toDate: string | null
) {
  return useQuery({
    queryKey: ['meterInterval', meterId, fromDate, toDate],
    queryFn: () =>
      fetchApi<MeterInterval[]>(`MeterInterval/${meterId}/${fromDate}/${toDate}`),
    enabled: !!(meterId && fromDate && toDate),
    staleTime: 15 * 60 * 1000, // 15 minutes as per user preference
  })
}
