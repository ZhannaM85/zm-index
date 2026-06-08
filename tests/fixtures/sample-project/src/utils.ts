export type UserId = number;

export enum Role {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

export const DEFAULT_ROLE: Role = Role.User;

export function formatName(first: string, last: string): string {
  return `${first} ${last}`;
}

export function isAdmin(role: Role): boolean {
  return role === Role.Admin;
}
