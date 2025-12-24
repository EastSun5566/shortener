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
}

export interface ErrorResponse {
  error: string
  requestId?: string
}
