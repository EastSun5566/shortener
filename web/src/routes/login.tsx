import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthForm, type AuthFormProps } from '../components'
import { login, type ResponseError } from '../services'
import { useAuth } from '../hooks'

export function LoginRoute () {
  const navigate = useNavigate()
  const { login: setAuth } = useAuth()

  const [error, setError] = useState('')
  const handleSubmit = async (values: Parameters<AuthFormProps['onSubmit']>[0]) => {
    try {
      const { data } = await login(values)
      setAuth(data.token)
      navigate('/')
    } catch (error) {
      const { response } = error as ResponseError
      setError(response?.data.error ?? 'Login failed. Please try again.')
    }
  }

  return (
    <AuthForm
      title="Login"
      onSubmit={handleSubmit}
      error={error}
    />
  )
}

export default LoginRoute
