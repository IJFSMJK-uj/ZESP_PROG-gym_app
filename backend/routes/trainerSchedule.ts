import express from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "./auth";

const router = express.Router();

function generateSlots(startHour: number, endHour: number) {
  const slots = [];

  for (let h = startHour; h < endHour; h++) {
    slots.push({
      startHour: h,
      endHour: h + 1,
    });
  }

  return slots;
}

router.get("/:trainerId", requireAuth, async (req: any, res) => {
  try {
    const trainerId = parseInt(req.params.trainerId);
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // availability filtrowana po siłowni użytkownika
    const availability = await prisma.trainerAvailability.findMany({
      where: {
        trainerId,
        OR: [{ gymId: user.gymId }, { gymId: null }],
      },
      include: {
        gym: true,
      },
    });

    // zakres tygodnia
    const weekStart = req.query.weekStart ? new Date(req.query.weekStart as string) : new Date();

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // rezerwacje
    const reservations = await prisma.trainerReservation.findMany({
      where: {
        trainerId,
        status: "CONFIRMED",
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    });
    const trainer = await prisma.user.findUnique({
      where: { id: trainerId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    const result: any = {};

    availability.forEach((a) => {
      const slots = generateSlots(a.startHour, a.endHour);

      if (!result[a.dayOfWeek]) {
        result[a.dayOfWeek] = [];
      }

      slots.forEach((slot) => {
        const isReserved = reservations.some((r) => {
          const rDate = new Date(r.date);
          const day = rDate.getDay();

          return (
            day === a.dayOfWeek && r.startHour === slot.startHour && r.endHour === slot.endHour
          );
        });

        result[a.dayOfWeek].push({
          startHour: slot.startHour,
          endHour: slot.endHour,
          available: !isReserved,
          gym: a.gym || null,
        });
      });
    });

    res.json({
      trainer,
      schedule: result,
    });
  } catch (err) {
    console.error("SCHEDULE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// turbo prosty post do testów - później do zmieny
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { trainerId, date, startHour, endHour, gymId } = req.body;

    if (!trainerId || !date || startHour == null || endHour == null) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // blokada double booking
    const existing = await prisma.trainerReservation.findFirst({
      where: {
        trainerId,
        date: new Date(date),
        startHour,
        endHour,
        status: "CONFIRMED",
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Slot taken" });
    }

    const reservation = await prisma.trainerReservation.create({
      data: {
        trainerId,
        userId,
        gymId: gymId ?? null,
        date: new Date(date),
        startHour,
        endHour,
        status: "CONFIRMED",
      },
    });
    console.log("AUTH HEADER:", req.headers.authorization);

    res.json(reservation);
  } catch (err) {
    console.error("POST RESERVATION ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
