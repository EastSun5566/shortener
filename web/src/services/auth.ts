import { getRequest } from './request'
import type { AuthData, AuthResponse } from '../types'

export async function register (data: AuthData) {
  return await getRequest().post<AuthResponse>('/register', data)
}

export async function login (data: AuthData) {
  return await getRequest().post<AuthResponse>('/login', data)
}
