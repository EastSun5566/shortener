import { AuthForm, Nav } from '../components'
import { useRegisterMutation } from '../hooks'
import type { ResponseError } from '../api'

export function RegisterRoute () {
  const mutation = useRegisterMutation()

  const handleSubmit = async (values: { email: string, password: string }) => {
    await mutation.mutateAsync(values)
  }

  const error = mutation.error
    ? ((mutation.error as ResponseError).response?.data.error ?? 'Registration failed. Please try again.')
    : ''

  return (
    <>
      <Nav />

      <main>
        <AuthForm
          title="Register"
          onSubmit={handleSubmit}
          error={error}
          isLoading={mutation.isPending}
        />
      </main>
    </>
  )
}

export default RegisterRoute
