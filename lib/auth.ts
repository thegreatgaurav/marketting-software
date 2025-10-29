import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Store hashed password (computed once)
let cachedHashedPassword: string | null = null;

async function getHashedPassword(): Promise<string> {
  if (!cachedHashedPassword) {
    cachedHashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  }
  return cachedHashedPassword;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hashedPassword = await getHashedPassword();
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(username: string, password: string): Promise<string | null> {
  if (username === ADMIN_USERNAME && await verifyPassword(password)) {
    return generateToken(username);
  }
  return null;
}
