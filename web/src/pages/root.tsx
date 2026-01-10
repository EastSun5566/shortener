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
            data-testid="url-input"
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
            data-testid="shorten-button"
            disabled={formState.isSubmitting || createMutation.isPending}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formState.isSubmitting || createMutation.isPending ? 'Creating...' : 'Shorten'}
          </button>
        </form>

        {error && <small className="text-red-500 mb-4" data-testid="error-message">{error}</small>}
        {createMutation.isSuccess && createMutation.data && (
          <div className="mb-4">
            <small className="text-green-500 block mb-2" data-testid="success-message">
              Short link created successfully!
            </small>
            <a
              href={createMutation.data.data.shortenUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 underline"
              data-testid="created-short-link"
            >
              {createMutation.data.data.shortenUrl}
            </a>
          </div>
        )}
        {formState.errors.originalUrl && (
          <small className="text-red-500 mb-4">{formState.errors.originalUrl.message}</small>
        )}

        {isLoading && <p className="text-gray-500 mb-4">Loading links...</p>}

        {links && links.length > 0 && (
          <ul className="max-h-40 overflow-y-scroll" data-testid="links-list">
            {links.map((link) => (
              <li key={link.shortenUrl}>
                <a
                  href={link.shortenUrl}
                  target='_blank'
                  rel="noreferrer"
                  data-testid="short-link">
                  {link.shortenUrl}
                </a>
                {link.clickCount !== undefined && (
                  <span style={{ marginLeft: '1rem', color: '#666', fontSize: '0.9em' }}>
                    📊 {link.clickCount} clicks
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}

export default RootRoute
