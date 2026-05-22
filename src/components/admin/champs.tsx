type OptionSelect = { valeur: string; libelle: string }

const styleChamp =
  'rounded-lg border border-bordure bg-craie px-3 py-2 text-encre'

export function ChampTexte({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string | null
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-encre">{label}</span>
      <input name={name} defaultValue={defaultValue ?? ''} className={styleChamp} />
    </label>
  )
}

export function ChampZoneTexte({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string | null
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-encre">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ''}
        rows={4}
        className={styleChamp}
      />
    </label>
  )
}

export function ChampNombre({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: number | null
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-encre">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue ?? 0}
        className={styleChamp}
      />
    </label>
  )
}

export function ChampCase({
  label,
  name,
  defaultChecked,
}: {
  label: string
  name: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span className="text-sm font-medium text-encre">{label}</span>
    </label>
  )
}

export function ChampSelect({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: OptionSelect[]
  defaultValue?: string | null
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-encre">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        className={styleChamp}
      >
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  )
}
