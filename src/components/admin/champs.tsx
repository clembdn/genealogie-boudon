import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'

type ChampMeta = {
  label: string
  hint?: string
  requis?: boolean
}

export function Champ({
  label,
  hint,
  requis,
  children,
}: ChampMeta & { children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-encre">
        {label}
        {requis && <span className="ml-1 text-red-700">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-brume">{hint}</span>}
    </label>
  )
}

const classesInput =
  'h-11 rounded-[var(--radius-douce)] border border-bordure bg-craie px-3 text-base text-encre outline-none focus:border-sauge'

export function ChampTexte({
  label,
  hint,
  requis,
  ...props
}: ChampMeta & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Champ label={label} hint={hint} requis={requis}>
      <input type="text" required={requis} className={classesInput} {...props} />
    </Champ>
  )
}

export function ChampZoneTexte({
  label,
  hint,
  requis,
  rows = 6,
  ...props
}: ChampMeta & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Champ label={label} hint={hint} requis={requis}>
      <textarea
        rows={rows}
        required={requis}
        className={`min-h-[8rem] rounded-[var(--radius-douce)] border border-bordure bg-craie p-3 text-base text-encre outline-none focus:border-sauge`}
        {...props}
      />
    </Champ>
  )
}

type OptionItem = { value: string; label: string }

export function ChampSelect({
  label,
  hint,
  requis,
  options,
  ...props
}: ChampMeta &
  SelectHTMLAttributes<HTMLSelectElement> & { options: OptionItem[] }) {
  return (
    <Champ label={label} hint={hint} requis={requis}>
      <select required={requis} className={classesInput} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Champ>
  )
}

export function ChampCase({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 cursor-pointer accent-sauge"
        {...props}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-encre">{label}</span>
        {hint && <span className="text-xs text-brume">{hint}</span>}
      </span>
    </label>
  )
}
