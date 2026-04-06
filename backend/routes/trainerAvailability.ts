import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

import { requireAuth } from "./auth";

router.get("/trainer/me", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;

    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId },
      include: {
        assignments: {
          include: {
            gym: true,
            availabilities: true,
          },
        },
      },
    });

    if (!trainerProfile) {
      return res.json([]);
    }

    const availability = trainerProfile.assignments
      .flatMap((assignment) =>
        assignment.availabilities.map((slot) => ({
          ...slot,
          startHour: slot.startHour / 60,
          endHour: slot.endHour / 60,
          gym: assignment.gym,
          assignmentId: assignment.id,
        }))
      )
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startHour - b.startHour);

    res.json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET trainer's assigned gyms
router.get("/trainer/me/gyms", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;

    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId },
      include: {
        assignments: {
          include: {
            gym: true,
          },
        },
      },
    });

    if (!trainerProfile) {
      return res.json([]);
    }

    const gyms = trainerProfile.assignments.map((assignment) => ({
      id: assignment.gym.id,
      name: assignment.gym.name,
      address: assignment.gym.address,
      assignmentId: assignment.id,
    }));

    res.json(gyms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST - add availability
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { gymId, assignmentId, dayOfWeek, startHour, endHour } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trainerProfile: {
          include: {
            assignments: true,
          },
        },
      },
    });

    if (user?.role !== "TRAINER" || !user.trainerProfile) {
      return res.status(403).json({ error: "Tylko trenerzy mogą dodawać dostępność" });
    }

    if (dayOfWeek == null || startHour == null || endHour == null) {
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

    const startMinute = startHour * 60;
    const endMinute = endHour * 60;

    let assignment = null;

    if (assignmentId != null) {
      assignment = await prisma.trainerAssignment.findUnique({
        where: { id: Number(assignmentId) },
      });
    } else if (gymId != null) {
      assignment = await prisma.trainerAssignment.findFirst({
        where: {
          trainerProfileId: user.trainerProfile.id,
          gymId: Number(gymId),
        },
      });
    }

    if (!assignment || assignment.trainerProfileId !== user.trainerProfile.id) {
      return res.status(400).json({ error: "Nieprawidłowy assignment lub brak uprawnień" });
    }

    const trainerAssignmentIds = user.trainerProfile.assignments.map((a) => a.id);

    const overlap = await prisma.trainerAvailability.findFirst({
      where: {
        assignmentId: { in: trainerAssignmentIds },
        dayOfWeek,
        startHour: { lt: endMinute },
        endHour: { gt: startMinute },
      },
      include: {
        assignment: {
          include: {
            gym: true,
          },
        },
      },
    });

    if (overlap) {
      const conflictGymName = overlap.assignment?.gym?.name || "innej siłowni";
      return res.status(409).json({
        error: `Kolizja dostępności z istniejącym slotem w ${conflictGymName}`,
      });
    }

    const availability = await prisma.trainerAvailability.create({
      data: {
        assignmentId: assignment.id,
        dayOfWeek,
        startHour: startMinute,
        endHour: endMinute,
      },
    });

    res.json({
      ...availability,
      startHour,
      endHour,
      gym: await prisma.gym.findUnique({ where: { id: assignment.gymId } }),
      assignmentId: assignment.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET assignment availability
router.get("/trainer/:trainerId", requireAuth, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.trainerId);

    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "Nieprawidłowy ID assignment" });
    }

    const availability = await prisma.trainerAvailability.findMany({
      where: { assignmentId },
      include: {
        assignment: {
          include: {
            gym: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
    });

    const result = availability.map((item) => ({
      ...item,
      startHour: item.startHour / 60,
      endHour: item.endHour / 60,
      gym: item.assignment.gym,
    }));

    res.json(result);
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
      include: {
        trainerProfile: true,
      },
    });

    if (!user || user.role !== "TRAINER" || !user.trainerProfile) {
      return res.status(403).json({ error: "Tylko trenerzy mogą usuwać dostępność" });
    }

    const slot = await prisma.trainerAvailability.findUnique({
      where: { id },
      include: {
        assignment: true,
      },
    });

    if (!slot) {
      return res.status(404).json({ error: "Dostępność nie znaleziona" });
    }

    if (slot.assignment.trainerProfileId !== user.trainerProfile.id) {
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
