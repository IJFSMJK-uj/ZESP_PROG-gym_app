import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

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
    return res.status(401).json({ error: "Nieprawidłowy token" });
  }
};

router.get("/gym/:gymId", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.gymId);

  if (isNaN(gymId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });
  }

  try {
    const currentGym = await prisma.gym.findUnique({
      where: { id: gymId },
      select: { name: true, address: true },
    });

    if (!currentGym) {
      return res.result(404).json({ error: "Siłownia nie istnieje" });
    }

    const assignments = await prisma.trainerAssignment.findMany({
      where: { gymId: gymId },
      include: {
        trainerProfile: {
          include: {
            user: {
              select: { id: true, email: true, role: true },
            },
            assignments: {
              include: {
                gym: {
                  select: {
                    name: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const trainers = assignments.map((assignment) => {
      const profile = assignment.trainerProfile;
      const user = profile.user;

      const worksAt = profile.assignments.map((a) => ({
        name: a.gym.name,
        address: a.gym.address,
      }));

      return {
        assignmentId: assignment.id,
        trainerProfileId: profile.id,
        userId: user.id,
        email: user.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        phoneNumber: profile.phoneNumber,
        role: user.role,
        worksAt: worksAt,
      };
    });
    res.json({ gym: currentGym, trainers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się pobrać trenerów dla tej siłowni" });
  }
});

export default router;
