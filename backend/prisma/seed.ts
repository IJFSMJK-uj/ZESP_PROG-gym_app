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
    lat: 50.033215,
    lng: 19.9380322,
    email: "wadowicka@gymapp.pl",
    phoneNumber: "123 456 789",
    description:
      "Gym Central Wadowicka to nowoczesna siłownia w Krakowie o powierzchni 1360 m². Od 2077 roku oferujemy treningi w standardzie premium na Wadowickiej. Do dyspozycji klubowiczów jest bezpłatny parking, wiata na rowery, darmowe Wi-Fi oraz bogata oferta zajęć fitness w cenie karnetu. Na 1360 m² powierzchni znajduje się 10 profesjonalnych stref treningowych, w tym dedykowana strefa kobiet, unikalna strefa Oldschool, przestrzeń cross fitness oraz strefa treningu personalnego. Nowoczesny sprzęt i wsparcie wykwalifikowanej kadry instruktorskiej gwarantują najwyższy komfort ćwiczeń.",
    managerEmails: ["manager@gymapp.pl"],
  },
  {
    name: "Gym Central Norymberska",
    address: "ul. Norymberska 10, Kraków",
    lat: 50.0314314,
    lng: 19.9095811,
    email: "norymberska@gymapp.pl",
    phoneNumber: "987 654 321",
    description:
      "Gym Central Norymberska to jedna z największych i najbardziej spektakularnych siłowni w Krakowie, oferująca aż 4000 m² nowoczesnej powierzchni. W klubie czeka na Ciebie potężna przestrzeń wolnych ciężarów oraz dedykowana strefa ABS & Stretching (100 m²), idealna do pracy nad mobilnością i stabilizacją korpusu. Fani tradycyjnego podejścia docenią klimatyczną sekcję Oldschool. Po intensywnym treningu zapraszamy do regeneracji w saunie. Na miejscu zapewniamy darmowe Wi-Fi oraz duży, bezpłatny parking bezpośrednio przed wejściem.",
    managerEmails: ["manager.krakow@gymapp.pl"],
  },
  {
    name: "Empty Gym Wieliczka",
    address: "ul. Szpitalna 1, Wieliczka",
    lat: 49.9814,
    lng: 20.0544729,
    email: "wieliczka@gymapp.pl",
    phoneNumber: "555 666 777",
    description:
      "Empty Gym Wieliczka to nowoczesna przestrzeń treningowa o powierzchni 1500 m². Klub wyróżnia się otwartą koncepcją wnętrza, która zapewnia pełną swobodę ruchu i doskonały komfort ćwiczeń w każdej z 10 wyspecjalizowanych stref. Wewnątrz czeka na Ciebie przestronna, otwarta strefa wolnych ciężarów. Po treningu zapraszamy do regeneracji w saunie. Zapewniamy darmowe Wi-Fi oraz dostęp do bezpłatnego parkingu.",
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
        email: gymData.email,
        phoneNumber: gymData.phoneNumber,
        description: gymData.description,
        // Łączymy menadżerów po ich emailach
        managers: {
          connect: gymData.managerEmails.map((email) => ({ email })),
        },
      },
    });
    gymMap[gymData.name] = gym.id; // Zapisujemy ID do słownika (np. "Gym Central Kraków": 1)

    // Godziny
    await prisma.gymOperatingHours.deleteMany({
      where: { gymId: gym.id },
    });

    await prisma.gymOperatingHours.createMany({
      data: [
        { gymId: gym.id, dayOfWeek: 1, openTime: 480, closeTime: 1320 },
        { gymId: gym.id, dayOfWeek: 2, openTime: 480, closeTime: 1320 },
        { gymId: gym.id, dayOfWeek: 3, openTime: 480, closeTime: 1320 },
        { gymId: gym.id, dayOfWeek: 4, openTime: 480, closeTime: 1320 },
        { gymId: gym.id, dayOfWeek: 5, openTime: 480, closeTime: 1320 },
        { gymId: gym.id, dayOfWeek: 6, openTime: 480, closeTime: 1320 },
        { gymId: gym.id, dayOfWeek: 7, openTime: 480, closeTime: 1320 },
      ],
    });
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
