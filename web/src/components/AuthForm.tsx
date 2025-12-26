import { useForm } from 'react-hook-form'

export interface AuthFormProps {
  title: string
  onSubmit: (values: { email: string, password: string }) => Promise<void>
  error?: string
  isLoading?: boolean
}

export function AuthForm ({
  title,
  onSubmit,
  error,
  isLoading = false
}: AuthFormProps) {
  const {
    register: registerInput,
    handleSubmit: createSubmitHandler
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const handleSubmit = createSubmitHandler(async (values) => {
    await onSubmit(values)
  })

  return (
    <main className="text-center">
      <h1 className="mb-10">{title}</h1>

      <form className="mb-10" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Type Email here..."
          {...registerInput('email', { required: true })}
          autoFocus
        />

        <input
          type="password"
          placeholder="Type Password here..."
          {...registerInput('password', { required: true })}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : title}
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}
    </main>
  )
}

export default AuthForm
