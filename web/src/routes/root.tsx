import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { createLink, getLink, type ResponseError } from '../services'

export function RootRoute (): JSX.Element {
  const [isLogin, setIsLogin] = useState(() => !!localStorage.getItem('token'))
  const {
    register,
    handleSubmit: createSubmitHandler,
    formState
  } = useForm({
    defaultValues: {
      originalUrl: ''
    }
  })
  const [shortenUrls, setShortenUrls] = useState<string[]>([])
  const [error, setError] = useState('')
  const fetchLinks = async () => {
    try {
      const { data } = await getLink()
      setShortenUrls(data.map(({ shortenUrl }) => shortenUrl))
    } catch (error) {
      const { response } = error as ResponseError
      setError(response?.data.message ?? 'Something went wrong. Please try again later.')
    }
  }
  useEffect(() => {
    if (isLogin) fetchLinks()
  }, [isLogin])

  const handleSubmit = createSubmitHandler(async (values) => {
    const { data } = await createLink(values)
    setShortenUrls((shortenUrls) => [...shortenUrls, data.shortenUrl])
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLogin(false)
    setShortenUrls([])
  }

  return (
    <>
    <nav className="fixed top-0 left-0 w-full p-4">
      <ul className="flex justify-end items-center">
        {isLogin
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
      <h1 className="mb-10">URL Shortener</h1>

      <form className="mb-10" onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Type URL here..."
          {...register('originalUrl', { required: true })}
          autoFocus
        />

        <button
          type="submit"
          disabled={formState.isSubmitting}
          >
            Shorten
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

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
