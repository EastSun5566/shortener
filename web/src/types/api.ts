export interface AuthData {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
}

export interface CreateLinkData {
  originalUrl: string
}

export interface LinkResponse {
  shortenUrl: string
  originalUrl?: string
  createdAt?: string
}

export interface ErrorResponse {
  error: string
  requestId?: string
}

export interface User {
  id: string
  email: string
}
