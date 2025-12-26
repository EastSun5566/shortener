import { AuthForm } from '../components'
import { useRegisterMutation } from '../hooks'
import type { ResponseError } from '../services'

export function RegisterRoute () {
  const mutation = useRegisterMutation()

  const handleSubmit = async (values: { email: string, password: string }) => {
    mutation.mutate(values)
  }

  const error = mutation.error
    ? ((mutation.error as ResponseError).response?.data.error ?? 'Registration failed. Please try again.')
    : ''

  return (
    <AuthForm
      title="Register"
      onSubmit={handleSubmit}
      error={error}
      isLoading={mutation.isPending}
    />
  )
}

export default RegisterRoute
