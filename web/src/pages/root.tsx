import { useForm } from 'react-hook-form'

import { Nav } from '../components/Nav'
import { useLinks, useCreateLinkMutation } from '../hooks'
import type { ResponseError } from '../api'

export function RootRoute () {
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

  const handleSubmit = createSubmitHandler((values) => {
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
      <Nav />

      <main className="text-center">
        <h1 className="text-5xl mb-8">🔗</h1>

        <form className="mb-4" onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="URL..."
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

        {error && <small className="text-red-500 mb-4">{error}</small>}
        {createMutation.isSuccess && (
          <small className="text-green-500 mb-4">Short link created successfully!</small>
        )}
        {formState.errors.originalUrl && (
          <small className="text-red-500 mb-4">{formState.errors.originalUrl.message}</small>
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
