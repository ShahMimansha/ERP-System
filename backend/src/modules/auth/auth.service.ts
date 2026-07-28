import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> => {
  return bcrypt.compare(candidatePassword, userPassword);
};

export const signToken = (user: TokenPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET || 'default-secret',
    {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d',
    } as any
  );
};
