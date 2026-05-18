import express from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "./auth";
import { Role } from "@prisma/client";

const router = express.Router();

const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Odmowa dostępu. Wymagana rola ADMIN." });
    }
    next();
  } catch {
    res.status(500).json({ error: "Błąd autoryzacji" });
  }
};

// ─── SIŁOWNIE ────────────────────────────────────────────────────────────────

router.get("/gyms", requireAuth, requireAdmin, async (_req, res: any) => {
  try {
    const gyms = await prisma.gym.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: {
          select: {
            members: true,
            trainerAssignments: true,
          },
        },
      },
    });
    res.json(gyms);
  } catch {
    res.status(500).json({ error: "Nie udało się pobrać siłowni" });
  }
});

router.post("/gyms", requireAuth, requireAdmin, async (req: any, res: any) => {
  const { name, address, lat, lng } = req.body;
  if (!name?.trim() || !address?.trim())
    return res.status(400).json({ error: "Nazwa i adres są wymagane" });

  const latNum = lat !== undefined && lat !== "" ? parseFloat(lat) : null;
  const lngNum = lng !== undefined && lng !== "" ? parseFloat(lng) : null;
  if (latNum !== null && isNaN(latNum))
    return res.status(400).json({ error: "Nieprawidłowa szerokość geograficzna" });
  if (lngNum !== null && isNaN(lngNum))
    return res.status(400).json({ error: "Nieprawidłowa długość geograficzna" });

  try {
    const gym = await prisma.gym.create({
      data: { name: name.trim(), address: address.trim(), lat: latNum, lng: lngNum },
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

router.patch("/gyms/:id", requireAuth, requireAdmin, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

  const { name, address, lat, lng } = req.body;
  if (!name?.trim() || !address?.trim())
    return res.status(400).json({ error: "Nazwa i adres są wymagane" });

  const latNum = lat !== undefined && lat !== "" ? parseFloat(lat) : null;
  const lngNum = lng !== undefined && lng !== "" ? parseFloat(lng) : null;
  if (latNum !== null && isNaN(latNum))
    return res.status(400).json({ error: "Nieprawidłowa szerokość geograficzna" });
  if (lngNum !== null && isNaN(lngNum))
    return res.status(400).json({ error: "Nieprawidłowa długość geograficzna" });

  try {
    const gym = await prisma.gym.update({
      where: { id: gymId },
      data: { name: name.trim(), address: address.trim(), lat: latNum, lng: lngNum },
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

router.delete("/gyms/:id", requireAuth, requireAdmin, async (req: any, res: any) => {
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

// ─── UŻYTKOWNICY ─────────────────────────────────────────────────────────────

router.get("/users", requireAuth, requireAdmin, async (_req, res: any) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        managedGyms: { select: { id: true, name: true } },
        memberProfile: true,
        trainerProfile: {
          include: {
            assignments: {
              include: {
                gym: true,
              },
            },
          },
        },
      },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: "Nie udało się pobrać użytkowników" });
  }
});

router.patch("/users/:id/role", requireAuth, requireAdmin, async (req: any, res: any) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

  const { role } = req.body;
  const allowed: Role[] = [Role.MEMBER, Role.TRAINER, Role.GYM_MANAGER];
  if (!allowed.includes(role)) return res.status(400).json({ error: "Nieprawidłowa rola" });

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    res.json(user);
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    res.status(500).json({ error: "Nie udało się zmienić roli" });
  }
});

router.post(
  "/users/:id/manager-gyms/:gymId",
  requireAuth,
  requireAdmin,
  async (req: any, res: any) => {
    const userId = parseInt(req.params.id);
    const gymId = parseInt(req.params.gymId);
    if (isNaN(userId) || isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

    try {
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) return res.status(404).json({ error: "Nie znaleziono użytkownika" });
      if (targetUser.role !== Role.GYM_MANAGER)
        return res
          .status(400)
          .json({ error: "Tylko użytkownik z rolą Manager może zarządzać siłowniami" });

      await prisma.gym.update({
        where: { id: gymId },
        data: { managers: { connect: { id: userId } } },
      });
      res.json({ message: "Przypisano" });
    } catch (err: any) {
      if (err?.code === "P2025") return res.status(404).json({ error: "Nie znaleziono" });
      res.status(500).json({ error: "Nie udało się przypisać" });
    }
  }
);

router.delete(
  "/users/:id/manager-gyms/:gymId",
  requireAuth,
  requireAdmin,
  async (req: any, res: any) => {
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
  }
);

export default router;
