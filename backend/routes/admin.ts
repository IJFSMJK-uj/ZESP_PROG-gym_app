import express from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "./auth";

const router = express.Router();

const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Odmowa dostępu. Wymagana rola ADMIN." });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Błąd autoryzacji" });
  }
};

router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        memberProfile: {
          select: {
            firstName: true,
            lastName: true,
            homeGym: {
              select: {
                name: true,
              },
            },
          },
        },
        trainerProfile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd pobierania użytkowników" });
  }
});

router.get("/gyms", requireAuth, requireAdmin, async (req, res) => {
  try {
    const gyms = await prisma.gym.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        _count: {
          select: { members: true, trainerAssignments: true },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json(gyms);
  } catch (error) {
    res.status(500).json({ error: "Błąd pobierania siłowni" });
  }
});

export default router;
