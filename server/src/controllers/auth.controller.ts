import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-local-dev';
const SALT_ROUNDS = 12;

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Bad Request', message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      // AC-02: Do not reveal if email or password is wrong or account inactive
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Exclude passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
      return;
    }

    // Exclude passwordHash
    const { passwordHash, ...userWithoutPassword } = req.user;

    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Bad Request', message: 'Current password and new password are required' });
      return;
    }

    // Verify current password
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Unauthorized', message: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedNewPassword,
        requiresPasswordChange: false
      }
    });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // Since JWT is stateless, logout is mostly handled on the client by deleting the token.
  // We just return a success response here.
  res.status(200).json({ message: 'Logged out successfully' });
};
