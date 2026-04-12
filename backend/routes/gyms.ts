import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "jwt_x";

const requireAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Brak tokenu" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Nieprawidlowy token" });
  }
};

router.get("/", requireAuth, async (req: any, res: any) => {
  try {
    const gyms = await prisma.gym.findMany({
      include: {
        operatingHours: true,
      },
    });
    res.json(gyms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się pobrać siłowni" });
  }
});

router.patch("/me", requireAuth, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { managedGyms: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }

    if (user.role !== Role.GYM_MANAGER) {
      return res.status(403).json({
        error: "Brak uprawnień.",
      });
    }

    if (user.managedGyms.length === 0) {
      return res.status(400).json({ error: "Konto nie jest powiązane z żadną siłownią" });
    }

    const gymId = user.managedGyms[0].id;
    const { address, operatingHours, additionalInfo } = req.body;

    const dataToUpdate: any = {};
    if (address !== undefined) dataToUpdate.address = address;
    if (additionalInfo !== undefined) dataToUpdate.additionalInfo = additionalInfo;

    if (operatingHours && Array.isArray(operatingHours)) {
      dataToUpdate.operatingHours = {
        deleteMany: {},
        create: operatingHours.map((hour: any) => ({
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
        })),
      };
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "Brak danych do aktualizacji" });
    }

    const updatedGym = await prisma.gym.update({
      where: { id: gymId },
      data: dataToUpdate,
      include: { operatingHours: true },
    });

    res.json({
      message: "Dane siłowni zaktualizowane pomyślnie",
      gym: updatedGym,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się zaktualizować danych siłowni" });
  }
});

router.get("/:id", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  if (isNaN(gymId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });
  }

  try {
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      include: { operatingHours: true },
    });

    if (!gym) {
      return res.status(404).json({ error: "Nie znaleziono siłowni" });
    }

    res.json(gym);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie znaleziono siłowni" });
  }
});

router.put("/:id", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);

  if (isNaN(gymId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "Nie znaleziono użytkownika" });

    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      include: { managers: { select: { id: true } } },
    });
    if (!gym) return res.status(404).json({ error: "Nie znaleziono siłowni" });

    if (user.role === Role.GYM_MANAGER) {
      const isManager = gym.managers.some((m) => m.id === req.userId);
      if (!isManager) {
        return res.status(403).json({
          error: "Nie jesteś managerem.",
        });
      }
    }

    await prisma.memberProfile.upsert({
      where: { userId: req.userId },
      update: { homeGymId: gymId },
      create: { userId: req.userId, homeGymId: gymId },
    });

    res.json({
      message: `Wybrano siłownię: ${gym.name}`,
      gym: gymId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Nie udało się przypisać siłowni" });
  }
});

export default router;
