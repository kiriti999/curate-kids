/**
 * Shared access helpers for multi-tenant rules.
 *
 * A "platform admin" sees and manages everything: super-admins, and admins that
 * don't belong to any organization (the site owner). An "admin" that belongs to
 * an organization (a Telegram group owner) is scoped to that organization.
 */

type AccessUser = {
  id: string | number
  role?: string | null
  organization?: string | { id: string } | null
} | null | undefined

export function relationId(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'object') return (value as { id?: string }).id
  return String(value)
}

export function isPlatformAdmin(user: AccessUser): boolean {
  if (!user) return false
  if (user.role === 'superadmin') return true
  return user.role === 'admin' && !relationId(user.organization)
}

/** Org admins manage their organization; platform admins are handled separately */
export function isOrgAdmin(user: AccessUser): boolean {
  return !!user && user.role === 'admin' && !!relationId(user.organization)
}

/**
 * Where-clause limiting videos to what this user may see: the ones they
 * submitted plus those of their organization. Returns true for platform
 * admins (no restriction) and false for signed-out visitors (nothing).
 */
export function videoScope(user: AccessUser): true | false | { or: Record<string, unknown>[] } {
  if (!user) return false
  if (isPlatformAdmin(user)) return true
  const or: Record<string, unknown>[] = [{ submittedBy: { equals: user.id } }]
  const org = relationId(user.organization)
  if (org) or.push({ organization: { equals: org } })
  return { or }
}
