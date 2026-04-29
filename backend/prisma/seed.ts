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
        isEmailVerified: true,
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
        isEmailVerified: true,
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
        isEmailVerified: true,
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

async function main() {
  console.log("⚙️ Seeding database...");

  // drugi argument bcrypt.hash - 10, musi być taki sam jak w backend/routes/auth w router.post("register")
  const passwordHash = await bcrypt.hash("password", 10);

  await seedManagers(passwordHash);
  const gymMap = await seedGyms();
  await seedTrainers(passwordHash, gymMap);
  await seedMembers(passwordHash, gymMap);

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
