import { randomBytes, scryptSync } from 'crypto';

// Generar hash de contraseña
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Verificar contraseña
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = scryptSync(password, salt, 64).toString('hex');
  return hash === verifyHash;
}

// Generar token simple
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}
