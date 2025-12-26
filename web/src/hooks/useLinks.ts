import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createLink, getLink } from '../services'
import type { CreateLinkData } from '../types'

const LINKS_QUERY_KEY = ['links']

export function useLinks() {
  return useQuery({
    queryKey: LINKS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await getLink()
      return data
    },
    enabled: !!localStorage.getItem('token'),
  })
}

export function useCreateLinkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLinkData) => createLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LINKS_QUERY_KEY })
    },
  })
}
