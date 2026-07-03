import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useLoginV1AuthLoginPost } from '@/api/generated/auth/auth'
import { useAuth } from '@/auth/useAuth'
import { BrandMark } from '@/components/app/BrandMark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/state/auth'

const schema = z.object({
  phone: z.string().min(3, 'Enter your phone number'),
  password: z.string().min(1, 'Enter your password'),
})
type LoginForm = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const { isAuthenticated } = useAuth()
  const loginMutation = useLoginV1AuthLoginPost()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  if (isAuthenticated) return <Navigate to="/" replace />

  const onSubmit = async (values: LoginForm) => {
    setAuthError(null)
    try {
      const res = await loginMutation.mutateAsync({ data: values })
      if (res.status === 200) {
        setTokens(res.data.access_token, res.data.refresh_token)
        navigate('/', { replace: true })
      } else {
        setAuthError('Invalid phone or password.')
      }
    } catch {
      setAuthError('Could not reach the server. Try again.')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-sidebar px-4">
      <div className="w-full max-w-[380px] bg-card border border-line rounded-xl shadow-card p-7">
        <div className="flex flex-col items-center text-center mb-6">
          <BrandMark size={44} />
          <h1 className="text-[19px] font-bold text-ink mt-3">Sree Kamala Indane</h1>
          <p className="text-[13px] text-muted mt-1">Sign in to the operations dashboard</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="phone" className="block text-[13px] font-medium text-ink mb-1.5">
              Phone
            </label>
            <Input
              id="phone"
              inputMode="tel"
              autoComplete="username"
              placeholder="9000000001"
              aria-invalid={!!errors.phone}
              {...register('phone')}
            />
            {errors.phone ? (
              <p className="text-[12px] text-bad mt-1">{errors.phone.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-ink mb-1.5">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-[12px] text-bad mt-1">{errors.password.message}</p>
            ) : null}
          </div>

          {authError ? (
            <div className="text-[12.5px] text-bad bg-badbg rounded-lg px-3 py-2" role="alert">
              {authError}
            </div>
          ) : null}

          <Button type="submit" className="w-full mt-1" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
