import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "jwt_x";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

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

router.get("/gym/:gymId", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.gymId);

  if (isNaN(gymId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });
  }

  try {
    const assignments = await prisma.trainerAssignment.findMany({
      where: { gymId: gymId },
      include: {
        trainer: {
          select: { id: true, email: true, username: true, role: true },
        },
      },
    });

    const trainers = assignments.map((assignment) => assignment.trainer);
    res.json(trainers);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Nie udało się pobrać trenerów dla tej siłowni" });
  }
});

export default router;
