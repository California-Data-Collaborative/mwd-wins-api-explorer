import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
import { Meter } from '../api/types'

export function useMeters() {
  return useQuery({
    queryKey: ['meters'],
    queryFn: () => fetchApi<Meter[]>('Meter'),
  })
}

export function useMeter(meterId: string | null) {
  return useQuery({
    queryKey: ['meters', meterId],
    queryFn: () => fetchApi<Meter[]>(`Meter/${meterId}`),
    enabled: !!meterId,
  })
}
