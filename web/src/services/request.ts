import axios, { type AxiosInstance, type AxiosError } from 'axios'

export type ResponseError = AxiosError<{
  error: string
  message: string
  statusCode: number
}>

let request: AxiosInstance | null = null
export function getRequest () {
  if (request) return request

  request = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080'
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
