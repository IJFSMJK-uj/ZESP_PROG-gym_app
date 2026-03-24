import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_x';

const requireAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Brak tokenu' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Nieprawidlowy token' });
  }
};

// Pobieramy wszystkie siłownie - GET /gyms
router.get("/", requireAuth, async (req: any, res : any) => {
    try{
        const gyms = await prisma.gym.findMany();
        res.json(gyms);
    } catch (error) {   
        console.error(error);
        res.status(500).json({error: "Nie udało się pobrać siłowni"});
    }
});

// Pobieramy jedną siłownie po ID - GET /gyms/:id
router.get("/:id", requireAuth, async (req: any, res : any) => {
    const gymId = parseInt(req.params.id);
    if (isNaN(gymId)) {
        return res.status(400).json({error: "Nieprawidłowe ID siłowni"});
    }

    try {
        const gym = await prisma.gym.findUnique({
            where: {id: gymId},
        });
        
        if (!gym) {
            return res.status(404).json({error: "Nie znaleziono siłowni"})
        } 

        res.json(gym);
    } catch(error) {
        console.error(error);
        res.status(500).json({error: "Nie znaleziono siłowni"});
    }

});


router.put("/:id", requireAuth, async (req: any, res : any) => {
  const gymId = parseInt(req.params.id);
  console.log("req.userId:", req.userId, "gymId:", gymId);

  if (isNaN(gymId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });
  }

  try {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) return res.status(404).json({ error: "Nie znaleziono siłowni ale checa" });

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { gymId },
    });

    res.json({ message: `Wybrano siłownię: ${gym.name}`, gym: updatedUser.gymId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Nie udało się przypisać siłowni" });
  }

});


export default router;