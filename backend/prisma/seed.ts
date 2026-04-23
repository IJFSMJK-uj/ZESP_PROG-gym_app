import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// --- DANE ---
const MANAGERS_DATA = [
  { email: "manager@gymapp.pl" },
  { email: "manager.krakow@gymapp.pl" },
  { email: "manager.wieliczka@gymapp.pl" },
];

const GYMS_DATA = [
  {
    name: "Gym Central Wadowicka",
    address: "ul. Wadowicka 6, Kraków",
    lat: 50.038,
    lng: 19.9499,
    managerEmails: ["manager.krakow@gymapp.pl"],
  },
  {
    name: "Gym Central Norymberska",
    address: "ul. Norymberska 10, Kraków",
    lat: 50.0647,
    lng: 19.945,
    managerEmails: ["manager.krakow@gymapp.pl"],
  },
  {
    name: "Empty Gym Wieliczka",
    address: "ul. Szpitalna 1, Wieliczka",
    lat: 49.9884,
    lng: 20.0652,
    managerEmails: ["manager.wieliczka@gymapp.pl"], // Siłownia bez trenerów
  },
];

const TRAINERS_DATA = [
  {
    email: "trener.jan@gymapp.pl",
    firstName: "Jan",
    lastName: "Kowalski",
    bio: "Specjalista od trójboju siłowego. Pomogę Ci dźwigać więcej!",
    phoneNumber: "+48 111 222 333",
    worksAt: ["Gym Central Wadowicka", "Gym Central Norymberska"], // Pracuje w dwóch!
  },
  {
    email: "trener.anna@gymapp.pl",
    firstName: "Anna",
    lastName: "Nowak",
    bio: "Trenerka fitness i dietetyk. Skupiamy się na mobilności.",
    phoneNumber: "+48 444 555 666",
    worksAt: ["Gym Central Norymberska"], // Tylko jedna siłownia
  },
  {
    email: "trener.pawel@gymapp.pl",
    firstName: "Paweł",
    lastName: "Ezoteryczny",
    bio: "Kalistenika, ezoteryka, permakultura i trening funkcjonalny to moja pasja. Posiadam 2137 lat doświadczenia i jaszczurkę. Namaste.",
    phoneNumber: "+48 420 420 420",
    worksAt: ["Gym Central Wadowicka"], // Tylko jedna siłownia
  },
];

const MEMBERS_DATA = [
  {
    email: "klient.adam@gymapp.pl",
    firstName: "Adam",
    lastName: "Małysz",
    homeGymName: "Gym Central Wadowicka",
  },
  {
    email: "klient.jan@gymapp.pl",
    firstName: "Jan",
    lastName: "Adamczewski",
    homeGymName: "Gym Central Wadowicka",
  },
  {
    email: "klient.robert@gymapp.pl",
    firstName: "Robert",
    lastName: "Kubica",
    homeGymName: "Gym Central Norymberska",
  },
  {
    email: "klient.iga@gymapp.pl",
    firstName: "Iga",
    lastName: "Świątek",
    homeGymName: "Empty Gym Wieliczka",
  },
  { email: "klient.kamil@gymapp.pl", firstName: "Kamil", lastName: "Stoch" }, // Zwykły user, bez wybranej siłowni
];

async function seedManagers(passwordHash: string) {
  console.log("⚙️ Creating managers...");
  for (const manager of MANAGERS_DATA) {
    await prisma.user.upsert({
      where: { email: manager.email },
      update: {},
      create: {
        email: manager.email,
        password: passwordHash,
        role: Role.GYM_MANAGER,
      },
    });
  }
}

async function seedGyms(): Promise<Record<string, number>> {
  console.log("⚙️ Creating gyms...");
  const gymMap: Record<string, number> = {};

  for (const gymData of GYMS_DATA) {
    const gym = await prisma.gym.upsert({
      where: { name: gymData.name },
      update: { address: gymData.address },
      create: {
        name: gymData.name,
        address: gymData.address,
        lat: gymData.lat,
        lng: gymData.lng,
        // Łączymy menadżerów po ich emailach
        managers: {
          connect: gymData.managerEmails.map((email) => ({ email })),
        },
      },
    });
    gymMap[gymData.name] = gym.id; // Zapisujemy ID do słownika (np. "Gym Central Kraków": 1)
  }
  return gymMap;
}

