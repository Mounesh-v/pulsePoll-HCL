import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Radio,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

export default function Register() {
  const {
    register,
    isSubmitting,
    authError,
    isAuthenticated,
    clearAuthError,
  } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    clearAuthError()
  }, [clearAuthError])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setLocalError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.name.trim().length < 2) {
      setLocalError('Your name must be at least 2 characters.')
      return
    }

    if (form.password.length < 8) {
      setLocalError('Your password must be at least 8 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    try {
      await register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
    } catch {
      setForm((current) => ({
        ...current,
        password: '',
        confirmPassword: '',
      }))
    }
  }

  const errorMessage = localError || authError

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[0.95fr_1.05fr]">
      <main className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2.5 text-ink lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-surface">
              <Radio size={18} />
            </span>
            <span className="font-display text-xl tracking-[-0.04em]">
              PulsePoll
            </span>
          </Link>

          <div className="rounded-[2rem] border border-line bg-surface p-6 shadow-soft sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles size={13} />
              Get started free
            </span>
            <h1 className="mt-4 font-display text-3xl leading-tight text-ink">
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-subtle">
              Start a poll and watch the results arrive live.
            </p>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  Full name
                </label>
                <div className="relative">
                  <UserRound
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={50}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ada Lovelace"
                    className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-11 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-surface shadow-card transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-subtle">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary transition hover:text-ink"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <aside className="hidden flex-col justify-between border-l border-line bg-surface p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-surface">
            <Radio size={19} />
          </span>
          <span className="font-display text-2xl tracking-[-0.04em] text-ink">
            PulsePoll
          </span>
        </Link>

        <div className="max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-soft/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-subtle">
            <Sparkles size={14} className="text-primary" />
            Built for live moments
          </span>
          <h2 className="mt-5 font-display text-5xl leading-[1.02] text-ink">
            Turn curiosity into a live conversation.
          </h2>
          <ul className="mt-7 space-y-3.5 text-sm text-subtle">
            {[
              'Create a poll in seconds',
              'Share one simple public link',
              'Watch votes update in real time',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle2 size={17} className="shrink-0 text-live" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-3xl border border-line bg-surface-soft/25 p-6">
            <p className="font-display text-2xl text-ink">
              &ldquo;Which idea should we ship first?&rdquo;
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Live analytics', 'Integrations', 'Custom branding'].map(
                (option) => (
                  <span
                    key={option}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-subtle"
                  >
                    {option}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm text-muted">
          <ShieldCheck size={16} />
          No spam, no setup calls, no complicated dashboards.
        </p>
      </aside>
    </div>
  )
}
