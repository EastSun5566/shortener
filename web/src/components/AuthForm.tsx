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
      <h1 className='text-5xl mb-8'>{title}</h1>

      <form className="mb-4" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="email..."
          data-testid="email-input"
          {...registerInput('email', { 
              required: 'Email is required',
            })}
          autoFocus
        />

        <input
          type="password"
          placeholder="password..."
          data-testid="password-input"
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

        <button type="submit" disabled={isLoading} data-testid="auth-submit-button">
          {isLoading ? 'Loading...' : title}
        </button>
      </form>

      {error && <small className="text-red-500 mb-4">{error}</small>}
      
      {formState.errors.email && (
          <small className="text-red-500 mb-4">{formState.errors.email.message}</small>
        )}
      {formState.errors.password && (
          <small className="text-red-500 mb-4">{formState.errors.password.message}</small>
        )}
    </section>
  )
}

export default AuthForm
