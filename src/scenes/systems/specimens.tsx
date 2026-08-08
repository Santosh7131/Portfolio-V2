import { memo, useState, type ReactNode } from 'react'

/*
 * Specimen rule: no raw colors, no raw radii — everything reads from the
 * --ds-* tokens on the scene root (1px hairline widths exempt). That's the
 * point of the scene: four variables, one system.
 */

function Cell({
  label,
  wide = false,
  children,
}: {
  label: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={wide ? 'ds-cell ds-cell--wide' : 'ds-cell'}>
      <span className="ds-cell-label">{label}</span>
      {children}
    </div>
  )
}

function ButtonsCell() {
  return (
    <Cell label="Buttons" wide>
      <div className="ds-btn-row">
        <button type="button" className="ds-btn ds-btn--primary">
          Continue
        </button>
        <button type="button" className="ds-btn ds-btn--secondary">
          Preview
        </button>
        <button type="button" className="ds-btn ds-btn--ghost">
          Dismiss
        </button>
      </div>
    </Cell>
  )
}

function InputCell() {
  return (
    <Cell label="Input">
      <label className="ds-field">
        <span className="ds-field-label">Email</span>
        <input
          className="ds-input"
          type="email"
          placeholder="you@studio.com"
          autoComplete="off"
        />
      </label>
    </Cell>
  )
}

function SwitchCell() {
  const [on, setOn] = useState(true)
  return (
    <Cell label="Switch">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className="ds-switch"
        onClick={() => setOn((value) => !value)}
      >
        <span className="ds-switch-track" aria-hidden="true">
          <span className="ds-switch-thumb" />
        </span>
        Auto-save
      </button>
    </Cell>
  )
}

function CardCell() {
  return (
    <Cell label="Card">
      <span className="ds-badge">v2.1</span>
      <h3 className="ds-card-title">Component library</h3>
      <p className="ds-card-meta">48 components · 4 tokens</p>
      <button type="button" className="ds-btn ds-btn--primary ds-btn--sm">
        View
      </button>
    </Cell>
  )
}

const CHIPS = ['Tokens', 'Motion', 'A11y', 'Type']

function ChipsCell() {
  const [selected, setSelected] = useState(CHIPS[0])
  return (
    <Cell label="Chips">
      <div className="ds-chips" role="radiogroup" aria-label="Topics">
        {CHIPS.map((chip) => (
          <label key={chip} className="ds-chip">
            <input
              type="radio"
              className="ds-visually-hidden"
              name="ds-chip"
              checked={selected === chip}
              onChange={() => setSelected(chip)}
            />
            <span>{chip}</span>
          </label>
        ))}
      </div>
    </Cell>
  )
}

/** Memoized: token changes are pure CSS-variable updates — specimens never re-render. */
export default memo(function Specimens() {
  return (
    <>
      <ButtonsCell />
      <InputCell />
      <SwitchCell />
      <CardCell />
      <ChipsCell />
    </>
  )
})
