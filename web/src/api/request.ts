import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { ErrorResponse } from '../types'

export type ResponseError = AxiosError<ErrorResponse>

let request: AxiosInstance | null = null
export function getRequest () {
  if (request) return request

  request = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  })

  // request interceptor
  request.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = 'Bearer ' + token
      }

      return config
    }
  )

  return request
}
