import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../services'
import { useAuth } from './useAuth'
import type { AuthData } from '../types'

export function useLoginMutation() {
  const navigate = useNavigate()
  const { login: setAuth } = useAuth()

  return useMutation({
    mutationFn: (data: AuthData) => login(data),
    onSuccess: (response) => {
      setAuth(response.data.token)
      navigate('/')
    },
  })
}

export function useRegisterMutation() {
  const navigate = useNavigate()
  const { login: setAuth } = useAuth()

  return useMutation({
    mutationFn: (data: AuthData) => register(data),
    onSuccess: (response) => {
      setAuth(response.data.token)
      navigate('/')
    },
  })
}
