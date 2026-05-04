import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "../lib/mailer";

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

    // token weryfikacyjny
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // add do db
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpiry,
        memberProfile: {
          create: {},
        },
      },
    });

    // wysylanie maila
    await sendVerificationEmail(email, verificationToken);

    res
      .status(201)
      .json({ message: "Konto zostało utworzone! Sprawdź swoją skrzynkę email.", userId: user.id });
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(400).json({ error: "Użytkownik z tym mailem już istnieje." });
    } else {
      console.error("Błąd rejestracji:", error);
      res.status(500).json({ error: "Błąd serwera podczas rejestracji." });
    }
  }
});

// verify email
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Brak tokenu w zapytaniu" });
  }

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user) {
    return res
      .status(400)
      .json({ error: "Link weryfikacyjny jest nieważny lub już został użyty." });
  }

  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    return res.status(400).json({ error: "Token weryfikacyjny wygasł" });
  }

  // update user status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  res.json({ success: true });
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

  if (!user.isEmailVerified) {
    return res
      .status(403)
      .json({ error: "Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email." });
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

    let emailChanged = false;
    let verificationToken = null;
    let verificationTokenExpiry = null;

    if (email && email !== user.email) {
      emailChanged = true;
      verificationToken = crypto.randomBytes(32).toString("hex");
      verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(email && { email }),
        ...(emailChanged && {
          isEmailVerified: false,
          verificationToken,
          verificationTokenExpiry,
        }),
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

    if (emailChanged && verificationToken) {
      await sendVerificationEmail(email, verificationToken);
    }

    res.json({
      email: updatedUser.email,
      username,
      emailChanged,
    });
  } catch (e) {
    res.status(400).json({ error: "Błąd aktualizacji danych" });
  }
});

export default router;
