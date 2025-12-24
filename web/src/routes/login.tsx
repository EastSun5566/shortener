import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthForm, type AuthFormProps } from '../components'
import { login, type ResponseError } from '../services'

export function LoginRoute (): JSX.Element {
  const navigate = useNavigate()

  const [error, setError] = useState('')
  const handleSubmit = async (values: Parameters<AuthFormProps['onSubmit']>[0]) => {
    try {
      const { data } = await login(values)
      localStorage.setItem('token', data.token)
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
