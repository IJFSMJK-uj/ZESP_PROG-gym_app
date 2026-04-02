import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { Role } from "@prisma/client";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "jwt_x";

export const requireAuth = (req: any, res: any, next: any) => {
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

// register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // add do db
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        memberProfile: {
          create: {},
        },
      },
    });

    res.status(201).json({ message: "Użytkownik stworzony!", userId: user.id });
  } catch (error) {
    res.status(400).json({ error: "Użytkownik z tym mailem już istnieje." });
  }
});

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberProfile: true,
      trainerProfile: true,
    },
  });

  if (!user) {
    return res.status(401).json({ error: "Nieprawidłowy e-mail lub hasło" });
  }

  // check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: "Nieprawidłowy e-mail lub hasło" });
  }

  // generate token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

  res.json({
    message: "Zalogowano pomyślnie",
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      gymId: user.memberProfile?.homeGymId || null,
    },
  });
});

router.get("/profile", requireAuth, async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      memberProfile: {
        include: { homeGym: true },
      },
      trainerProfile: {
        include: {
          assignments: {
            include: { gym: true },
          },
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "Uzytkownik nie znaleziony" });
  }

  let gym = null;
  let username = "";

  if (user.memberProfile) {
    gym = user.memberProfile.homeGym;
    username = user.memberProfile.firstName || "";
  }

  if (user.trainerProfile) {
    if (!gym && user.trainerProfile.assignments.length > 0) {
      gym = user.trainerProfile.assignments[0].gym;
    }
    username = user.trainerProfile.firstName || "";
  }

  res.json({
    email: user.email,
    username,
    role: user.role,
    gym,
  });
});

router.put("/profile", requireAuth, async (req: any, res) => {
  const { email, username } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        trainerProfile: true,
        memberProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Uzytkownik nie znaleziony" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(email && { email }),
      },
    });

    if (username) {
      if (user.memberProfile) {
        await prisma.memberProfile.update({
          where: { id: user.memberProfile.id },
          data: { firstName: username },
        });
      }

      if (user.trainerProfile) {
        await prisma.trainerProfile.update({
          where: { id: user.trainerProfile.id },
          data: { firstName: username },
        });
      }
    }

    res.json({
      email: updatedUser.email,
      username,
    });
  } catch (e) {
    res.status(400).json({ error: "Błąd aktualizacji danych" });
  }
});

export default router;
