export const Role = {
  CLIENT: 'CLIENT',
  ADMIN: 'ADMIN',
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];
