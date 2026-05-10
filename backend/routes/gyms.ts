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
    const { address, operatingHours, additionalInfo, description, lat, lng, email, phoneNumber } =
      req.body;

    const dataToUpdate: any = {};

    if (address !== undefined) dataToUpdate.address = address;
    if (additionalInfo !== undefined) dataToUpdate.additionalInfo = additionalInfo;
    if (description !== undefined) dataToUpdate.description = description;

    if (lat !== undefined) dataToUpdate.lat = lat;
    if (lng !== undefined) dataToUpdate.lng = lng;
    if (email !== undefined) dataToUpdate.email = email;
    if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber;

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

router.get("/:id/stats", requireAuth, async (req: any, res: any) => {
  try {
    const gymId = Number(req.params.id);

    if (!gymId) {
      return res.status(400).json({ error: "Brak ID siłowni" });
    }

    const now = new Date();

    // Staty
    const reservations = await prisma.trainerReservation.findMany({
      where: {
        assignment: {
          gymId: gymId,
        },
      },
      select: {
        status: true,
        date: true,
      },
    });

    let confirmed = 0;
    let cancelled = 0;
    let done = 0;

    reservations.forEach((r) => {
      if (r.status === "CONFIRMED" && r.date >= now) confirmed++;
      if (r.status === "CANCELLED") cancelled++;
      if (r.status === "DONE") done++;
    });

    // Trenerzy
    const trainers = await prisma.trainerAssignment.findMany({
      where: {
        gymId: gymId,
      },
      include: {
        trainerProfile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        reservations: {
          select: {
            status: true,
            date: true,
          },
        },
      },
    });

    const formattedTrainers = trainers.map((t) => {
      let confirmed = 0;
      let cancelled = 0;
      let done = 0;

      t.reservations.forEach((r) => {
        if (r.status === "CONFIRMED" && r.date >= now) confirmed++;
        if (r.status === "CANCELLED") cancelled++;
        if (r.status === "DONE") done++;
      });

      return {
        id: t.id,
        firstName: t.trainerProfile?.firstName || "",
        lastName: t.trainerProfile?.lastName || "",
        confirmed,
        cancelled,
        done,
      };
    });

    return res.json({
      confirmed,
      cancelled,
      done,
      trainers: formattedTrainers,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Błąd serwera" });
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
      include: { operatingHours: true, rooms: { orderBy: { name: "asc" } } },
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

// ─── SALE ─────────────────────────────────────────────────────────────────────

const requireGymManager = async (req: any, res: any, gymId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { managedGyms: { select: { id: true } } },
  });
  if (!user || user.role !== Role.GYM_MANAGER)
    return res.status(403).json({ error: "Brak uprawnień" });
  if (!user.managedGyms.some((g) => g.id === gymId))
    return res.status(403).json({ error: "Nie zarządzasz tą siłownią" });
  return null;
};

router.get("/:gymId/rooms", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.gymId);
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });
  const denied = await requireGymManager(req, res, gymId);
  if (denied !== null) return;
  try {
    const rooms = await prisma.gymRoom.findMany({
      where: { gymId },
      orderBy: { name: "asc" },
    });
    res.json(rooms);
  } catch {
    res.status(500).json({ error: "Błąd pobierania sal" });
  }
});

router.post("/:gymId/rooms", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.gymId);
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });
  const denied = await requireGymManager(req, res, gymId);
  if (denied !== null) return;
  const { name, capacity } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Nazwa sali jest wymagana" });
  try {
    const room = await prisma.gymRoom.create({
      data: { gymId, name: name.trim(), capacity: capacity ? parseInt(capacity) : null },
    });
    res.status(201).json(room);
  } catch {
    res.status(500).json({ error: "Błąd tworzenia sali" });
  }
});

router.patch("/:gymId/rooms/:roomId", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.gymId);
  const roomId = parseInt(req.params.roomId);
  if (isNaN(gymId) || isNaN(roomId)) return res.status(400).json({ error: "Nieprawidłowe ID" });
  const denied = await requireGymManager(req, res, gymId);
  if (denied !== null) return;
  const { name, capacity } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Nazwa sali jest wymagana" });
  try {
    const room = await prisma.gymRoom.update({
      where: { id: roomId },
      data: {
        name: name.trim(),
        capacity: capacity !== undefined ? (capacity ? parseInt(capacity) : null) : undefined,
      },
    });
    res.json(room);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Nie znaleziono sali" });
    res.status(500).json({ error: "Błąd aktualizacji sali" });
  }
});

router.delete("/:gymId/rooms/:roomId", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.gymId);
  const roomId = parseInt(req.params.roomId);
  if (isNaN(gymId) || isNaN(roomId)) return res.status(400).json({ error: "Nieprawidłowe ID" });
  const denied = await requireGymManager(req, res, gymId);
  if (denied !== null) return;
  try {
    await prisma.gymRoom.delete({ where: { id: roomId } });
    res.json({ message: "Sala usunięta" });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Nie znaleziono sali" });
    res.status(500).json({ error: "Błąd usuwania sali" });
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

router.patch("/:id", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);

  if (isNaN(gymId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { managedGyms: true },
    });

    if (!user || user.role !== Role.GYM_MANAGER) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }

    const isManager = user.managedGyms.some((g) => g.id === gymId);

    if (!isManager) {
      return res.status(403).json({ error: "Nie zarządzasz tą siłownią" });
    }

    const { address, additionalInfo, description, lat, lng, email, phoneNumber, operatingHours } =
      req.body;

    const dataToUpdate: any = {};

    if (address !== undefined) dataToUpdate.address = address;
    if (additionalInfo !== undefined) dataToUpdate.additionalInfo = additionalInfo;
    if (description !== undefined) dataToUpdate.description = description;
    if (lat !== undefined) dataToUpdate.lat = lat;
    if (lng !== undefined) dataToUpdate.lng = lng;
    if (email !== undefined) dataToUpdate.email = email;
    if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber;

    // Godziny
    if (operatingHours && Array.isArray(operatingHours)) {
      dataToUpdate.operatingHours = {
        deleteMany: {}, // usuń stare
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
      message: "Zaktualizowano siłownię",
      gym: updatedGym,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się zaktualizować danych siłowni" });
  }
});

export default router;
