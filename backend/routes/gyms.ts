import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
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

// Pobieramy wszystkie siłownie - GET /gyms
router.get("/", requireAuth, async (req: any, res: any) => {
  try {
    const gyms = await prisma.gym.findMany();
    res.json(gyms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się pobrać siłowni" });
  }
});

// Aktualizacja danych własnej siłowni (tylko rola GYM) - PATCH /gyms/me
// WAŻNE: musi być przed /:id żeby Express nie potraktował "me" jako id
router.patch("/me", requireAuth, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }

    if (user.role !== Role.GYM) {
      return res.status(403).json({ error: "Brak uprawnień. Tylko konto siłowni może edytować dane siłowni." });
    }

    if (!user.gymId) {
      return res.status(400).json({ error: "Konto nie jest powiązane z żadną siłownią" });
    }

    const { openTime, closeTime, address } = req.body;
    const dataToUpdate: { openTime?: string; closeTime?: string; address?: string } = {};

    if (openTime !== undefined) dataToUpdate.openTime = openTime;
    if (closeTime !== undefined) dataToUpdate.closeTime = closeTime;
    if (address !== undefined) dataToUpdate.address = address;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "Brak danych do aktualizacji" });
    }

    const updatedGym = await prisma.gym.update({
      where: { id: user.gymId },
      data: dataToUpdate,
    });

    res.json({ message: "Dane siłowni zaktualizowane pomyślnie", gym: updatedGym });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się zaktualizować danych siłowni" });
  }
});

// Pobieramy jedną siłownie po ID - GET /gyms/:id
router.get("/:id", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  if (isNaN(gymId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });
  }

  try {
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      return res.status(404).json({ error: "Nie znaleziono siłowni" })
    }

    res.json(gym);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie znaleziono siłowni" });
  }

});


router.put("/:id", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  console.log("req.userId:", req.userId, "gymId:", gymId);

  if (isNaN(gymId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });
  }

  try {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) return res.status(404).json({ error: "Nie znaleziono siłowni ale checa" });

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { gymId },
    });

    res.json({ message: `Wybrano siłownię: ${gym.name}`, gym: updatedUser.gymId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Nie udało się przypisać siłowni" });
  }

});


export default router;