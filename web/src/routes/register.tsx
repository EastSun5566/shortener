import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthForm, type AuthFormProps } from '../components'
import { register, type ResponseError } from '../services'
import { useAuth } from '../hooks'

export function RegisterRoute (): JSX.Element {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [error, setError] = useState('')
  const handleSubmit = async (values: Parameters<AuthFormProps['onSubmit']>[0]) => {
    try {
      const { data } = await register(values)
      login(data.token)
      navigate('/')
    } catch (error) {
      const { response } = error as ResponseError
      setError(response?.data.error ?? 'Registration failed. Please try again.')
    }
  }

  return (
    <AuthForm
      title="Register"
      onSubmit={handleSubmit}
      error={error}
    />
  )
}

export default RegisterRoute
