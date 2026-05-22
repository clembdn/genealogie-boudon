'use client'

type ActionSuppression = (formData: FormData) => void | Promise<void>

export function BoutonSupprimer({
  id,
  action,
  libelle,
}: {
  id: string
  action: ActionSuppression
  libelle: string
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(`Supprimer « ${libelle} » ? Cette action est définitive.`)
        ) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm text-brume hover:text-red-700">
        Supprimer
      </button>
    </form>
  )
}
