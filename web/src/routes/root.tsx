import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth, useLinks, useCreateLinkMutation } from '../hooks'
import type { ResponseError } from '../services'

export function RootRoute () {
  const { isAuthenticated, logout } = useAuth()
  const { data: links, isLoading } = useLinks()
  const createMutation = useCreateLinkMutation()

  const {
    register,
    handleSubmit: createSubmitHandler,
    formState,
    reset
  } = useForm({
    defaultValues: {
      originalUrl: ''
    }
  })

  const handleSubmit = createSubmitHandler(async (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        reset()
      }
    })
  })

  const error = createMutation.error
    ? ((createMutation.error as ResponseError).response?.data.error ?? 'Failed to create short link.')
    : ''

  return (
    <>
      <nav className="fixed top-0 left-0 w-full p-4">
        <ul className="flex justify-end items-center">
          {isAuthenticated
            ? (
              <li>
                <button onClick={logout}>logout</button>
              </li>
              )
            : (
              <li>
                <Link className="mr-4" to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </li>
              )}
        </ul>
      </nav>

      <main className="text-center">
        <h1 className="mb-10">🔗</h1>

        <form className="mb-10" onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="Type URL here..."
            {...register('originalUrl', {
              required: 'URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Must be a valid HTTP/HTTPS URL'
              },
              minLength: {
                value: 10,
                message: 'URL must be at least 10 characters'
              },
              maxLength: {
                value: 2048,
                message: 'URL must be less than 2048 characters'
              }
            })}
            autoFocus
          />

          <button
            type="submit"
            disabled={formState.isSubmitting || createMutation.isPending}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formState.isSubmitting || createMutation.isPending ? 'Creating...' : 'Shorten'}
          </button>
        </form>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {createMutation.isSuccess && (
          <p className="text-green-500 mb-4">Short link created successfully!</p>
        )}
        {formState.errors.originalUrl && (
          <p className="text-red-500 mb-4">{formState.errors.originalUrl.message}</p>
        )}

        {isLoading && <p className="text-gray-500 mb-4">Loading links...</p>}

        {links && links.length > 0 && (
          <ul className="max-h-40 overflow-y-scroll">
            {links.map((link) => (
              <li key={link.shortenUrl}>
                <a
                  href={link.shortenUrl}
                  target='_blank'
                  rel="noreferrer">
                  {link.shortenUrl}
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}

export default RootRoute
