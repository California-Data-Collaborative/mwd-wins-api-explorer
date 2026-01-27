import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
import { Agency } from '../api/types'

export function useAgencies() {
  return useQuery({
    queryKey: ['agencies'],
    queryFn: () => fetchApi<Agency[]>('Agency'),
  })
}

export function useBillingAgencies() {
  return useQuery({
    queryKey: ['agencies', 'billing'],
    queryFn: () => fetchApi<Agency[]>('Agency/Billing'),
  })
}
