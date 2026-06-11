import express, { Request, Response } from "express";
import { Role } from "@prisma/client";
import prisma from "../lib/prisma";
import { requireAuth } from "./auth";
import { error } from "console";

const router = express.Router();

const MINUTES_IN_DAY = 24 * 60;

interface AuthRequest extends Request {
  userId: number;
}

type ValidateResult =
  | {
      error: string;
    }
  | {
      data: {
        name: string;
        description: string | null;
        dayOfWeek: number;
        startTime: number;
        endTime: number;
        capacity: number | null;
        isActive: boolean;
        instructorIds: number[];
        roomId: number | null;
      };
    };

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const parseId = (value: unknown): number | null => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const ensureRoomBelongsToGym = async (roomId: number, gymId: number): Promise<boolean> => {
  const room = await prisma.gymRoom.findUnique({ where: { id: roomId } });
  return room?.gymId === gymId;
};

const ensureManagerOwnsGym = async (userId: number, gymId: number): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      managedGyms: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user || user.role !== Role.GYM_MANAGER) {
    return false;
  }

  return user.managedGyms.some((gym) => gym.id === gymId);
};

const checkTrainerConflicts = async (
  instructorIds: number[],
  dayOfWeek: number,
  startTime: number,
  endTime: number,
  excludeClassId?: number
): Promise<string | null> => {
  if (instructorIds.length === 0) {
    return null;
  }

  const conflicts = await prisma.groupClassInstructor.findMany({
    where: {
      assignmentId: {
        in: instructorIds,
      },
      groupClass: {
        dayOfWeek,
        AND: [
          {
            startTime: {
              lt: endTime,
            },
          },
          {
            endTime: {
              gt: startTime,
            },
          },
        ],
        ...(excludeClassId
          ? {
              NOT: {
                id: excludeClassId,
              },
            }
          : {}),
      },
    },
    include: {
      assignment: {
        include: {
          trainerProfile: true,
        },
      },
      groupClass: true,
    },
  });

  const reservationConflicts = await prisma.trainerReservation.findMany({
    where: {
      assignmentId: {
        in: instructorIds,
      },

      status: "CONFIRMED",
    },

    include: {
      assignment: {
        include: {
          trainerProfile: true,
        },
      },
    },
  });

  const conflictingReservations = reservationConflicts.filter((reservation) => {
    const reservationDate = new Date(reservation.date);

    const reservationDay = reservationDate.getDay() === 0 ? 7 : reservationDate.getDay();

    return (
      reservationDay === dayOfWeek &&
      reservation.startHour * 60 < endTime &&
      reservation.endHour * 60 > startTime
    );
  });

  if (conflictingReservations.length > 0) {
    const trainerNames = conflictingReservations
      .map((conflict) => {
        const profile = conflict.assignment?.trainerProfile;

        if (!profile) {
          return null;
        }

        return `${profile.firstName} ${profile.lastName}`;
      })
      .filter((name): name is string => Boolean(name))
      .filter((name, index, array) => array.indexOf(name) === index)
      .join(", ");

    return `Trener/Trenerzy: ${trainerNames} mają już trening indywidualny w tym terminie`;
  }

  if (conflicts.length === 0) {
    return null;
  }

  const trainerNames = conflicts
    .map((conflict) => {
      const profile = conflict.assignment?.trainerProfile;

      if (!profile) {
        return null;
      }

      return `${profile.firstName} ${profile.lastName}`;
    })
    .filter((name): name is string => Boolean(name))
    .filter((name, index, array) => array.indexOf(name) === index)
    .join(", ");

  return `Trener(zy): ${trainerNames} mają już zajęcia w tym terminie`;
};

const checkRoomConflicts = async (
  roomId: number,
  dayOfWeek: number,
  startTime: number,
  endTime: number,
  excludeClassId?: number
): Promise<string | null> => {
  const conflict = await prisma.groupClass.findFirst({
    where: {
      roomId,
      dayOfWeek,

      AND: [
        {
          startTime: {
            lt: endTime,
          },
        },
        {
          endTime: {
            gt: startTime,
          },
        },
      ],

      ...(excludeClassId
        ? {
            NOT: {
              id: excludeClassId,
            },
          }
        : {}),
    },
  });

  if (!conflict) {
    return null;
  }

  return "Sala jest już zajęta w tym terminie";
};

