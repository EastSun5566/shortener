import { AuthForm } from '../components'
import { useLoginMutation } from '../hooks'
import type { ResponseError } from '../services'

export function LoginRoute () {
  const mutation = useLoginMutation()

  const handleSubmit = async (values: { email: string, password: string }) => {
    mutation.mutate(values)
  }

  const error = mutation.error
    ? ((mutation.error as ResponseError).response?.data.error ?? 'Login failed. Please try again.')
    : ''

  return (
    <AuthForm
      title="Login"
      onSubmit={handleSubmit}
      error={error}
      isLoading={mutation.isPending}
    />
  )
}

export default LoginRoute
