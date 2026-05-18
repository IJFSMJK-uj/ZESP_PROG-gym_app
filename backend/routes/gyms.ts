import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "gym-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const equipmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/standard_equip");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "eq-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadEquipment = multer({ storage: equipmentStorage });

router.post("/:id/main-image", requireAuth, upload.single("image"), async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });
  if (!req.file) return res.status(400).json({ error: "Nie przesłano pliku" });

  try {
    const imageUrl = `/uploads/${req.file.filename}`;
    const gym = await prisma.gym.update({
      where: { id: gymId },
      data: { mainImage: imageUrl },
    });
    res.json({ message: "Zdjęcie zaktualizowane", gym });
  } catch (error) {
    res.status(500).json({ error: "Błąd podczas zapisywania zdjęcia" });
  }
});

router.delete("/:id/main-image", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

  try {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (gym?.mainImage) {
      const filePath = path.join(__dirname, "..", gym.mainImage);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.gym.update({
      where: { id: gymId },
      data: { mainImage: null },
    });
    res.json({ message: "Zdjęcie główne zostało usunięte" });
  } catch {
    res.status(500).json({ error: "Błąd podczas usuwania zdjęcia głównego" });
  }
});

router.post(
  "/:id/gallery",
  requireAuth,
  upload.array("gallery", 10),
  async (req: any, res: any) => {
    const gymId = parseInt(req.params.id);
    if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID" });
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: "Nie przesłano plików" });
    }

    try {
      const newImageUrls = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );
      const gym = await prisma.gym.findUnique({ where: { id: gymId } });
      const updatedGallery = [...(gym?.gallery || []), ...newImageUrls];

      const updatedGym = await prisma.gym.update({
        where: { id: gymId },
        data: { gallery: updatedGallery },
      });
      res.json({ message: "Galeria zaktualizowana", gallery: updatedGym.gallery });
    } catch (error) {
      res.status(500).json({ error: "Błąd podczas zapisywania galerii" });
    }
  }
);

router.delete("/:id/gallery", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  const { imageUrl } = req.body;
  if (isNaN(gymId) || !imageUrl) return res.status(400).json({ error: "Nieprawidłowe parametry" });

  try {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) return res.status(404).json({ error: "Nie znaleziono siłowni" });

    const filePath = path.join(__dirname, "..", imageUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const updatedGallery = gym.gallery.filter((url) => url !== imageUrl);
    await prisma.gym.update({
      where: { id: gymId },
      data: { gallery: updatedGallery },
    });

    res.json({ message: "Zdjęcie usunięte z galerii", gallery: updatedGallery });
  } catch {
    res.status(500).json({ error: "Błąd podczas usuwania zdjęcia z galerii" });
  }
});

router.get("/equipment/standard", requireAuth, async (req: any, res: any) => {
  try {
    const standards = await prisma.standardEquipment.findMany({ orderBy: { name: "asc" } });
    res.json(standards);
  } catch (error) {
    res.status(500).json({ error: "Nie udało się pobrać słownika urządzeń" });
  }
});

router.post(
  "/:id/equipment",
  requireAuth,
  uploadEquipment.single("image"),
  async (req: any, res: any) => {
    const gymId = parseInt(req.params.id);
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Nazwa jest wymagana" });

    try {
      const imageUrl = req.file
        ? `/uploads/standard_equip/${req.file.filename}`
        : req.body.imageUrl || null;

      const equipment = await prisma.gymEquipment.create({
        data: { gymId, name, description, imageUrl },
      });
      res.status(201).json(equipment);
    } catch (error) {
      res.status(500).json({ error: "Błąd podczas dodgingu urządzenia" });
    }
  }
);

