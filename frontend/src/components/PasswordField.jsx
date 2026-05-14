import { useCallback, useId, useState } from 'react'

/**
 * Пароль: клик по «глазу» закрепляет видимость; наведение на иконку без закрепления — временный показ.
 */
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  required = false,
  error = false,
}) {
  const id = useId()
  const [pinnedVisible, setPinnedVisible] = useState(false)
  const [hoverReveal, setHoverReveal] = useState(false)

  const visible = pinnedVisible || hoverReveal
  const type = visible ? 'text' : 'password'

  const togglePinned = useCallback(() => {
    setPinnedVisible((v) => !v)
  }, [])

  return (
    <label className={`password-field${error ? ' password-field--error' : ''}`} htmlFor={id}>
      <span className="password-field__label-text">{label}</span>
      <div className="password-field__wrap">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          className="password-field__input"
        />
        <button
          type="button"
          className="password-field__eye"
          title={
            pinnedVisible
              ? 'Скрыть пароль (нажмите)'
              : 'Показать: наведите курсор или нажмите, чтобы закрепить'
          }
          aria-label={pinnedVisible ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={pinnedVisible}
          onMouseEnter={() => setHoverReveal(true)}
          onMouseLeave={() => setHoverReveal(false)}
          onClick={(e) => {
            e.preventDefault()
            togglePinned()
          }}
        >
          {visible ? <IconEyeOpen /> : <IconEyeClosed />}
        </button>
      </div>
    </label>
  )
}

function IconEyeClosed() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconEyeOpen() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}