const validateClassData = (body: Record<string, unknown>): ValidateResult => {
  const name = typeof body.name === "string" ? body.name.trim() : "";

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  const dayOfWeek = toNumber(body.dayOfWeek);

  const startTime = toNumber(body.startTime);

  const endTime = toNumber(body.endTime);

  const capacity =
    body.capacity === null || body.capacity === undefined || body.capacity === ""
      ? null
      : toNumber(body.capacity);

  const instructorIds = Array.isArray(body.instructorIds)
    ? body.instructorIds.map((id) => toNumber(id)).filter((id): id is number => id !== null)
    : [];

  const roomId =
    body.roomId === null || body.roomId === undefined || body.roomId === ""
      ? null
      : parseId(body.roomId);

  if (!name) {
    return {
      error: "Nazwa zajęć jest wymagana",
    };
  }

  if (dayOfWeek === null || dayOfWeek < 1 || dayOfWeek > 7) {
    return {
      error: "Nieprawidłowy dzień tygodnia",
    };
  }

  if (
    startTime === null ||
    endTime === null ||
    startTime < 0 ||
    endTime > MINUTES_IN_DAY ||
    startTime >= endTime
  ) {
    return {
      error: "Nieprawidłowe godziny zajęć",
    };
  }

  if (capacity !== null && (capacity < 1 || !Number.isInteger(capacity))) {
    return {
      error: "Limit miejsc musi być większy od zera",
    };
  }

  return {
    data: {
      name,
      description,
      dayOfWeek,
      startTime,
      endTime,
      capacity,
      isActive:
        body.isActive === undefined ? true : body.isActive === true || body.isActive === "true",
      instructorIds,
      roomId,
    },
  };
};

