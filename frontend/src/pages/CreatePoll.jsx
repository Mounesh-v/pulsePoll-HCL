import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Lightbulb,
  ListChecks,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { getApiErrorMessage, pollApi } from '../services/api'

const MAX_OPTIONS = 6

export default function CreatePoll() {
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOptionChange = (index, value) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    )
    setError('')
  }

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) {
      return
    }

    setOptions((current) => [...current, ''])
  }

  const removeOption = (index) => {
    if (options.length <= 2) {
      return
    }

    setOptions((current) =>
      current.filter((_, optionIndex) => optionIndex !== index),
    )
  }

  const validate = () => {
    const trimmedQuestion = question.trim()

    if (trimmedQuestion.length < 5 || trimmedQuestion.length > 200) {
      return 'Your question must be between 5 and 200 characters.'
    }

    const trimmedOptions = options.map((option) => option.trim())

    if (trimmedOptions.some((option) => option.length === 0)) {
      return 'Every option needs some text.'
    }

    if (trimmedOptions.some((option) => option.length > 100)) {
      return 'Each option must be 100 characters or fewer.'
    }

    const uniqueOptions = new Set(
      trimmedOptions.map((option) => option.toLowerCase()),
    )

    if (uniqueOptions.size !== trimmedOptions.length) {
      return 'Options must be unique.'
    }

    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      return 'The expiry date must be in the future.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await pollApi.create({
        question: question.trim(),
        options: options.map((option) => option.trim()),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      })

      navigate(`/polls/${result.data.id}`)
    } catch (createError) {
      setError(getApiErrorMessage(createError, 'Could not create the poll'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-subtle transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="mt-6 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-subtle">
          <Sparkles size={14} className="text-primary" />
          New poll
        </span>
        <h1 className="mt-4 font-display text-4xl leading-[1.02] text-ink sm:text-5xl">
          Ask something worth answering.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-subtle">
          One clear question, two to six options, and a public link you can
          share anywhere.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8"
        >
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="question"
              className="mb-2 block text-sm font-semibold text-ink"
            >
              Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value)
                setError('')
              }}
              rows={3}
              maxLength={200}
              required
              placeholder="What should we build next?"
              className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3.5 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>Keep it short and specific.</span>
              <span>{question.length}/200</span>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-semibold text-ink">
                Options
              </label>
              <span className="rounded-full bg-surface-soft/45 px-2.5 py-1 text-xs font-medium text-subtle">
                {options.length}/{MAX_OPTIONS}
              </span>
            </div>

            <div className="space-y-2.5">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(event) =>
                      handleOptionChange(index, event.target.value)
                    }
                    maxLength={100}
                    required
                    placeholder={`Option ${index + 1}`}
                    className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted/50 px-3.5 py-2 text-sm font-medium text-subtle transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <Plus size={16} />
                Add option
              </button>
            )}
          </div>

          <div className="mt-7">
            <label
              htmlFor="expiresAt"
              className="mb-2 block text-sm font-semibold text-ink"
            >
              Expiry date
              <span className="ml-1.5 font-normal text-muted">(optional)</span>
            </label>
            <input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => {
                setExpiresAt(event.target.value)
                setError('')
              }}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-ink outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 sm:max-w-xs"
            />
            <p className="mt-2 text-xs text-muted">
              Leave empty to keep the poll open until you close it.
            </p>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-line px-5 py-3 text-sm font-medium text-subtle transition hover:bg-surface-soft/35 hover:text-ink"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-surface shadow-card transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Publish poll
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lightbulb size={20} />
            </span>
            <h2 className="mt-4 font-display text-xl text-ink">
              Polls that get answers
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-subtle">
              {[
                'Ask one question at a time.',
                'Keep options short and distinct.',
                'Add an expiry for time-sensitive decisions.',
              ].map((tip) => (
                <li key={tip} className="flex gap-2.5">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-live"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
            <div className="flex items-center gap-2 font-display text-xl text-ink">
              <ListChecks size={19} className="text-primary" />
              What happens next?
            </div>
            <ol className="mt-4 space-y-3.5 text-sm leading-relaxed text-subtle">
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  1
                </span>
                Share the public poll link.
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  2
                </span>
                Votes appear in real time.
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  3
                </span>
                Close the poll whenever you are ready.
              </li>
            </ol>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface-soft/30 px-4 py-3.5 text-xs leading-relaxed text-subtle">
            <CalendarClock size={16} className="mt-0.5 shrink-0 text-muted" />
            Expired polls stop accepting votes automatically.
          </div>
        </aside>
      </div>
    </div>
  )
}
