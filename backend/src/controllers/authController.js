import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { computeAllAnalyticsForStudent } from '../services/analyticsEngine.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'academic_lms_super_secret_key';

export async function register(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  const normalizedRole = role.toUpperCase();
  if (normalizedRole !== 'STUDENT' && normalizedRole !== 'INSTRUCTOR') {
    return res.status(400).json({ error: 'Invalid role. Must be STUDENT or INSTRUCTOR' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: normalizedRole
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Record login activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'login',
        duration: 10 // Mock default session duration of 10 minutes
      }
    });

    // If Student, run analytics update in background
    if (user.role === 'STUDENT') {
      // Recompute analytics for all enrolled courses
      computeAllAnalyticsForStudent(user.id).catch(err => 
        console.error('Background login analytics recomputation error:', err)
      );
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in' });
  }
}

export async function me(req, res) {
  return res.json({ user: req.user });
}

export async function logout(req, res) {
  // Client is expected to delete the token, but we return a success status
  return res.json({ message: 'Logged out successfully' });
}
