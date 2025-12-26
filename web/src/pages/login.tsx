import { Link } from 'react-router-dom'

import { AuthForm, Nav } from '../components'
import { useLoginMutation } from '../hooks'
import type { ResponseError } from '../api'

export function LoginRoute () {
  const mutation = useLoginMutation()

  const handleSubmit = async (values: { email: string, password: string }) => {
    await mutation.mutateAsync(values)
  }

  const error = mutation.error
    ? ((mutation.error as ResponseError).response?.data.error ?? 'Login failed. Please try again.')
    : ''

  return (
    <>
      <Nav />

      <main>
        <AuthForm
          title="Login"
          onSubmit={handleSubmit}
          error={error}
          isLoading={mutation.isPending}
        />

        <div className='text-center'>
          <Link to="/register">Register</Link>
        </div>
      </main>
    </>
  )
}

export default LoginRoute
