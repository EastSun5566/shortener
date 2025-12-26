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
    handleSubmit: createSubmitHandler,
    formState,
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
    <section className="text-center">
      <h1 className="mb-10">{title}</h1>

      <form className="mb-10" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="email..."
          {...registerInput('email', { 
              required: 'Email is required',
            })}
          autoFocus
        />

        <input
          type="password"
          placeholder="password..."
          {...registerInput('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            },
            maxLength: {
              value: 100,
              message: 'Password must not exceed 100 characters'
            },
            pattern: {
              value: /^(?=.*[a-zA-Z])(?=.*\d)/,
              message: 'Password must contain at least one letter and one number'
            }
          })}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : title}
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {formState.errors.email && (
          <p className="text-red-500 mb-4">{formState.errors.email.message}</p>
        )}
      {formState.errors.password && (
          <p className="text-red-500">{formState.errors.password.message}</p>
        )}
    </section>
  )
}

export default AuthForm
