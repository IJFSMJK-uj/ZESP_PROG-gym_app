import express from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "./auth";

const router = express.Router();

const autoUpdateReservations = async () => {
  const now = new Date();
  const today = new Date(now.toISOString().split("T")[0]);
  const currentHour = now.getHours();

  try {
    await prisma.trainerReservation.updateMany({
      where: {
        status: "CONFIRMED",
        OR: [
          { date: { lt: today } },
          {
            date: today,
            startHour: { lt: currentHour },
          },
        ],
      },
      data: { status: "DONE" },
    });
  } catch (err) {
    console.error("AUTO UPDATE ERROR:", err);
  }
};

function generateSlots(startHour: number, endHour: number) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push({ startHour: h, endHour: h + 1 });
  }
  return slots;
}

router.get("/:assignmentId", requireAuth, async (req: any, res) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);
    if (isNaN(assignmentId)) return res.status(400).json({ error: "Nieprawidłowy ID assignment" });

    const assignment = await prisma.trainerAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        trainerProfile: { include: { user: true } },
        gym: true,
      },
    });

    if (!assignment) return res.status(404).json({ error: "Assignment nie znaleziony" });

    const weekStart = req.query.weekStart ? new Date(req.query.weekStart as string) : new Date();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const availabilityData = await prisma.trainerAvailability.findMany({ where: { assignmentId } });
    const availability = availabilityData.map((a) => ({
      ...a,
      startHour: a.startHour / 60,
      endHour: a.endHour / 60,
    }));

    const reservations = await prisma.trainerReservation.findMany({
      where: {
        assignmentId,
        status: "CONFIRMED",
        date: { gte: weekStart, lt: weekEnd },
      },
    });

    const result: any = {};
    availability.forEach((a) => {
      const slots = generateSlots(a.startHour, a.endHour);
      if (!result[a.dayOfWeek]) result[a.dayOfWeek] = [];
      slots.forEach((slot) => {
        const isReserved = reservations.some((r) => {
          const rDate = new Date(r.date);
          return rDate.getDay() === a.dayOfWeek && r.startHour === slot.startHour;
        });
        result[a.dayOfWeek].push({
          startHour: slot.startHour,
          endHour: slot.endHour,
          available: !isReserved,
          gym: assignment.gym || null,
        });
      });
    });

    res.json({
      trainer: {
        id: assignment.trainerProfile.user.id,
        email: assignment.trainerProfile.user.email,
        firstName: assignment.trainerProfile.firstName,
        lastName: assignment.trainerProfile.lastName,
      },
      schedule: result,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { assignmentId, date, startHour, endHour } = req.body;
    const assignmentIdNum = Number(assignmentId);
    const existing = await prisma.trainerReservation.findFirst({
      where: {
        assignmentId: assignmentIdNum,
        date: new Date(date),
        startHour,
        status: "CONFIRMED",
      },
    });
    if (existing) return res.status(409).json({ error: "Slot taken" });

    const reservation = await prisma.trainerReservation.create({
      data: {
        assignmentId: assignmentIdNum,
        userId,
        date: new Date(date),
        startHour,
        endHour,
        status: "CONFIRMED",
      },
    });
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/client/me", requireAuth, async (req: any, res) => {
  try {
    await autoUpdateReservations();
    const userId = req.userId;
    const reservations = await prisma.trainerReservation.findMany({
      where: { userId },
      include: {
        assignment: {
          include: {
            trainerProfile: true,
            gym: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/trainer/me/reservations", requireAuth, async (req: any, res) => {
  try {
    await autoUpdateReservations();
    const userId = req.userId;
    const trainerProfile = await prisma.trainerProfile.findUnique({ where: { userId } });
    if (!trainerProfile) return res.status(404).json({ error: "Trainer profile not found" });

    const reservations = await prisma.trainerReservation.findMany({
      where: { assignment: { trainerProfileId: trainerProfile.id } },
      include: {
        user: { select: { id: true, email: true } },
        assignment: { include: { gym: true } },
      },
      orderBy: { date: "desc" },
    });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/cancel", requireAuth, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.trainerReservation.update({
      where: { id },
      data: { status: "CANCELLED", cancelledById: req.userId },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
