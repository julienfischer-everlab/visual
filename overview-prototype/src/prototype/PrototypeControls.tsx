import { useState } from 'react'
import { usePrototype } from './PrototypeContext'
import './PrototypeControls.css'

interface Option<T> {
  label: string
  value: T
}

function Segmented<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="tweak">
      <span className="tweak__label">{label}</span>
      <div className="tweak__segments" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className="tweak__segment"
            data-selected={option.value === value ? 'true' : 'false'}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Prototype-only tweak panel. It floats above the app and shares no styling
 * with the product UI, so the Overview underneath stays exactly as designed.
 */
export function PrototypeControls() {
  const {
    viewport,
    setViewport,
    biomarkers,
    setBiomarkers,
    isNewUser,
    setIsNewUser,
    theme,
    setTheme,
  } = usePrototype()
  const [open, setOpen] = useState(true)

  return (
    <div className="tweaks-panel" data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className="tweaks-panel__toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="tweaks-panel__title">Prototype tweaks</span>
        <span className="tweaks-panel__chevron">{open ? '▾' : '▴'}</span>
      </button>

      {open ? (
        <div className="tweaks-panel__body">
          <Segmented
            label="Viewport"
            value={viewport}
            onChange={setViewport}
            options={[
              { label: 'Mobile', value: 'mobile' as const },
              { label: 'Desktop', value: 'desktop' as const },
            ]}
          />

          <Segmented
            label="Biomarkers"
            value={biomarkers}
            onChange={setBiomarkers}
            options={[
              { label: 'ON', value: true },
              { label: 'OFF', value: false },
            ]}
          />

          <Segmented
            label="New user"
            value={isNewUser}
            onChange={setIsNewUser}
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />

          <Segmented
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { label: 'Light', value: 'light' as const },
              { label: 'Dark', value: 'dark' as const },
            ]}
          />

          <p className="tweaks-panel__state">
            <code>isNewUser: {String(isNewUser)}</code>
            <span>
              {isNewUser
                ? 'State is live — module content is unchanged until the new-user Overview is defined.'
                : 'Standard Overview.'}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  )
}
