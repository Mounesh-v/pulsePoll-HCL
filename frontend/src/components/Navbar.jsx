import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  X,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

const navItemClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${
    active
      ? 'bg-primary/10 text-primary'
      : 'text-subtle hover:bg-surface-soft/45 hover:text-ink'
  }`

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setIsMenuOpen(false)

  const isDashboard =
    location.pathname === '/dashboard' && location.hash !== '#my-polls'
  const isMyPolls =
    location.pathname === '/dashboard' && location.hash === '#my-polls'
  const isExplore = location.pathname === '/' && location.hash === '#preview'

  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          onClick={closeMenu}
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-surface">
            <Activity size={18} strokeWidth={2.4} />
          </span>
          <span className="font-display text-[1.35rem] tracking-[-0.04em] text-ink">
            PulsePoll
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={navItemClass(isDashboard)}
                onClick={closeMenu}
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard#my-polls"
                className={navItemClass(isMyPolls)}
                onClick={closeMenu}
              >
                My polls
              </Link>
              <Link
                to="/#preview"
                className={navItemClass(isExplore)}
                onClick={closeMenu}
              >
                Explore
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={navItemClass(location.pathname === '/')}
                onClick={closeMenu}
              >
                Home
              </Link>
              <Link
                to="/#features"
                className={navItemClass(
                  location.pathname === '/' && location.hash === '#features',
                )}
                onClick={closeMenu}
              >
                Features
              </Link>
              <Link
                to="/#how-it-works"
                className={navItemClass(
                  location.pathname === '/' &&
                    location.hash === '#how-it-works',
                )}
                onClick={closeMenu}
              >
                How it works
              </Link>
            </>
          )}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/polls/new"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition hover:bg-ink"
              >
                <Plus size={16} />
                Create poll
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-line bg-surface-soft/35 py-1 pl-1 pr-1.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-surface">
                  {initials}
                </span>
                <span className="max-w-[120px] truncate text-sm font-medium text-ink">
                  {user?.name || user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
                  aria-label="Log out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-subtle transition hover:bg-surface-soft/45 hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition hover:bg-ink"
              >
                Get started
                <ArrowUpRight size={16} />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition hover:bg-surface-soft/40 lg:hidden"
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-line bg-surface px-4 pb-5 pt-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={navItemClass(isDashboard)}
                  onClick={closeMenu}
                >
                  <span className="inline-flex items-center gap-2">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </span>
                </Link>
                <Link
                  to="/dashboard#my-polls"
                  className={navItemClass(isMyPolls)}
                  onClick={closeMenu}
                >
                  My polls
                </Link>
                <Link
                  to="/#preview"
                  className={navItemClass(isExplore)}
                  onClick={closeMenu}
                >
                  Explore
                </Link>
                <Link
                  to="/polls/new"
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-surface transition hover:bg-ink"
                  onClick={closeMenu}
                >
                  <Plus size={16} />
                  Create poll
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={navItemClass(location.pathname === '/')}
                  onClick={closeMenu}
                >
                  Home
                </Link>
                <Link
                  to="/#features"
                  className={navItemClass(
                    location.pathname === '/' && location.hash === '#features',
                  )}
                  onClick={closeMenu}
                >
                  Features
                </Link>
                <Link
                  to="/#how-it-works"
                  className={navItemClass(
                    location.pathname === '/' &&
                      location.hash === '#how-it-works',
                  )}
                  onClick={closeMenu}
                >
                  How it works
                </Link>
                <div className="mt-3 grid gap-2 border-t border-line pt-4">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="rounded-full border border-line px-4 py-3 text-center text-sm font-medium text-ink transition hover:bg-surface-soft/40"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-surface transition hover:bg-ink"
                  >
                    Get started
                  </Link>
                </div>
              </>
            )}
          </nav>

          {isAuthenticated && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-soft/30 p-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-surface">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {user?.name || 'PulsePoll user'}
                  </p>
                  <p className="truncate text-xs text-muted">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-subtle transition hover:bg-surface hover:text-ink"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
