import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_x';

const requireAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Brak tokenu' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Nieprawidlowy token' });
  }
};

// register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // add do db
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: 'Użytkownik stworzony!', userId: user.id });
  } catch (error) {
    res.status(400).json({ error: 'Użytkownik z tym mailem już istnieje.' });
  }
});

// login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: 'Nieprawidłowy e-mail lub haslo' });
  }

  // check passwort
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Nieprawidlowy e-mail lub haslo' });
  }

  // generate token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ message: 'Zalogowano pomyslnie', token });
});

router.get('/profile', requireAuth, async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { gym: true },
  });
  if (!user) return res.status(404).json({ error: 'Uzytkownik nie znaleziony' });
  res.json({ email: user.email, username: user.username, role: user.role, gym: user.gym });
});

router.put('/profile', requireAuth, async (req: any, res) => {
  const { email, username, role } = req.body;
  const dataToUpdate: { email?: string; username?: string; role?: Role } = {};

  if (email !== undefined) {
    dataToUpdate.email = email;
  }

  if (username !== undefined) {
    dataToUpdate.username = username;
  }

  if (role !== undefined) {
    dataToUpdate.role = role as Role;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: dataToUpdate,
    });
    res.json({ email: updated.email, username: updated.username, role: updated.role });
  } catch {
    res.status(400).json({ error: 'E-mail lub nazwa uzytkownika już zajęte.' });
  }
});

export default router;