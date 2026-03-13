import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_x';

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
    return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' });
  }

  // check passwort
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' });
  }

  // generate token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ message: 'Zalogowano pomyślnie', token });
});

export default router;