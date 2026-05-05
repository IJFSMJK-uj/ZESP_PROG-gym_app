import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { Role } from "@prisma/client";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "jwt_x";

const requireAdmin = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Brak tokenu" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.role !== Role.ADMIN) {
      return res.status(403).json({ error: "Brak uprawnień administratora" });
    }
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Nieprawidłowy token" });
  }
};

// GET /api/admin/gyms - lista wszystkich siłowni
router.get("/gyms", requireAdmin, async (_req: any, res: any) => {
  try {
    const gyms = await prisma.gym.findMany({
      orderBy: { id: "asc" },
    });
    res.json(gyms);
  } catch {
    res.status(500).json({ error: "Nie udało się pobrać siłowni" });
  }
});

// POST /api/admin/gyms - dodaj nową siłownię
router.post("/gyms", requireAdmin, async (req: any, res: any) => {
  const { name, address } = req.body;

  if (!name?.trim() || !address?.trim()) {
    return res.status(400).json({ error: "Nazwa i adres są wymagane" });
  }

  try {
    const gym = await prisma.gym.create({
      data: { name: name.trim(), address: address.trim() },
    });
    res.status(201).json(gym);
  } catch (err: any) {
    if (err?.code === "P2002") {
      const field = err.meta?.target?.includes("name") ? "nazwa" : "adres";
      return res.status(409).json({ error: `Siłownia z tą ${field} już istnieje` });
    }
    res.status(500).json({ error: "Nie udało się dodać siłowni" });
  }
});

// PUT /api/admin/gyms/:id - edytuj siłownię
router.put("/gyms/:id", requireAdmin, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

  const { name, address } = req.body;
  if (!name?.trim() || !address?.trim()) {
    return res.status(400).json({ error: "Nazwa i adres są wymagane" });
  }

  try {
    const gym = await prisma.gym.update({
      where: { id: gymId },
      data: { name: name.trim(), address: address.trim() },
    });
    res.json(gym);
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Nie znaleziono siłowni" });
    if (err?.code === "P2002") {
      const field = err.meta?.target?.includes("name") ? "nazwa" : "adres";
      return res.status(409).json({ error: `Siłownia z tą ${field} już istnieje` });
    }
    res.status(500).json({ error: "Nie udało się zaktualizować siłowni" });
  }
});

// DELETE /api/admin/gyms/:id - usuń siłownię
router.delete("/gyms/:id", requireAdmin, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

  try {
    await prisma.gym.delete({ where: { id: gymId } });
    res.json({ message: "Siłownia usunięta" });
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Nie znaleziono siłowni" });
    res.status(500).json({ error: "Nie udało się usunąć siłowni" });
  }
});

// GET /api/admin/users - lista użytkowników z rolami i siłowniami
router.get("/users", requireAdmin, async (_req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        managedGyms: { select: { id: true, name: true } },
      },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: "Nie udało się pobrać użytkowników" });
  }
});

// PATCH /api/admin/users/:id/role - zmień rolę użytkownika
router.patch("/users/:id/role", requireAdmin, async (req: any, res: any) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

  const { role } = req.body;
  const allowed = ["MEMBER", "TRAINER", "GYM_MANAGER", "ADMIN"];
  if (!allowed.includes(role)) return res.status(400).json({ error: "Nieprawidłowa rola" });

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
      select: { id: true, email: true, role: true },
    });
    res.json(user);
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    res.status(500).json({ error: "Nie udało się zmienić roli" });
  }
});

// POST /api/admin/users/:id/manager-gyms/:gymId - przypisz jako manager siłowni
router.post("/users/:id/manager-gyms/:gymId", requireAdmin, async (req: any, res: any) => {
  const userId = parseInt(req.params.id);
  const gymId = parseInt(req.params.gymId);
  if (isNaN(userId) || isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

  try {
    await prisma.gym.update({
      where: { id: gymId },
      data: { managers: { connect: { id: userId } } },
    });
    res.json({ message: "Przypisano" });
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Nie znaleziono" });
    res.status(500).json({ error: "Nie udało się przypisać" });
  }
});

// DELETE /api/admin/users/:id/manager-gyms/:gymId - odepnij od siłowni
router.delete("/users/:id/manager-gyms/:gymId", requireAdmin, async (req: any, res: any) => {
  const userId = parseInt(req.params.id);
  const gymId = parseInt(req.params.gymId);
  if (isNaN(userId) || isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

  try {
    await prisma.gym.update({
      where: { id: gymId },
      data: { managers: { disconnect: { id: userId } } },
    });
    res.json({ message: "Odepnięto" });
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Nie znaleziono" });
    res.status(500).json({ error: "Nie udało się odpiąć" });
  }
});

export default router;
