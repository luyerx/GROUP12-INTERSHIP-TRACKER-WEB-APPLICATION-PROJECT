// Shared with public registration; preserve its existing 8–72 character policy.
export const ACCOUNT_PASSWORD_MIN = 8;
export const ACCOUNT_PASSWORD_MAX = 72;
export const PASSWORD_HASH_ROUNDS = 10;

export function accountPasswordError(password: string): string | null {
  if (password.length > ACCOUNT_PASSWORD_MAX)
    return "Use a valid name, email, and password of at most 72 characters.";
  if (password.length < ACCOUNT_PASSWORD_MIN)
    return "Password must contain at least 8 characters.";
  return null;
}
