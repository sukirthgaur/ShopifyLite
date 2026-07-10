import bcrypt from 'bcryptjs';

// The cost factor determining how computationally expensive it is to compute the hash
const SALT_ROUNDS = 10;

/**
 * Hash Password Helper
 * Salts and hashes plain text passwords using bcrypt.
 * Never store passwords in clear text!
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare Password Helper
 * Decrypts salt and evaluates plain text password attempts against hashed passwords.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
