import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch users' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, password } = req.body;
    
    if (!name || !email || !role || !password) {
      res.status(400).json({ error: 'Bad Request', message: 'Name, email, role, and password are required' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { name }]
      }
    });

    if (existingUser) {
      res.status(409).json({ error: 'Conflict', message: 'User with this email or name already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role as Role,
        passwordHash,
        isActive: true,
        requiresPasswordChange: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    // Prevent changing the role or active status of the last administrator? Optional, but good practice.
    // Assuming we just follow the requirements exactly for now:
    const dataToUpdate: any = {};
    if (role !== undefined) dataToUpdate.role = role as Role;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update user' });
  }
};

export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        requiresPasswordChange: true,
      },
    });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reset password' });
  }
};
