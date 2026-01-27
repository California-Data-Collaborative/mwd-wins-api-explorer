import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
import { MeterRead } from '../api/types'

export function useMeterRead(
  meterId: string | null,
  fromDate: string | null,
  toDate: string | null
) {
  return useQuery({
    queryKey: ['meterRead', meterId, fromDate, toDate],
    queryFn: () =>
      fetchApi<MeterRead[]>(`MeterRead/${meterId}/${fromDate}/${toDate}`),
    enabled: !!(meterId && fromDate && toDate),
  })
}
