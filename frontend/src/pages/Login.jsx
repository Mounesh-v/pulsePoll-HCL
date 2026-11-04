import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Radio,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const {
    login,
    isSubmitting,
    authError,
    isAuthenticated,
    clearAuthError,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    clearAuthError()
  }, [clearAuthError])

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await login(form)
      navigate(redirectTo, { replace: true })
    } catch {
      setForm((current) => ({ ...current, password: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="hidden flex-col justify-between border-r border-line bg-surface p-12 lg:flex">
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
            Live in real time
          </span>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] text-ink">
            Your audience is already answering.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-subtle">
            Sign in to pick up where you left off and see every vote land the
            moment it happens.
          </p>

          <div className="mt-8 rounded-3xl border border-line bg-surface-soft/25 p-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-live">
              <span className="h-2 w-2 rounded-full bg-live" />
              Live preview
            </div>
            <p className="mt-3 font-display text-2xl text-ink">
              What should we build next?
            </p>
            <div className="mt-5 space-y-3">
              {[
                { width: '78%', color: '#0866F5' },
                { width: '52%', color: '#0799CC' },
                { width: '34%', color: '#16865D' },
              ].map((bar) => (
                <div
                  key={bar.width}
                  className="h-2.5 overflow-hidden rounded-full bg-surface"
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: bar.width, backgroundColor: bar.color }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm text-muted">
          <ShieldCheck size={16} />
          PulsePoll keeps voting simple and anonymous by design.
        </p>
      </aside>

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
              <Lock size={13} />
              Welcome back
            </span>
            <h2 className="mt-4 font-display text-3xl leading-tight text-ink">
              Sign in to PulsePoll
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-subtle">
              Manage your polls and follow live results in one place.
            </p>

            {authError && (
              <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-surface shadow-card transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-subtle">
              New to PulsePoll?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary transition hover:text-ink"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
