import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
import { ServiceConnection } from '../api/types'

export function useServiceConnectionsByAgency() {
  return useQuery({
    queryKey: ['serviceConnections', 'byAgency'],
    queryFn: () => fetchApi<ServiceConnection[]>('ServConn/Agency'),
  })
}

export function useServiceConnectionsByFeeder() {
  return useQuery({
    queryKey: ['serviceConnections', 'byFeeder'],
    queryFn: () => fetchApi<ServiceConnection[]>('ServConn/Feeder'),
  })
}
