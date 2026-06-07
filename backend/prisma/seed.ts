import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// --- DANE ---
const ADMIN_DATA = [{ email: "admin@gymapp.pl" }];

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
    mainImage: "/uploads/wadowicka-main.webp",
    gallery: ["/uploads/wadowicka-gal1.jpg"],
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
    mainImage: "/uploads/norymberska-main.jpg",
    gallery: [
      "/uploads/norymberska-gal1.webp",
      "/uploads/norymberska-gal2.jpg",
      "/uploads/norymberska-gal3.webp",
    ],
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
    managerEmails: ["manager@gymapp.pl"],
    mainImage: "/uploads/wieliczka-main.webp",
    gallery: [
      "/uploads/wieliczka-gal1.jpg",
      "/uploads/wieliczka-gal2.jpg",
      "/uploads/wieliczka-gal3.jpg",
    ],
  },
];

async function seedGyms(): Promise<Record<string, number>> {
  console.log("⚙️ Creating gyms and seeding equipment...");
  const gymMap: Record<string, number> = {};

  const standardMachines = await prisma.standardEquipment.findMany();

  for (const gymData of GYMS_DATA) {
    const gym = await prisma.gym.upsert({
      where: { name: gymData.name },
      update: {
        address: gymData.address,
        lat: gymData.lat,
        lng: gymData.lng,
        description: gymData.description,
        phoneNumber: gymData.phoneNumber,
        email: gymData.email,
      },
      create: {
        name: gymData.name,
        address: gymData.address,
        lat: gymData.lat,
        lng: gymData.lng,
        email: gymData.email,
        phoneNumber: gymData.phoneNumber,
        description: gymData.description,
        mainImage: gymData.mainImage,
        gallery: gymData.gallery,
        managers: {
          connect: gymData.managerEmails.map((email) => ({ email })),
        },
      },
    });
    gymMap[gymData.name] = gym.id;

    await prisma.gymEquipment.deleteMany({
      where: { gymId: gym.id },
    });

    const equipmentToCreate = standardMachines.slice(0, 5).map((machine) => ({
      gymId: gym.id,
      name: machine.name,
      imageUrl: machine.imageUrl,
    }));

    if (equipmentToCreate.length > 0) {
      await prisma.gymEquipment.createMany({
        data: equipmentToCreate,
      });
    }

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

const TRAINERS_DATA = [
  {
    email: "trener.jan@gymapp.pl",
    firstName: "Jan",
    lastName: "Kowalski",
    bio: "Specjalista od trójboju siłowego. Pomogę Ci dźwigać więcej!",
    phoneNumber: "+48 111 222 333",
    worksAt: ["Gym Central Wadowicka", "Gym Central Norymberska"], // Pracuje w dwóch!
    profileImageUrl: "/uploads/profiles/profile-1779718925481-899452181.jpeg",
    socialFacebook: "https://www.facebook.com/jan.kowalski",
    socialInstagram: "https://www.instagram.com/jan.kowalski",
    socialDiscord: "JanKowalski#1234",
    tags: ["trójbój siłowy", "siła", "powerlifting"],
  },
  {
    email: "trener.anna@gymapp.pl",
    firstName: "Anna",
    lastName: "Nowak",
    bio: "Trenerka fitness i dietetyk. Skupiamy się na mobilności.",
    phoneNumber: "+48 444 555 666",
    worksAt: ["Gym Central Norymberska"], // Tylko jedna siłownia
    profileImageUrl: "/uploads/profiles/profile-1779718860088-265273304.jpeg",
    socialFacebook: "https://www.facebook.com/anna.nowak",
    socialInstagram: "https://www.instagram.com/anna.nowak",
    socialDiscord: "AnnaNowak#1234",
    tags: ["fitness", "dietetyka", "mobilność"],
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

async function seedAdmins(passwordHash: string) {
  console.log("⚙️ Creating admins...");
  for (const admin of ADMIN_DATA) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        password: passwordHash,
        role: Role.ADMIN,
        isEmailVerified: true,
      },
    });
  }
}

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