router.get("/gyms/:gymId/schedule", requireAuth, async (req: AuthRequest, res: Response) => {
  const gymId = parseId(req.params.gymId);

  if (!gymId) {
    return res.status(400).json({
      error: "Nieprawidłowe ID siłowni",
    });
  }

  try {
    const hasAccess = await ensureManagerOwnsGym(req.userId, gymId);

    if (!hasAccess) {
      return res.status(403).json({
        error: "Brak uprawnień do tej siłowni",
      });
    }

    const classes = await prisma.groupClass.findMany({
      where: {
        gymId,
      },
      include: {
        room: true,
        instructors: {
          include: {
            assignment: {
              include: {
                trainerProfile: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          dayOfWeek: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    });

    return res.json(classes);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Nie udało się pobrać grafiku zajęć",
    });
  }
});

// GET - grafik dla klienta
router.get("/gyms/:gymId/classes", requireAuth, async (req: AuthRequest, res: Response) => {
  const gymId = parseId(req.params.gymId);
  if (!gymId) return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });

  const from = req.query.from ? new Date(req.query.from as string) : new Date();
  const to = req.query.to
    ? new Date(req.query.to as string)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const classes = await prisma.groupClass.findMany({
      where: { gymId, isActive: true },
      include: {
        room: true,
        instructors: {
          include: {
            assignment: {
              include: {
                trainerProfile: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        enrollments: {
          where: {
            date: { gte: from, lte: to },
          },
          select: { userId: true, date: true },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const result = classes.map(({ enrollments, ...cls }) => {
      const jsTarget = cls.dayOfWeek === 7 ? 0 : cls.dayOfWeek;
      const now = new Date();
      const jsDay = now.getDay();
      let daysUntil = (jsTarget - jsDay + 7) % 7;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (daysUntil === 0 && cls.startTime <= currentMinutes) daysUntil = 7;

      const upcomingDate = new Date(now);
      upcomingDate.setDate(now.getDate() + daysUntil);
      upcomingDate.setHours(0, 0, 0, 0);

      const enrollmentsForDate = enrollments.filter((e) => {
        const eDate = new Date(e.date);
        return (
          eDate.getFullYear() === upcomingDate.getFullYear() &&
          eDate.getMonth() === upcomingDate.getMonth() &&
          eDate.getDate() === upcomingDate.getDate()
        );
      });

      const isEnrolled = enrollmentsForDate.some((e) => e.userId === req.userId);

      return {
        ...cls,
        enrolledCount: enrollmentsForDate.length,
        isEnrolled,
      };
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Nie udało się pobrać grafiku" });
  }
});

// POST - zapisz się
router.post(
  "/gyms/:gymId/classes/:classId/enroll",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const gymId = parseId(req.params.gymId);
    const classId = parseId(req.params.classId);
    if (!gymId || !classId) return res.status(400).json({ error: "Nieprawidłowe dane" });

    const memberProfile = await prisma.memberProfile.findUnique({ where: { userId: req.userId } });

    if (!memberProfile || memberProfile.homeGymId !== gymId) {
      return res
        .status(403)
        .json({ error: "Możesz zapisywać się tylko na zajęcia w swojej siłowni" });
    }

    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "Podaj datę zajęć" });

    const enrollDate = new Date(date);
    if (isNaN(enrollDate.getTime())) return res.status(400).json({ error: "Nieprawidłowa data" });

    // sprawdź czy zostało mniej niż 48h
    const hoursUntil = (enrollDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil > 48)
      return res.status(400).json({ error: "Zapisy otwierają się 48h przed zajęciami" });
    if (hoursUntil < 0)
      return res.status(400).json({ error: "Nie można zapisać się na minione zajęcia" });

    try {
      const groupClass = await prisma.groupClass.findFirst({
        where: { id: classId, gymId, isActive: true },
        include: { _count: { select: { enrollments: true } } },
      });

      if (!groupClass) return res.status(404).json({ error: "Nie znaleziono zajęć" });

      if (groupClass.capacity && groupClass._count.enrollments >= groupClass.capacity) {
        return res.status(400).json({ error: "Brak wolnych miejsc" });
      }

      const enrollDay = enrollDate.getDay() === 0 ? 7 : enrollDate.getDay();

      const reservations = await prisma.trainerReservation.findMany({
        where: {
          userId: req.userId,
          status: "CONFIRMED",

          startHour: {
            lt: groupClass.endTime / 60,
          },

          endHour: {
            gt: groupClass.startTime / 60,
          },
        },
      });

      const conflictingReservation = reservations.find((reservation) => {
        const reservationDate = new Date(reservation.date);

        const reservationDay = reservationDate.getDay() === 0 ? 7 : reservationDate.getDay();

        return reservationDay === enrollDay;
      });

      if (conflictingReservation) {
        return res.status(409).json({
          error: "Masz już trening indywidualny w tym terminie",
        });
      }

      await prisma.groupClassEnrollment.create({
        data: { classId, userId: req.userId, date: enrollDate },
      });

      return res.status(201).json({ message: "Zapisano na zajęcia" });
    } catch (error: any) {
      if (error?.code === "P2002") {
        return res.status(400).json({ error: "Jesteś już zapisany na te zajęcia" });
      }
      console.error(error);
      return res.status(500).json({ error: "Nie udało się zapisać na zajęcia" });
    }
  }
);

// DELETE - wypisz się
router.delete(
  "/gyms/:gymId/classes/:classId/enroll",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const gymId = parseId(req.params.gymId);
    const classId = parseId(req.params.classId);
    if (!gymId || !classId) return res.status(400).json({ error: "Nieprawidłowe dane" });

    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "Podaj datę zajęć" });

    try {
      await prisma.groupClassEnrollment.delete({
        where: {
          classId_userId_date: {
            classId,
            userId: req.userId,
            date: new Date(date),
          },
        },
      });
      return res.json({ message: "Wypisano z zajęć" });
    } catch {
      return res.status(404).json({ error: "Nie jesteś zapisany na te zajęcia" });
    }
  }
);

router.get(
  "/gyms/:gymId/schedule/enrollment-counts",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const gymId = parseId(req.params.gymId);
    if (!gymId) return res.status(400).json({ error: "Nieprawidłowe ID siłowni" });

    const dateStr = req.query.date as string;
    const fromDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(fromDate.getTime())) return res.status(400).json({ error: "Nieprawidłowa data" });

    try {
      const hasAccess = await ensureManagerOwnsGym(req.userId, gymId);
      if (!hasAccess) return res.status(403).json({ error: "Brak uprawnień do tej siłowni" });

      const classes = await prisma.groupClass.findMany({
        where: { gymId },
        select: { id: true, dayOfWeek: true },
      });

      const results = await Promise.all(
        classes.map(async (cls) => {
          const jsTarget = cls.dayOfWeek === 7 ? 0 : cls.dayOfWeek;
          const daysUntil = (jsTarget - fromDate.getDay() + 7) % 7;
          const nextDate = new Date(fromDate);
          nextDate.setDate(fromDate.getDate() + daysUntil);
          const nextDayDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);

          const count = await prisma.groupClassEnrollment.count({
            where: { classId: cls.id, date: { gte: nextDate, lt: nextDayDate } },
          });

          return { classId: cls.id, nextDate: nextDate.toISOString(), count };
        })
      );

      return res.json(results);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Nie udało się pobrać liczby uczestników" });
    }
  }
);

router.get(
  "/gyms/:gymId/schedule/:classId/participants",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const gymId = parseId(req.params.gymId);
    const classId = parseId(req.params.classId);

    if (!gymId || !classId) {
      return res.status(400).json({ error: "Nieprawidłowe dane" });
    }

    const dateStr = req.query.date as string;
    if (!dateStr) {
      return res.status(400).json({ error: "Podaj datę zajęć" });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Nieprawidłowa data" });
    }

    try {
      const hasAccess = await ensureManagerOwnsGym(req.userId, gymId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Brak uprawnień do tej siłowni" });
      }

      const groupClass = await prisma.groupClass.findFirst({
        where: { id: classId, gymId },
        include: {
          room: true,
          instructors: {
            include: {
              assignment: {
                include: {
                  trainerProfile: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      });

      if (!groupClass) {
        return res.status(404).json({ error: "Nie znaleziono zajęć" });
      }

      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const enrollments = await prisma.groupClassEnrollment.findMany({
        where: {
          classId,
          date: { gte: date, lt: nextDay },
        },
        include: {
          user: {
            select: {
              email: true,
              memberProfile: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return res.json({
        className: groupClass.name,
        date: date.toISOString(),
        startTime: groupClass.startTime,
        endTime: groupClass.endTime,
        room: groupClass.room,
        capacity: groupClass.capacity,
        instructors: groupClass.instructors.map((i) => ({
          firstName: i.assignment.trainerProfile.firstName,
          lastName: i.assignment.trainerProfile.lastName,
        })),
        participants: enrollments.map((e) => ({
          firstName: e.user.memberProfile?.firstName ?? null,
          lastName: e.user.memberProfile?.lastName ?? null,
          email: e.user.email,
        })),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Nie udało się pobrać uczestników" });
    }
  }
);

router.post("/gyms/:gymId/schedule", requireAuth, async (req: AuthRequest, res: Response) => {
  const gymId = parseId(req.params.gymId);

  if (!gymId) {
    return res.status(400).json({
      error: "Nieprawidłowe ID siłowni",
    });
  }

  try {
    const hasAccess = await ensureManagerOwnsGym(req.userId, gymId);

    if (!hasAccess) {
      return res.status(403).json({
        error: "Brak uprawnień do tej siłowni",
      });
    }

    const parsed = validateClassData(req.body as Record<string, unknown>);

    if ("error" in parsed) {
      return res.status(400).json({
        error: parsed.error,
      });
    }

    const { instructorIds, roomId, ...classData } = parsed.data;

    if (instructorIds.length > 0) {
      const assignments = await prisma.trainerAssignment.findMany({
        where: {
          id: {
            in: instructorIds,
          },
          gymId,
        },
      });

      if (assignments.length !== instructorIds.length) {
        return res.status(400).json({
          error: "Jeden lub więcej trenerów nie należy do tej siłowni",
        });
      }

      const conflictError = await checkTrainerConflicts(
        instructorIds,
        classData.dayOfWeek,
        classData.startTime,
        classData.endTime
      );

      if (conflictError) {
        return res.status(400).json({
          error: conflictError,
        });
      }
    }

    if (roomId !== null) {
      const roomConflict = await checkRoomConflicts(
        roomId,
        classData.dayOfWeek,
        classData.startTime,
        classData.endTime
      );

      if (roomConflict) {
        return res.status(400).json({
          error: roomConflict,
        });
      }
    }

    if (roomId !== null) {
      const roomValid = await ensureRoomBelongsToGym(roomId, gymId);
      if (!roomValid) {
        return res.status(400).json({ error: "Sala nie należy do tej siłowni" });
      }
    }

    const groupClass = await prisma.groupClass.create({
      data: {
        gymId,
        roomId: roomId ?? null,
        ...classData,
        instructors: {
          create: instructorIds.map((assignmentId) => ({
            assignment: {
              connect: {
                id: assignmentId,
              },
            },
          })),
        },
      },
      include: {
        room: true,
        instructors: {
          include: {
            assignment: {
              include: {
                trainerProfile: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.status(201).json(groupClass);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Nie udało się dodać zajęć",
    });
  }
});

router.patch(
  "/gyms/:gymId/schedule/:classId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const gymId = parseId(req.params.gymId);

    const classId = parseId(req.params.classId);

    if (!gymId || !classId) {
      return res.status(400).json({
        error: "Nieprawidłowe dane",
      });
    }

    try {
      const hasAccess = await ensureManagerOwnsGym(req.userId, gymId);

      if (!hasAccess) {
        return res.status(403).json({
          error: "Brak uprawnień do tej siłowni",
        });
      }

      const existing = await prisma.groupClass.findFirst({
        where: {
          id: classId,
          gymId,
        },
      });

      if (!existing) {
        return res.status(404).json({
          error: "Nie znaleziono zajęć",
        });
      }

      const parsed = validateClassData(req.body as Record<string, unknown>);

      if ("error" in parsed) {
        return res.status(400).json({
          error: parsed.error,
        });
      }

      const { instructorIds, roomId, ...classData } = parsed.data;

      if (instructorIds.length > 0) {
        const assignments = await prisma.trainerAssignment.findMany({
          where: {
            id: {
              in: instructorIds,
            },
            gymId,
          },
        });

        if (assignments.length !== instructorIds.length) {
          return res.status(400).json({
            error: "Jeden lub więcej trenerów nie należy do tej siłowni",
          });
        }

        const conflictError = await checkTrainerConflicts(
          instructorIds,
          classData.dayOfWeek,
          classData.startTime,
          classData.endTime,
          classId
        );

        if (conflictError) {
          return res.status(400).json({
            error: conflictError,
          });
        }
      }

      if (roomId !== null) {
        const roomConflict = await checkRoomConflicts(
          roomId,
          classData.dayOfWeek,
          classData.startTime,
          classData.endTime,
          classId
        );

        if (roomConflict) {
          return res.status(400).json({
            error: roomConflict,
          });
        }
      }

      if (roomId !== null) {
        const roomValid = await ensureRoomBelongsToGym(roomId, gymId);
        if (!roomValid) {
          return res.status(400).json({ error: "Sala nie należy do tej siłowni" });
        }
      }

      const updatedClass = await prisma.$transaction(async (tx) => {
        await tx.groupClassInstructor.deleteMany({
          where: {
            classId,
          },
        });

        return tx.groupClass.update({
          where: {
            id: classId,
          },
          data: {
            ...classData,
            roomId: roomId ?? null,
            instructors: {
              create: instructorIds.map((assignmentId) => ({
                assignment: {
                  connect: {
                    id: assignmentId,
                  },
                },
              })),
            },
          },
          include: {
            instructors: {
              include: {
                assignment: {
                  include: {
                    trainerProfile: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            email: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
      });

      return res.json(updatedClass);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Nie udało się zaktualizować zajęć",
      });
    }
  }
);

router.delete(
  "/gyms/:gymId/schedule/:classId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const gymId = parseId(req.params.gymId);

    const classId = parseId(req.params.classId);

    if (!gymId || !classId) {
      return res.status(400).json({
        error: "Nieprawidłowe dane",
      });
    }

    try {
      const hasAccess = await ensureManagerOwnsGym(req.userId, gymId);

      if (!hasAccess) {
        return res.status(403).json({
          error: "Brak uprawnień do tej siłowni",
        });
      }

      const existing = await prisma.groupClass.findFirst({
        where: {
          id: classId,
          gymId,
        },
      });

      if (!existing) {
        return res.status(404).json({
          error: "Nie znaleziono zajęć",
        });
      }

      await prisma.groupClass.delete({
        where: {
          id: classId,
        },
      });

      return res.json({
        message: "Usunięto zajęcia z grafiku",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Nie udało się usunąć zajęć",
      });
    }
  }
);

export default router;
