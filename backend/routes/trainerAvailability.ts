import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

import { requireAuth } from "./auth";

router.get("/trainer/me", requireAuth, async (req: any, res) => {
  try {
    const trainerId = req.userId;

    const availability = await prisma.trainerAvailability.findMany({
      where: { trainerId },
      include: {
        gym: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
    });

    res.json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST - add availability
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const trainerId = req.userId;
    const { gymId, dayOfWeek, startHour, endHour } = req.body;
    // WALIDACJA ROLI
    const user = await prisma.user.findUnique({
      where: { id: trainerId },
    });

    if (user?.role !== "TRAINER") {
      return res.status(403).json({ error: "Tylko trenerzy mogą dodawać dostępność" });
    }

    if (trainerId == null || dayOfWeek == null || startHour == null || endHour == null) {
      return res.status(400).json({ error: "Brakujące pola" });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6)
      return res.status(400).json({ error: "Błędny dzień tygodnia" });

    if (startHour < 0 || startHour > 23)
      return res.status(400).json({ error: "Błędna godzina rozpoczęcia" });

    if (endHour < 1 || endHour > 24)
      return res.status(400).json({ error: "Błędna godzina zakończenia" });

    if (startHour >= endHour)
      return res.status(400).json({
        error: "Godzina rozpoczęcia musi być mniejsza niż zakończenia",
      });

    // check overlap
    let overlap;

    if (gymId === null) {
      overlap = await prisma.trainerAvailability.findFirst({
        where: {
          trainerId,
          dayOfWeek,
          startHour: { lt: endHour },
          endHour: { gt: startHour },
        },
      });
    } else {
      overlap = await prisma.trainerAvailability.findFirst({
        where: {
          trainerId,
          dayOfWeek,
          startHour: { lt: endHour },
          endHour: { gt: startHour },
          OR: [{ gymId }, { gymId: null }],
        },
      });
    }

    if (overlap) {
      return res.status(409).json({ error: "Kolizja czasów dostępności" });
    }

    const availability = await prisma.trainerAvailability.create({
      data: {
        trainerId,
        gymId,
        dayOfWeek,
        startHour,
        endHour,
      },
    });

    res.json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET trainer availability
router.get("/trainer/:trainerId", requireAuth, async (req, res) => {
  try {
    const trainerId = parseInt(req.params.trainerId);

    const availability = await prisma.trainerAvailability.findMany({
      where: { trainerId },
      include: {
        gym: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
    });

    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE availability
router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Nieprawidłowy ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "TRAINER") {
      return res.status(403).json({ error: "Tylko trenerzy mogą usuwać dostępność" });
    }

    const slot = await prisma.trainerAvailability.findUnique({
      where: { id },
    });

    if (!slot) {
      return res.status(404).json({ error: "Dostępność nie znaleziona" });
    }

    if (slot.trainerId !== userId) {
      return res.status(403).json({ error: "Tylko właściciel może usuwać dostępność" });
    }

    await prisma.trainerAvailability.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
