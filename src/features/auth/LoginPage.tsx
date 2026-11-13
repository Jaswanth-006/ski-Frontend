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
import { AGENCY } from './landing/agency'
import {
  About,
  Counters,
  Cylinders,
  FeatureCards,
  Footer,
  Gallery,
  Hero,
  NavBar,
  Safety,
  Services,
  Team,
  TopBar,
  Updates,
} from './landing/sections'

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
      } else if ((res.status as number) === 429) {
        setAuthError('Too many attempts — please wait a few minutes and try again.')
      } else {
        setAuthError('Invalid phone or password.')
      }
    } catch {
      setAuthError('Could not reach the server. Try again.')
    }
  }

  const loginCard = (
    <div id="login" className="scroll-mt-28 rounded-xl border border-white/10 bg-card p-7 text-ink shadow-2xl">
      <div className="mb-6 flex items-center gap-3">
        <BrandMark size={44} />
        <div>
          <h2 className="text-[19px] font-bold text-navy">Staff sign in</h2>
          <p className="text-[13px] text-muted">Operations dashboard · {AGENCY.name}</p>
        </div>
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
      <p className="mt-5 border-t border-line pt-4 text-center text-[12px] text-muted">
        Forgot your password? Ask the office admin to reset it.
      </p>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <TopBar />
      <NavBar />
      <main>
        <Hero loginCard={loginCard} />
        <FeatureCards />
        <About />
        <Services />
        <Counters />
        <Cylinders />
        <Gallery />
        <Safety />
        <Team />
        <Updates />
      </main>
      <Footer />
    </div>
  )
}
