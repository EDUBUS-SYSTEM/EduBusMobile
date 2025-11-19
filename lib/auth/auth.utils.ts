import type { AuthResponse } from './auth.type';

export const ALLOWED_ROLES = ['Driver', 'Parent', 'Supervisor'] as const;
export type AllowedRole = typeof ALLOWED_ROLES[number];

/**
 * Check if a role is allowed to access the mobile app
 */
export const isRoleAllowed = (role: string): role is AllowedRole => {
  return ALLOWED_ROLES.includes(role as AllowedRole);
};

/**
 * Check if auth response contains an allowed role
 */
export const isAuthResponseAllowed = (response: AuthResponse): boolean => {
  return isRoleAllowed(response.role);
};

/**
 * Get user-friendly error message for disallowed roles
 */
export const getRoleErrorMessage = (role: string): string => {
  if (role === 'Admin') {
    return 'Admin accounts are not allowed to access the mobile app. Please use the web interface instead.';
  }
  return `Role "${role}" is not supported in the mobile app.`;
};
