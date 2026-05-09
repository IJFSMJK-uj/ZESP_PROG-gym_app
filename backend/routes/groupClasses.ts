import express, { Request, Response } from "express";
import { Role } from "@prisma/client";
import prisma from "../lib/prisma";
import { requireAuth } from "./auth";

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

    const { instructorIds, ...classData } = parsed.data;

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

    const groupClass = await prisma.groupClass.create({
      data: {
        gymId,
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

      const { instructorIds, ...classData } = parsed.data;

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

      const updatedClass = await prisma.$transaction(async (tx) => {
        await tx.groupClassInstructor.deleteMany({
          where: {
            groupClassId: classId,
          },
        });

        return tx.groupClass.update({
          where: {
            id: classId,
          },
          data: {
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
