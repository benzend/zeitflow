import { GODMODE_EMAILS } from './constants';

export function isAdmin(email: string): boolean {
  return GODMODE_EMAILS.includes(email);
}