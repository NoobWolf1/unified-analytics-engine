import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;

export const hashString = async (data: string): Promise<string> => {
  return bcrypt.hash(data, SALT_ROUNDS);
};

export const compareStringAndHash = async (data: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(data, hash);
};

export const generateApiKey = (length: number = 32): string => {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};