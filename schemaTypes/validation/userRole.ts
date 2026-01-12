/**
 * Valid user roles
 */
export const USER_ROLES = ['admin', 'editor'] as const
export type UserRole = (typeof USER_ROLES)[number]

/**
 * Validate user role
 */
export function validateUserRole(role: string): boolean {
  return USER_ROLES.includes(role as UserRole)
}

/**
 * Custom validation rule for user role
 */
export const userRoleRule = (value: string) => {
  if (!value) return true

  if (!validateUserRole(value)) {
    return `Role must be one of: ${USER_ROLES.join(', ')}`
  }

  return true
}
