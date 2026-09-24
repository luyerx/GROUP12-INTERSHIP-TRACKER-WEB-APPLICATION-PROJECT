// Shared by registration, reset and admin account creation (browser and server).
export const ACCOUNT_PASSWORD_MIN = 8;
export const ACCOUNT_PASSWORD_MAX = 72;
export const PASSWORD_HASH_ROUNDS = 10;

export function accountPasswordError(password: string): string | null {
  if (password.length > ACCOUNT_PASSWORD_MAX)
    return "Use a valid name, email, and password of at most 72 characters.";
  if (new TextEncoder().encode(password).length > ACCOUNT_PASSWORD_MAX)
    return "Password must use at most 72 UTF-8 bytes.";
  if (password.length < ACCOUNT_PASSWORD_MIN)
    return "Password must contain at least 8 characters.";
  return null;
}
