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

// Get all reviews for a trainer
router.get("/trainer/:trainerId", async (req: any, res: any) => {
  const trainerId = parseInt(req.params.trainerId);

  if (isNaN(trainerId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID trenera" });
  }

  try {
    const reviews = await prisma.trainerReview.findMany({
      where: {
        reservation: {
          assignment: {
            trainerProfileId: trainerId,
          },
        },
      },
      include: {
        reservation: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      opinion: review.opinion,
      createdAt: review.createdAt,
      authorEmail: review.reservation.user.email,
    }));

    res.json(formattedReviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się pobrać recenzji" });
  }
});

// Get average rating for a trainer
router.get("/trainer/:trainerId/rating", async (req: any, res: any) => {
  const trainerId = parseInt(req.params.trainerId);

  if (isNaN(trainerId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID trenera" });
  }

  try {
    const result = await prisma.trainerReview.aggregate({
      where: {
        reservation: {
          assignment: {
            trainerProfileId: trainerId,
          },
        },
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    res.json({
      averageRating: result._avg.rating || 0,
      totalReviews: result._count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się pobrać oceny" });
  }
});

// Add a review
router.post("/", requireAuth, async (req: any, res: any) => {
  const { reservationId, rating, opinion } = req.body;

  if (!reservationId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Nieprawidłowe dane recenzji" });
  }

  try {
    // Check if reservation exists and belongs to user
    const reservation = await prisma.trainerReservation.findFirst({
      where: {
        id: reservationId,
        userId: req.userId,
        status: "DONE",
      },
      include: {
        review: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Rezerwacja nie istnieje lub nie należy do Ciebie" });
    }

    if (reservation.review) {
      return res.status(409).json({ error: "Już dodałeś recenzję dla tej rezerwacji" });
    }

    const review = await prisma.trainerReview.create({
      data: {
        reservationId,
        rating,
        opinion: opinion || null,
      },
    });

    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się dodać recenzji" });
  }
});

// Update a review
router.put("/:reviewId", requireAuth, async (req: any, res: any) => {
  const reviewId = parseInt(req.params.reviewId);
  const { rating, opinion } = req.body;

  if (isNaN(reviewId) || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Nieprawidłowe dane recenzji" });
  }

  try {
    // Check if review exists and belongs to user
    const existingReview = await prisma.trainerReview.findFirst({
      where: {
        id: reviewId,
        reservation: {
          userId: req.userId,
        },
      },
    });

    if (!existingReview) {
      return res.status(404).json({ error: "Recenzja nie istnieje lub nie należy do Ciebie" });
    }

    const updatedReview = await prisma.trainerReview.update({
      where: { id: reviewId },
      data: {
        rating,
        opinion: opinion || null,
      },
    });

    res.json(updatedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się zaktualizować recenzji" });
  }
});

// Delete a review
router.delete("/:reviewId", requireAuth, async (req: any, res: any) => {
  const reviewId = parseInt(req.params.reviewId);

  if (isNaN(reviewId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID recenzji" });
  }

  try {
    // Check if review exists and belongs to user
    const existingReview = await prisma.trainerReview.findFirst({
      where: {
        id: reviewId,
        reservation: {
          userId: req.userId,
        },
      },
    });

    if (!existingReview) {
      return res.status(404).json({ error: "Recenzja nie istnieje lub nie należy do Ciebie" });
    }

    await prisma.trainerReview.delete({
      where: { id: reviewId },
    });

    res.json({ message: "Recenzja została usunięta" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się usunąć recenzji" });
  }
});

export default router;
