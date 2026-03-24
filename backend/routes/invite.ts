import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_x';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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

router.post('/trainer/generate', requireAuth, async (req: any, res: any) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            include: { gym: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
        }

        if (user.role !== 'GYM') {
            return res.status(403).json({ error: 'Tylko konto siłowni może tworzyć zaproszenia' });
        }

        if (!user.gymId) {
            return res.status(400).json({ error: 'Konto siłowni nie ma przypisanej siłowni' });
        }

        const expiresInHoursRaw = Number(req.body?.expiresInHours);
        const expiresInHours =
            Number.isFinite(expiresInHoursRaw) && expiresInHoursRaw > 0
                ? expiresInHoursRaw
                : 48;

        const expirationDate = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

        // 64 random bytes => 128 hex chars
        const hash = crypto.randomBytes(64).toString('hex');

        const invite = await prisma.gymInviteTrainer.create({
            data: {
                gymId: user.gymId,
                hash,
                expirationDate,
                alreadyUsed: false,
            },
        });

        const inviteUrl = `${FRONTEND_URL}/trainer-invite/${invite.hash}`;

        return res.status(201).json({
            message: 'Link zaproszenia został utworzony',
            inviteUrl,
            hash: invite.hash,
            expirationDate: invite.expirationDate,
            gymId: invite.gymId,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Nie udało się utworzyć zaproszenia' });
    }
});

router.post('/trainer/use', requireAuth, async (req: any, res: any) => {
    const { hash } = req.body;

    if (!hash || typeof hash !== 'string') {
        return res.status(400).json({ error: 'Brakuje pola hash' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: req.userId },
            });

            if (!user) {
                throw new Error('USER_NOT_FOUND');
            }

            const invite = await tx.gymInviteTrainer.findUnique({
                where: { hash },
            });

            if (!invite) {
                throw new Error('INVITE_NOT_FOUND');
            }

            if (invite.alreadyUsed) {
                throw new Error('INVITE_ALREADY_USED');
            }

            if (invite.expirationDate < new Date()) {
                throw new Error('INVITE_EXPIRED');
            }

            if (user.role === 'GYM') {
                throw new Error('GYM_CANNOT_USE_INVITE');
            }

            const consumeResult = await tx.gymInviteTrainer.updateMany({
                where: {
                    id: invite.id,
                    alreadyUsed: false,
                    expirationDate: {
                        gt: new Date(),
                    },
                },
                data: {
                    alreadyUsed: true,
                },
            });

            if (consumeResult.count === 0) {
                throw new Error('INVITE_ALREADY_CONSUMED');
            }

            const updatedUser = await tx.user.update({
                where: { id: req.userId },
                data: {
                    role: 'TRAINER',
                },
            });

            await tx.trainerAssignment.upsert({
                where: {
                    trainerId_gymId: {
                        trainerId: req.userId,
                        gymId: invite.gymId,
                    },
                },
                update: {},
                create: {
                    trainerId: req.userId,
                    gymId: invite.gymId,
                },
            });

            const gym = await tx.gym.findUnique({
                where: { id: invite.gymId },
            });

            return { updatedUser, gym };
        });

        return res.json({
            message: 'Zaproszenie zostało wykorzystane. Rola zmieniona na TRAINER.',
            userId: result.updatedUser.id,
            role: result.updatedUser.role,
            gymName: result.gym?.name || null,
        });
    } catch (error: any) {
        console.error(error);

        switch (error.message) {
            case 'USER_NOT_FOUND':
                return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
            case 'INVITE_NOT_FOUND':
                return res.status(404).json({ error: 'Nie znaleziono zaproszenia' });
            case 'INVITE_ALREADY_USED':
            case 'INVITE_ALREADY_CONSUMED':
                return res.status(400).json({ error: 'To zaproszenie zostało już wykorzystane' });
            case 'INVITE_EXPIRED':
                return res.status(400).json({ error: 'To zaproszenie wygasło' });
            case 'GYM_CANNOT_USE_INVITE':
                return res.status(403).json({ error: 'Konto siłowni nie może zaakceptować zaproszenia trenera' });
            default:
                return res.status(500).json({ error: 'Nie udało się wykorzystać zaproszenia' });
        }
    }
});

router.get('/trainer/active', requireAuth, async (req: any, res: any) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
        }

        if (user.role !== 'GYM') {
            return res.status(403).json({ error: 'Tylko konto siłowni może przeglądać swoje zaproszenia' });
        }

        if (!user.gymId) {
            return res.status(400).json({ error: 'Brak przypisanej siłowni do konta' });
        }

        const invites = await prisma.gymInviteTrainer.findMany({
            where: {
                gymId: user.gymId,
                alreadyUsed: false,
                expirationDate: {
                    gt: new Date(),
                },
            },
            orderBy: {
                expirationDate: 'asc',
            },
        });

        return res.json(invites);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Nie udało się pobrać aktywnych zaproszeń' });
    }
});

router.get('/trainer/:hash', async (req: any, res: any) => {
    const { hash } = req.params;

    try {
        const invite = await prisma.gymInviteTrainer.findUnique({
            where: { hash },
            include: { gym: true },
        });

        if (!invite) {
            return res.status(404).json({ error: 'Nie znaleziono zaproszenia' });
        }

        if (invite.alreadyUsed) {
            return res.status(400).json({ error: 'To zaproszenie zostało już wykorzystane' });
        }

        if (invite.expirationDate < new Date()) {
            return res.status(400).json({ error: 'To zaproszenie wygasło' });
        }

        return res.json({
            valid: true,
            gymId: invite.gymId,
            gymName: invite.gym?.name || null,
            expirationDate: invite.expirationDate,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Nie udało się sprawdzić zaproszenia' });
    }
});

export default router;
