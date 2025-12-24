import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { createLink, getLink, type ResponseError } from '../services'
import { useAuth } from '../hooks'

export function RootRoute () {
  const { isAuthenticated, logout } = useAuth()
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
  const [shortenUrls, setShortenUrls] = useState<string[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchLinks = useCallback(async () => {
    try {
      const { data } = await getLink()
      setShortenUrls(data.map(({ shortenUrl }) => shortenUrl))
      setError('')
    } catch (error) {
      const { response } = error as ResponseError
      setError(response?.data.error ?? 'Something went wrong. Please try again later.')
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchLinks()
    }
  }, [isAuthenticated, fetchLinks])

  const handleSubmit = createSubmitHandler(async (values) => {
    try {
      setError('')
      setSuccess('')
      const { data } = await createLink(values)
      setShortenUrls((shortenUrls) => [data.shortenUrl, ...shortenUrls])
      reset()
      setSuccess('Short link created successfully!')
      setTimeout(() => { setSuccess('') }, 3000)
    } catch (error) {
      const { response } = error as ResponseError
      setError(response?.data.error ?? 'Failed to create short link. Please try again.')
    }
  })

  const handleLogout = () => {
    logout()
    setShortenUrls([])
  }

  return (
    <>
    <nav className="fixed top-0 left-0 w-full p-4">
      <ul className="flex justify-end items-center">
        {isAuthenticated
          ? (
            <>
              <li>
                <button onClick={handleLogout}>logout</button>
              </li>
            </>
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
          disabled={formState.isSubmitting}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formState.isSubmitting ? 'Creating...' : 'Shorten'}
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      {formState.errors.originalUrl && (
        <p className="text-red-500 mb-4">{formState.errors.originalUrl.message}</p>
      )}

      <ul className="max-h-40 overflow-y-scroll">
        {shortenUrls.map((shortenUrl) => (
          <li key={shortenUrl}>
            <a
              href={shortenUrl}
              target='_blank'
              rel="noreferrer">
                {shortenUrl}
            </a>
          </li>
        ))}
      </ul>

    </main>
    </>
  )
}

export default RootRoute