router.delete("/:id/equipment/:equipmentId", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  const equipmentId = parseInt(req.params.equipmentId);
  if (isNaN(gymId) || isNaN(equipmentId))
    return res.status(400).json({ error: "Nieprawidłowe parametry" });

  try {
    const eq = await prisma.gymEquipment.findFirst({
      where: { id: equipmentId, gymId: gymId },
    });
    if (!eq) return res.status(404).json({ error: "Nie znaleziono urządzenia na tej siłowni" });

    if (eq.imageUrl && eq.imageUrl.includes("/standard_equip/eq-")) {
      const filePath = path.join(__dirname, "..", eq.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.gymEquipment.delete({
      where: { id: equipmentId },
    });

    res.json({ message: "Urządzenie zostało usunięte z siłowni" });
  } catch (error) {
    res.status(500).json({ error: "Błąd podczas usuwania urządzenia ze strefy" });
  }
});

// ─── POZOSTAŁE ENDPOINTY SIŁOWNI ─────────────────────────────────────────────

router.get("/", requireAuth, async (req: any, res: any) => {
  try {
    const gyms = await prisma.gym.findMany({
      include: { operatingHours: true },
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

    if (!user) return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    if (user.role !== Role.GYM_MANAGER) return res.status(403).json({ error: "Brak uprawnień." });
    if (user.managedGyms.length === 0)
      return res.status(400).json({ error: "Konto nie jest powiązane z żadną siłownią" });

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

    if (Object.keys(dataToUpdate).length === 0)
      return res.status(400).json({ error: "Brak danych do aktualizacji" });

    const updatedGym = await prisma.gym.update({
      where: { id: gymId },
      data: dataToUpdate,
      include: { operatingHours: true },
    });

    res.json({ message: "Dane siłowni zaktualizowane pomyślnie", gym: updatedGym });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się zaktualizować danych siłowni" });
  }
});

router.get("/:id/stats", requireAuth, async (req: any, res: any) => {
  try {
    const gymId = Number(req.params.id);
    if (!gymId) return res.status(400).json({ error: "Brak ID siłowni" });

    const now = new Date();
    const reservations = await prisma.trainerReservation.findMany({
      where: { assignment: { gymId: gymId } },
      select: { status: true, date: true },
    });

    let confirmed = 0,
      cancelled = 0,
      done = 0;
    reservations.forEach((r) => {
      if (r.status === "CONFIRMED" && r.date >= now) confirmed++;
      if (r.status === "CANCELLED") cancelled++;
      if (r.status === "DONE") done++;
    });

    const trainers = await prisma.trainerAssignment.findMany({
      where: { gymId: gymId },
      include: {
        trainerProfile: { select: { firstName: true, lastName: true } },
        reservations: { select: { status: true, date: true } },
      },
    });

    const formattedTrainers = trainers.map((t) => {
      let conf = 0,
        canc = 0,
        dn = 0;
      t.reservations.forEach((r) => {
        if (r.status === "CONFIRMED" && r.date >= now) conf++;
        if (r.status === "CANCELLED") canc++;
        if (r.status === "DONE") dn++;
      });

      return {
        id: t.id,
        firstName: t.trainerProfile?.firstName || "",
        lastName: t.trainerProfile?.lastName || "",
        confirmed: conf,
        cancelled: canc,
        done: dn,
      };
    });

    return res.json({ confirmed, cancelled, done, trainers: formattedTrainers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Błąd serwera" });
  }
});

router.get("/:id", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });

  try {
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      include: { operatingHours: true, rooms: { orderBy: { name: "asc" } }, equipment: true },
    });
    if (!gym) return res.status(404).json({ error: "Nie znaleziono siłowni" });
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
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });

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
      if (!isManager) return res.status(403).json({ error: "Nie jesteś managerem." });
    }

    await prisma.memberProfile.upsert({
      where: { userId: req.userId },
      update: { homeGymId: gymId },
      create: { userId: req.userId, homeGymId: gymId },
    });

    res.json({ message: `Wybrano siłownię: ${gym.name}`, gym: gymId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Nie udało się przypisać siłowni" });
  }
});

router.patch("/:id", requireAuth, async (req: any, res: any) => {
  const gymId = parseInt(req.params.id);
  if (isNaN(gymId)) return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { managedGyms: true },
    });

    if (!user || user.role !== Role.GYM_MANAGER)
      return res.status(403).json({ error: "Brak uprawnień" });
    const isManager = user.managedGyms.some((g) => g.id === gymId);
    if (!isManager) return res.status(403).json({ error: "Nie zarządzasz tą siłownią" });

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

    if (Object.keys(dataToUpdate).length === 0)
      return res.status(400).json({ error: "Brak danych do aktualizacji" });

    const updatedGym = await prisma.gym.update({
      where: { id: gymId },
      data: dataToUpdate,
      include: { operatingHours: true },
    });

    res.json({ message: "Zaktualizowano siłownię", gym: updatedGym });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się zaktualizować danych siłowni" });
  }
});

export default router;
