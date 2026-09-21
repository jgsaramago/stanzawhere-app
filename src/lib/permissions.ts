/** People who can edit every colleague’s calendar + profiles. */
export const GLOBAL_EDITOR_IDS = ['joao', 'vaidehi', 'erica'] as const

export function canEditAll(actingAsId: string): boolean {
  return (GLOBAL_EDITOR_IDS as readonly string[]).includes(actingAsId)
}

/** Can the acting user change this person’s schedule / profile? */
export function canEditPerson(actingAsId: string, personId: string): boolean {
  return canEditAll(actingAsId) || actingAsId === personId
}