async function seedTrainers(passwordHash: string, gymMap: Record<string, number>) {
  console.log("⚙️ Creating trainers & schedules...");
  for (const trainerData of TRAINERS_DATA) {
    // Tworzymy Usera i TrainerProfile
    const user = await prisma.user.upsert({
      where: { email: trainerData.email },
      update: {},
      create: {
        email: trainerData.email,
        password: passwordHash,
        role: Role.TRAINER,
        trainerProfile: {
          create: {
            firstName: trainerData.firstName,
            lastName: trainerData.lastName,
            bio: trainerData.bio,
            phoneNumber: trainerData.phoneNumber,
          },
        },
      },
      include: { trainerProfile: true },
    });

    const profileId = user.trainerProfile?.id;

    if (profileId) {
      // Tworzymy Zatrudnienie (TrainerAssignment) w każdej siłowni z tablicy worksAt
      for (const gymName of trainerData.worksAt) {
        const gymId = gymMap[gymName];
        if (!gymId) continue;

        const assignment = await prisma.trainerAssignment.upsert({
          where: {
            trainerProfileId_gymId: {
              trainerProfileId: profileId,
              gymId: gymId,
            },
          },
          update: {},
          create: {
            trainerProfileId: profileId,
            gymId: gymId,
          },
        });

        // Dodajemy standardowy grafik (czyścimy stary, żeby zapobiec duplikatom przy ponownym seedzie)
        await prisma.trainerAvailability.deleteMany({
          where: { assignmentId: assignment.id },
        });

        // Tworzymy grafik (poniedziałek i środa, 08:00 - 16:00)
        await prisma.trainerAvailability.createMany({
          data: [
            { assignmentId: assignment.id, dayOfWeek: 1, startHour: 480, endHour: 960 },
            { assignmentId: assignment.id, dayOfWeek: 3, startHour: 480, endHour: 960 },
          ],
        });
      }
    }
  }
}

async function seedMembers(passwordHash: string, gymMap: Record<string, number>) {
  console.log("⚙️ Creating members...");
  for (const memberData of MEMBERS_DATA) {
    const homeGymId = memberData.homeGymName ? gymMap[memberData.homeGymName] : null;

    await prisma.user.upsert({
      where: { email: memberData.email },
      update: {},
      create: {
        email: memberData.email,
        password: passwordHash,
        role: Role.MEMBER,
        memberProfile: {
          create: {
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            ...(homeGymId && { homeGymId }), // Dodajemy homeGymId tylko, jeśli jest zdefiniowane
          },
        },
      },
    });
  }
}

async function seedReservations(gymMap: Record<string, number>) {
  console.log("⚙️ Creating training reservations...");

  // Get trainers and members
  const trainers = await prisma.trainerAssignment.findMany({
    where: {
      gym: {
        name: "Gym Central Wadowicka",
      },
    },
    include: {
      trainerProfile: {
        include: {
          user: true,
        },
      },
    },
  });

  const members = await prisma.memberProfile.findMany({
    where: {
      homeGymId: gymMap["Gym Central Wadowicka"],
    },
    include: {
      user: true,
    },
  });

  if (trainers.length === 0 || members.length === 0) return;

  // Clear old reservations
  await prisma.trainerReservation.deleteMany({});

  // Create 3 reservations with DONE status
  const now = new Date();
  const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  const reservationsToCreate = [
    {
      userId: members[0].user.id,
      assignmentId: trainers[0].id,
      date: pastDate,
      startHour: 10,
      endHour: 11,
      status: "DONE" as const,
    },
    {
      userId: members[1]?.user.id || members[0].user.id,
      assignmentId: trainers[0].id,
      date: pastDate,
      startHour: 11,
      endHour: 12,
      status: "DONE" as const,
    },
    {
      userId: members[0].user.id,
      assignmentId: trainers.length > 1 ? trainers[1].id : trainers[0].id,
      date: pastDate,
      startHour: 12,
      endHour: 13,
      status: "DONE" as const,
    },
  ];

  for (const res of reservationsToCreate) {
    await prisma.trainerReservation.create({
      data: res,
    });
  }
}

async function seedReviews() {
  console.log("⚙️ Creating trainer reviews...");

  // Get done reservations
  const reservations = await prisma.trainerReservation.findMany({
    where: { status: "DONE" },
    include: {
      assignment: {
        include: {
          trainerProfile: true,
        },
      },
      user: true,
    },
  });

  if (reservations.length === 0) return;

  // Clear old reviews
  await prisma.trainerReview.deleteMany({});

  // Create example reviews for first 3 reservations
  const reviewsToCreate = reservations.slice(0, 3).map((res, idx) => ({
    reservationId: res.id,
    rating: [5, 4, 5][idx],
    opinion: ["Wspaniały trening!", "Dobrze przeprowadzony trening.", "Najlepszy trener!"][idx],
  }));

  for (const review of reviewsToCreate) {
    await prisma.trainerReview.create({
      data: review,
    });
  }
}

async function main() {
  console.log("⚙️ Seeding database...");

  // drugi argument bcrypt.hash - 10, musi być taki sam jak w backend/routes/auth w router.post("register")
  const passwordHash = await bcrypt.hash("password", 10);

  await seedManagers(passwordHash);
  const gymMap = await seedGyms();
  await seedTrainers(passwordHash, gymMap);
  await seedMembers(passwordHash, gymMap);
  await seedReservations(gymMap);
  await seedReviews();

  console.log("✅ Finished seeding database.");
  console.log('Default password for all accounts is: "password"');
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
