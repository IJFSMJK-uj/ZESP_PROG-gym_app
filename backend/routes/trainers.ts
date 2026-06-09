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
  const search = req.query.search ? String(req.query.search).toLowerCase() : "";
  const sortBy = req.query.sortBy || "rating";
  const sortOrder = req.query.sortOrder || "desc";

  if (isNaN(gymId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });
  }

  try {
    const currentGym = await prisma.gym.findUnique({
      where: { id: gymId },
      select: { name: true, address: true },
    });

    if (!currentGym) {
      return res.status(404).json({ error: "Siłownia nie istnieje" });
    }

    const whereClause: any = { gymId: gymId };

    if (search) {
      whereClause.trainerProfile = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { bio: { contains: search, mode: "insensitive" } },
          { socialFacebook: { contains: search, mode: "insensitive" } },
          { socialInstagram: { contains: search, mode: "insensitive" } },
          { socialDiscord: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    let assignments = await prisma.trainerAssignment.findMany({
      where: whereClause,
      include: {
        trainerProfile: {
          include: {
            user: { select: { id: true, email: true, role: true } },
            assignments: {
              include: {
                gym: { select: { name: true, address: true } },
                reservations: { include: { review: true } },
              },
            },
          },
        },
      },
    });

    let trainers = assignments.map((assignment) => {
      const profile = assignment.trainerProfile as any;
      const user = profile.user;

      const worksAt = profile.assignments.map((a: any) => ({
        name: a.gym.name,
        address: a.gym.address,
      }));

      let totalRating = 0;
      let reviewCount = 0;

      profile.assignments.forEach((a: any) => {
        a.reservations.forEach((r: any) => {
          if (r.review) {
            totalRating += r.review.rating;
            reviewCount++;
          }
        });
      });

      const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(3)) : 0;

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
        averageRating: averageRating,
        reviewCount: reviewCount,
        profilePictureUrl: profile.profileImageUrl || "",
        socialFacebook: profile.socialFacebook || "",
        socialInstagram: profile.socialInstagram || "",
        socialDiscord: profile.socialDiscord || "",
        tags: profile.tags || "",
      };
    });

    if (search) {
      trainers = trainers.filter((t) => {
        const tagsString = Array.isArray(t.tags)
          ? t.tags.join(" ").toLowerCase()
          : String(t.tags).toLowerCase();
        return (
          tagsString.includes(search) ||
          String(t.firstName).toLowerCase().includes(search) ||
          String(t.lastName).toLowerCase().includes(search) ||
          String(t.bio).toLowerCase().includes(search) ||
          String(t.socialFacebook).toLowerCase().includes(search) ||
          String(t.socialInstagram).toLowerCase().includes(search) ||
          String(t.socialDiscord).toLowerCase().includes(search)
        );
      });
    }

    trainers.sort((a, b) => {
      if (sortBy === "rating") {
        return sortOrder === "desc"
          ? b.averageRating - a.averageRating
          : a.averageRating - b.averageRating;
      } else if (sortBy === "reviews") {
        return sortOrder === "desc" ? b.reviewCount - a.reviewCount : a.reviewCount - b.reviewCount;
      }
      return 0;
    });

    res.json({ gym: currentGym, trainers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się pobrać trenerów dla tej siłowni" });
  }
});

export default router;