async function seedTrainers(passwordHash: string, gymMap: Record<string, number>) {
  console.log("⚙️ Creating trainers & schedules...");
  for (const trainerData of TRAINERS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: trainerData.email },
      update: {
        trainerProfile: {
          update: {
            firstName: trainerData.firstName,
            lastName: trainerData.lastName,
            bio: trainerData.bio,
            phoneNumber: trainerData.phoneNumber,
            profileImageUrl: trainerData.profileImageUrl,
            socialFacebook: trainerData.socialFacebook,
            socialInstagram: trainerData.socialInstagram,
            socialDiscord: trainerData.socialDiscord,
            tags: trainerData.tags,
          },
        },
      },
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
            profileImageUrl: trainerData.profileImageUrl,
            socialFacebook: trainerData.socialFacebook,
            socialInstagram: trainerData.socialInstagram,
            socialDiscord: trainerData.socialDiscord,
            tags: trainerData.tags,
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

const ROOMS_DATA: Record<string, { name: string; capacity: number | null }[]> = {
  "Gym Central Wadowicka": [
    { name: "Sala fitness", capacity: 20 },
    { name: "Sala crossfit", capacity: 12 },
    { name: "Sala kardio", capacity: 15 },
  ],
  "Gym Central Norymberska": [
    { name: "Sala A", capacity: 25 },
    { name: "Sala B", capacity: 20 },
    { name: "Sala spinningowa", capacity: 18 },
  ],
  "Empty Gym Wieliczka": [
    { name: "Sala główna", capacity: 30 },
    { name: "Sala jogi", capacity: 15 },
  ],
};

async function seedRooms(
  gymMap: Record<string, number>
): Promise<Record<string, Record<string, number>>> {
  console.log("⚙️ Creating gym rooms...");
  // roomMap["Gym Central Wadowicka"]["Sala fitness"] = roomId
  const roomMap: Record<string, Record<string, number>> = {};

  for (const [gymName, rooms] of Object.entries(ROOMS_DATA)) {
    const gymId = gymMap[gymName];
    if (!gymId) continue;

    await prisma.gymRoom.deleteMany({ where: { gymId } });

    roomMap[gymName] = {};
    for (const room of rooms) {
      const created = await prisma.gymRoom.create({
        data: { gymId, name: room.name, capacity: room.capacity },
      });
      roomMap[gymName][room.name] = created.id;
    }
  }
  return roomMap;
}

async function seedGroupClasses(
  gymMap: Record<string, number>,
  roomMap: Record<string, Record<string, number>>
) {
  console.log("⚙️ Creating group classes...");

  await prisma.groupClassInstructor.deleteMany({});
  await prisma.groupClass.deleteMany({});

  // Pobierz TrainerAssignment dla każdej siłowni
  const getAssignment = async (trainerEmail: string, gymName: string) => {
    const gymId = gymMap[gymName];
    const user = await prisma.user.findUnique({
      where: { email: trainerEmail },
      include: { trainerProfile: { include: { assignments: true } } },
    });
    return user?.trainerProfile?.assignments.find((a) => a.gymId === gymId) ?? null;
  };

  // ── Gym Central Wadowicka ──
  const wadId = gymMap["Gym Central Wadowicka"];
  const wadRooms = roomMap["Gym Central Wadowicka"] ?? {};
  const janWad = await getAssignment("trener.jan@gymapp.pl", "Gym Central Wadowicka");
  const pawelWad = await getAssignment("trener.pawel@gymapp.pl", "Gym Central Wadowicka");

  const wadClasses = [
    {
      gymId: wadId,
      roomId: wadRooms["Sala fitness"] ?? null,
      name: "Power Fitness",
      description: "Intensywny trening siłowy dla każdego poziomu.",
      dayOfWeek: 1,
      startTime: 8 * 60,
      endTime: 9 * 60,
      capacity: 20,
      isActive: true,
      instructorAssignmentIds: janWad ? [janWad.id] : [],
    },
    {
      gymId: wadId,
      roomId: wadRooms["Sala crossfit"] ?? null,
      name: "CrossFit",
      description: "Trening funkcjonalny o wysokiej intensywności.",
      dayOfWeek: 2,
      startTime: 9 * 60,
      endTime: 10 * 60,
      capacity: 12,
      isActive: true,
      instructorAssignmentIds: pawelWad ? [pawelWad.id] : [],
    },
    {
      gymId: wadId,
      roomId: wadRooms["Sala fitness"] ?? null,
      name: "Stretching & Mobility",
      description: "Rozciąganie i poprawa mobilności.",
      dayOfWeek: 3,
      startTime: 18 * 60,
      endTime: 19 * 60,
      capacity: 20,
      isActive: true,
      instructorAssignmentIds: pawelWad ? [pawelWad.id] : [],
    },
    {
      gymId: wadId,
      roomId: wadRooms["Sala kardio"] ?? null,
      name: "Cardio Blast",
      description: "Spalanie kalorii w rytmie muzyki.",
      dayOfWeek: 5,
      startTime: 17 * 60,
      endTime: 18 * 60,
      capacity: 15,
      isActive: true,
      instructorAssignmentIds: [],
    },
  ];

  // ── Gym Central Norymberska ──
  const norId = gymMap["Gym Central Norymberska"];
  const norRooms = roomMap["Gym Central Norymberska"] ?? {};
  const janNor = await getAssignment("trener.jan@gymapp.pl", "Gym Central Norymberska");
  const annaNor = await getAssignment("trener.anna@gymapp.pl", "Gym Central Norymberska");

  const norClasses = [
    {
      gymId: norId,
      roomId: norRooms["Sala A"] ?? null,
      name: "Joga dla początkujących",
      description: "Łagodna joga dla osób zaczynających przygodę z treningiem.",
      dayOfWeek: 2,
      startTime: 8 * 60,
      endTime: 9 * 60,
      capacity: 25,
      isActive: true,
      instructorAssignmentIds: annaNor ? [annaNor.id] : [],
    },
    {
      gymId: norId,
      roomId: norRooms["Sala spinningowa"] ?? null,
      name: "Spinning",
      description: "Dynamiczny trening rowerowy.",
      dayOfWeek: 4,
      startTime: 7 * 60,
      endTime: 8 * 60,
      capacity: 18,
      isActive: true,
      instructorAssignmentIds: janNor ? [janNor.id] : [],
    },
    {
      gymId: norId,
      roomId: norRooms["Sala B"] ?? null,
      name: "Body Pump",
      description: "Trening z obciążeniami przy muzyce.",
      dayOfWeek: 6,
      startTime: 10 * 60,
      endTime: 11 * 60,
      capacity: 20,
      isActive: true,
      instructorAssignmentIds: annaNor ? [annaNor.id] : [],
    },
  ];

  // ── Empty Gym Wieliczka ──
  const wielId = gymMap["Empty Gym Wieliczka"];
  const wielRooms = roomMap["Empty Gym Wieliczka"] ?? {};

  const wielClasses = [
    {
      gymId: wielId,
      roomId: wielRooms["Sala jogi"] ?? null,
      name: "Hatha Joga",
      description: "Klasyczna joga łącząca asany z oddechem.",
      dayOfWeek: 3,
      startTime: 9 * 60,
      endTime: 10 * 60,
      capacity: 15,
      isActive: true,
      instructorAssignmentIds: [],
    },
    {
      gymId: wielId,
      roomId: wielRooms["Sala główna"] ?? null,
      name: "Zumba",
      description: "Taneczny trening cardio w latynoskim rytmie.",
      dayOfWeek: 5,
      startTime: 18 * 60,
      endTime: 19 * 60,
      capacity: 30,
      isActive: true,
      instructorAssignmentIds: [],
    },
  ];

  for (const cls of [...wadClasses, ...norClasses, ...wielClasses]) {
    const { instructorAssignmentIds, ...classData } = cls;
    await prisma.groupClass.create({
      data: {
        ...classData,
        instructors: {
          create: instructorAssignmentIds.map((assignmentId) => ({
            assignment: { connect: { id: assignmentId } },
          })),
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

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const reservationsToCreate = [
    {
      userId: members[0].user.id,
      assignmentId: trainers[0].id,
      date: pastDate,
      startHour: 10,
      endHour: 11,
      status: "DONE" as const,
      reviewPromptSent: true,
    },
    {
      userId: members[1]?.user.id || members[0].user.id,
      assignmentId: trainers[0].id,
      date: pastDate,
      startHour: 11,
      endHour: 12,
      status: "DONE" as const,
      reviewPromptSent: true,
    },
    {
      userId: members[0].user.id,
      assignmentId: trainers.length > 1 ? trainers[1].id : trainers[0].id,
      date: pastDate,
      startHour: 12,
      endHour: 13,
      status: "DONE" as const,
      reviewPromptSent: true,
    },
    {
      userId: members[0].user.id, // klient.adam@gymapp.pl
      assignmentId: trainers[0].id,
      date: tomorrow,
      startHour: now.getHours() - 2,
      endHour: now.getHours() - 1,
      status: "CONFIRMED" as const,
      reminderSent: false,
    },
    {
      userId: members[0].user.id, // klient.adam@gymapp.pl
      assignmentId: trainers[0].id,
      date: pastDate,
      startHour: 20,
      endHour: 21,
      status: "DONE" as const,
      reviewPromptSent: false,
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

async function seedStandardEquipment() {
  console.log("⚙️ Creating standard gym equipment...");

  const standardMachines = [
    { name: "Sztanga olimpijska", imageUrl: "/uploads/standard_equip/barbells.webp" },
    {
      name: "Liny treningowe (Battle Ropes)",
      imageUrl: "/uploads/standard_equip/battle-ropes.webp",
    },
    {
      name: "Brama krzyżowa (Cable Crossover)",
      imageUrl: "/uploads/standard_equip/cable-crossover.webp",
    },
    { name: "Hantle", imageUrl: "/uploads/standard_equip/dumbbells.webp" },
    { name: "Orbitrek (Elliptical)", imageUrl: "/uploads/standard_equip/elliptical-trainer.webp" },
    { name: "Atlas funkcjonalny", imageUrl: "/uploads/standard_equip/functional-trainer.webp" },
    { name: "Odważniki Kettlebell", imageUrl: "/uploads/standard_equip/Kettlebells.webp" },
    {
      name: "Maszyna na dwugłowy uda (Leg Curl)",
      imageUrl: "/uploads/standard_equip/leg-curl.webp",
    },
    {
      name: "Maszyna na czworogłowy uda (Leg Extension)",
      imageUrl: "/uploads/standard_equip/leg-extension.webp",
    },
    { name: "Drążek do podciągania", imageUrl: "/uploads/standard_equip/Pull-up-bar.webp" },
    { name: "Uchwyty do pompek", imageUrl: "/uploads/standard_equip/push-up-bars.webp" },
    { name: "Maszyna do dipów i pompek", imageUrl: "/uploads/standard_equip/push-up-machine.webp" },
    {
      name: "Gumy oporowe (Resistance Bands)",
      imageUrl: "/uploads/standard_equip/resistant_band.webp",
    },
    {
      name: "Ergometr wioślarski (Wioślarz)",
      imageUrl: "/uploads/standard_equip/rowing-machine.webp",
    },
    { name: "Suwnica Smitha", imageUrl: "/uploads/standard_equip/smith-machine.webp" },
    { name: "Klatka / Stojak do przysiadów", imageUrl: "/uploads/standard_equip/squat-rack.webp" },
    { name: "Schody treningowe", imageUrl: "/uploads/standard_equip/stair-climber.webp" },
    { name: "Rower stacjonarny", imageUrl: "/uploads/standard_equip/stationary-bike.webp" },
    { name: "Ławka treningowa", imageUrl: "/uploads/standard_equip/training-bench.webp" },
    { name: "Bieżnia", imageUrl: "/uploads/standard_equip/treadmill.webp" },
  ];

  for (const machine of standardMachines) {
    await prisma.standardEquipment.upsert({
      where: { name: machine.name },
      update: { imageUrl: machine.imageUrl },
      create: {
        name: machine.name,
        imageUrl: machine.imageUrl,
      },
    });
  }
}

async function main() {
  console.log("⚙️ Seeding database...");

  const passwordHash = await bcrypt.hash("password", 10);

  await seedAdmins(passwordHash);
  await seedStandardEquipment();
  await seedManagers(passwordHash);
  const gymMap = await seedGyms();
  await seedTrainers(passwordHash, gymMap);
  await seedMembers(passwordHash, gymMap);
  const roomMap = await seedRooms(gymMap);
  await seedGroupClasses(gymMap, roomMap);
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
