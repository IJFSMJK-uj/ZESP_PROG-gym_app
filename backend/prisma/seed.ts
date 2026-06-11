import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// --- DANE ---
const ADMIN_DATA = [{ email: "admin@gymapp.pl" }];

const MANAGERS_DATA = [
  { email: "manager@gymapp.pl" },
  { email: "manager.krakow@gymapp.pl" },
  { email: "manager.wieliczka@gymapp.pl" },
  { email: "manager.warszawa@gymapp.pl" },
  { email: "manager.wroclaw@gymapp.pl" },
  { email: "manager.gdansk@gymapp.pl" },
  { email: "manager.poznan@gymapp.pl" },
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
  {
    name: "Gym Central Warszawa Mokotów",
    address: "ul. Puławska 145, Warszawa",
    lat: 52.1899,
    lng: 21.0217,
    email: "mokotow@gymapp.pl",
    phoneNumber: "222 333 444",
    description:
      "Gym Central Warszawa Mokotów to miejski klub treningowy z dużą strefą wolnych ciężarów, salą funkcjonalną i zajęciami po pracy. Klub jest wygodny dla osób dojeżdżających z centrum oraz południowych dzielnic Warszawy.",
    managerEmails: ["manager.warszawa@gymapp.pl"],
  },
  {
    name: "Gym Central Wrocław Rynek",
    address: "ul. Kazimierza Wielkiego 33, Wrocław",
    lat: 51.1087,
    lng: 17.0266,
    email: "wroclaw@gymapp.pl",
    phoneNumber: "333 444 555",
    description:
      "Gym Central Wrocław Rynek to kompaktowa siłownia w centrum miasta, nastawiona na szybkie treningi przed pracą, trening personalny oraz zajęcia mobility w małych grupach.",
    managerEmails: ["manager.wroclaw@gymapp.pl"],
  },
  {
    name: "Gym Central Gdańsk Wrzeszcz",
    address: "al. Grunwaldzka 87, Gdańsk",
    lat: 54.3792,
    lng: 18.6051,
    email: "gdansk@gymapp.pl",
    phoneNumber: "444 555 666",
    description:
      "Gym Central Gdańsk Wrzeszcz to przestronny klub z mocną strefą cardio, salą rowerową i zajęciami grupowymi dla osób trenujących regularnie po zajęciach lub pracy.",
    managerEmails: ["manager.gdansk@gymapp.pl"],
  },
  {
    name: "Gym Central Poznań Malta",
    address: "ul. Baraniaka 8, Poznań",
    lat: 52.4033,
    lng: 16.9739,
    email: "poznan@gymapp.pl",
    phoneNumber: "555 777 888",
    description:
      "Gym Central Poznań Malta to klub blisko terenów rekreacyjnych, łączący klasyczną siłownię, trening funkcjonalny i zajęcia wytrzymałościowe.",
    managerEmails: ["manager.poznan@gymapp.pl"],
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
  {
    email: "trener.marta@gymapp.pl",
    firstName: "Marta",
    lastName: "Zielińska",
    bio: "Trening funkcjonalny, zdrowe plecy i przygotowanie motoryczne.",
    phoneNumber: "+48 600 100 200",
    worksAt: ["Gym Central Warszawa Mokotów", "Gym Central Poznań Malta"],
    tags: ["funkcjonalny", "zdrowe plecy", "motoryka"],
  },
  {
    email: "trener.tomasz@gymapp.pl",
    firstName: "Tomasz",
    lastName: "Wiśniewski",
    bio: "Trener biegowy i instruktor zajęć wytrzymałościowych.",
    phoneNumber: "+48 600 300 400",
    worksAt: ["Gym Central Wrocław Rynek", "Gym Central Gdańsk Wrzeszcz"],
    tags: ["cardio", "wytrzymałość", "bieganie"],
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
  {
    email: "klient.ewa@gymapp.pl",
    firstName: "Ewa",
    lastName: "Nowicka",
    homeGymName: "Gym Central Warszawa Mokotów",
  },
  {
    email: "klient.piotr@gymapp.pl",
    firstName: "Piotr",
    lastName: "Lewandowski",
    homeGymName: "Gym Central Wrocław Rynek",
  },
  {
    email: "klient.maria@gymapp.pl",
    firstName: "Maria",
    lastName: "Kaczmarek",
    homeGymName: "Gym Central Gdańsk Wrzeszcz",
  },
  {
    email: "klient.ola@gymapp.pl",
    firstName: "Ola",
    lastName: "Wójcik",
    homeGymName: "Gym Central Poznań Malta",
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
      update: {
        memberProfile: {
          upsert: {
            update: {
              firstName: memberData.firstName,
              lastName: memberData.lastName,
              homeGymId,
            },
            create: {
              firstName: memberData.firstName,
              lastName: memberData.lastName,
              ...(homeGymId && { homeGymId }),
            },
          },
        },
      },
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
  "Gym Central Warszawa Mokotów": [
    { name: "Sala funkcjonalna", capacity: 18 },
    { name: "Studio mobility", capacity: 14 },
  ],
  "Gym Central Wrocław Rynek": [
    { name: "Sala treningu personalnego", capacity: 10 },
    { name: "Sala mobility", capacity: 16 },
  ],
  "Gym Central Gdańsk Wrzeszcz": [
    { name: "Sala rowerowa", capacity: 22 },
    { name: "Sala fitness", capacity: 24 },
  ],
  "Gym Central Poznań Malta": [
    { name: "Sala wytrzymałościowa", capacity: 20 },
    { name: "Strefa funkcjonalna", capacity: 16 },
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

  // ── Pozostałe miasta testowe ──
  const warId = gymMap["Gym Central Warszawa Mokotów"];
  const warRooms = roomMap["Gym Central Warszawa Mokotów"] ?? {};
  const martaWar = await getAssignment("trener.marta@gymapp.pl", "Gym Central Warszawa Mokotów");

  const wroId = gymMap["Gym Central Wrocław Rynek"];
  const wroRooms = roomMap["Gym Central Wrocław Rynek"] ?? {};
  const tomaszWro = await getAssignment("trener.tomasz@gymapp.pl", "Gym Central Wrocław Rynek");

  const gdaId = gymMap["Gym Central Gdańsk Wrzeszcz"];
  const gdaRooms = roomMap["Gym Central Gdańsk Wrzeszcz"] ?? {};
  const tomaszGda = await getAssignment("trener.tomasz@gymapp.pl", "Gym Central Gdańsk Wrzeszcz");

  const pozId = gymMap["Gym Central Poznań Malta"];
  const pozRooms = roomMap["Gym Central Poznań Malta"] ?? {};
  const martaPoz = await getAssignment("trener.marta@gymapp.pl", "Gym Central Poznań Malta");

  const cityClasses = [
    {
      gymId: warId,
      roomId: warRooms["Sala funkcjonalna"] ?? null,
      name: "Zdrowe plecy",
      description: "Spokojny trening wzmacniający kręgosłup i poprawiający postawę.",
      dayOfWeek: 1,
      startTime: 18 * 60,
      endTime: 19 * 60,
      capacity: 18,
      isActive: true,
      instructorAssignmentIds: martaWar ? [martaWar.id] : [],
    },
    {
      gymId: warId,
      roomId: warRooms["Studio mobility"] ?? null,
      name: "Mobility Express",
      description: "Krótka sesja mobilności po pracy.",
      dayOfWeek: 4,
      startTime: 19 * 60,
      endTime: 20 * 60,
      capacity: 14,
      isActive: true,
      instructorAssignmentIds: martaWar ? [martaWar.id] : [],
    },
    {
      gymId: wroId,
      roomId: wroRooms["Sala mobility"] ?? null,
      name: "Poranna mobilność",
      description: "Rozruch, stabilizacja i praca nad zakresem ruchu.",
      dayOfWeek: 2,
      startTime: 7 * 60,
      endTime: 8 * 60,
      capacity: 16,
      isActive: true,
      instructorAssignmentIds: tomaszWro ? [tomaszWro.id] : [],
    },
    {
      gymId: gdaId,
      roomId: gdaRooms["Sala rowerowa"] ?? null,
      name: "Indoor Cycling",
      description: "Rowerowy trening wytrzymałościowy z interwałami.",
      dayOfWeek: 3,
      startTime: 18 * 60,
      endTime: 19 * 60,
      capacity: 22,
      isActive: true,
      instructorAssignmentIds: tomaszGda ? [tomaszGda.id] : [],
    },
    {
      gymId: pozId,
      roomId: pozRooms["Strefa funkcjonalna"] ?? null,
      name: "Full Body Circuit",
      description: "Obwodowy trening całego ciała.",
      dayOfWeek: 5,
      startTime: 17 * 60,
      endTime: 18 * 60,
      capacity: 16,
      isActive: true,
      instructorAssignmentIds: martaPoz ? [martaPoz.id] : [],
    },
  ];

  for (const cls of [...wadClasses, ...norClasses, ...wielClasses, ...cityClasses]) {
    if (!cls.gymId) continue;
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

function upcomingDateForClass(dayOfWeek: number, startTime: number) {
  const now = new Date();
  const jsTarget = dayOfWeek === 7 ? 0 : dayOfWeek;
  let daysUntil = (jsTarget - now.getDay() + 7) % 7;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (daysUntil === 0 && startTime <= currentMinutes) daysUntil = 7;

  const upcomingDate = new Date(now);
  upcomingDate.setDate(now.getDate() + daysUntil);
  upcomingDate.setHours(0, 0, 0, 0);
  return upcomingDate;
}

async function seedGroupClassEnrollments() {
  console.log("⚙️ Creating group class enrollments (1-2 per member)...");

  await prisma.groupClassEnrollment.deleteMany({});
  const classes = await prisma.groupClass.findMany();
  const members = await prisma.user.findMany({ where: { role: Role.MEMBER } });
  const enrollmentKeys = new Set<string>();

  const enrollmentsData = [
    { memberEmail: "klient.adam@gymapp.pl", className: "Power Fitness" },
    { memberEmail: "klient.jan@gymapp.pl", className: "CrossFit" },
    { memberEmail: "klient.robert@gymapp.pl", className: "Spinning" },
    { memberEmail: "klient.iga@gymapp.pl", className: "Hatha Joga" },
    { memberEmail: "klient.ewa@gymapp.pl", className: "Zdrowe plecy" },
    { memberEmail: "klient.ewa@gymapp.pl", className: "Mobility Express" },
    { memberEmail: "klient.piotr@gymapp.pl", className: "Poranna mobilność" },
    { memberEmail: "klient.maria@gymapp.pl", className: "Indoor Cycling" },
    { memberEmail: "klient.ola@gymapp.pl", className: "Full Body Circuit" },
  ];

  for (const enrollment of enrollmentsData) {
    const [member, groupClass] = await Promise.all([
      prisma.user.findUnique({ where: { email: enrollment.memberEmail } }),
      prisma.groupClass.findFirst({ where: { name: enrollment.className } }),
    ]);

    if (!member || !groupClass) continue;

    const date = upcomingDateForClass(groupClass.dayOfWeek, groupClass.startTime);
    const key = `${member.id}-${groupClass.id}-${date.toISOString()}`;
    if (enrollmentKeys.has(key)) continue;
    enrollmentKeys.add(key);

    await prisma.groupClassEnrollment.create({
      data: {
        userId: member.id,
        classId: groupClass.id,
        date,
      },
    });
  }

  const seededRandom = (seed: string) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return () => {
      h = (h * 1664525 + 1013904223) >>> 0;
      return h / 2 ** 32;
    };
  };

  for (const member of members) {
    const rnd = seededRandom(member.email);
    const count = 1 + Math.floor(rnd() * 2); // 1-2 enrollments

    const chosen: Set<number> = new Set();
    for (let i = 0; i < count; i++) {
      if (classes.length === 0) break;
      let idx = Math.floor(rnd() * classes.length);
      // avoid duplicates per member
      let attempts = 0;
      while (chosen.has(idx) && attempts < 10) {
        idx = Math.floor(rnd() * classes.length);
        attempts++;
      }
      chosen.add(idx);

      const cls = classes[idx];
      if (!cls) continue;

      const date = upcomingDateForClass(cls.dayOfWeek, cls.startTime);
      const key = `${member.id}-${cls.id}-${date.toISOString()}`;
      if (enrollmentKeys.has(key)) continue;
      enrollmentKeys.add(key);

      await prisma.groupClassEnrollment.create({
        data: {
          userId: member.id,
          classId: cls.id,
          date,
        },
      });
    }
  }
}

async function seedReservations(gymMap: Record<string, number>) {
  console.log("⚙️ Creating training reservations (3-4 per member)...");

  await prisma.trainerReservation.deleteMany({});

  // Statyczne rezerwacje
  const getAssignment = async (trainerEmail: string, gymName: string) => {
    const gymId = gymMap[gymName];
    const user = await prisma.user.findUnique({
      where: { email: trainerEmail },
      include: { trainerProfile: { include: { assignments: true } } },
    });
    return user?.trainerProfile?.assignments.find((a) => a.gymId === gymId) ?? null;
  };

  const getMember = (email: string) => prisma.user.findUnique({ where: { email } });

  const dateFromToday = (daysOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const reservationsToCreate = [
    {
      memberEmail: "klient.adam@gymapp.pl",
      trainerEmail: "trener.jan@gymapp.pl",
      gymName: "Gym Central Wadowicka",
      date: dateFromToday(-2),
      startHour: 10,
      endHour: 11,
      status: "DONE" as const,
      reviewPromptSent: true,
    },
    {
      memberEmail: "klient.jan@gymapp.pl",
      trainerEmail: "trener.jan@gymapp.pl",
      gymName: "Gym Central Wadowicka",
      date: dateFromToday(-2),
      startHour: 11,
      endHour: 12,
      status: "DONE" as const,
      reviewPromptSent: true,
    },
    {
      memberEmail: "klient.adam@gymapp.pl",
      trainerEmail: "trener.pawel@gymapp.pl",
      gymName: "Gym Central Wadowicka",
      date: dateFromToday(-1),
      startHour: 12,
      endHour: 13,
      status: "DONE" as const,
      reviewPromptSent: true,
    },
    {
      memberEmail: "klient.robert@gymapp.pl",
      trainerEmail: "trener.anna@gymapp.pl",
      gymName: "Gym Central Norymberska",
      date: dateFromToday(1),
      startHour: 9,
      endHour: 10,
      status: "CONFIRMED" as const,
      reminderSent: false,
    },
    {
      memberEmail: "klient.ewa@gymapp.pl",
      trainerEmail: "trener.marta@gymapp.pl",
      gymName: "Gym Central Warszawa Mokotów",
      date: dateFromToday(2),
      startHour: 15,
      endHour: 16,
      status: "CONFIRMED" as const,
      reminderSent: false,
    },
    {
      memberEmail: "klient.piotr@gymapp.pl",
      trainerEmail: "trener.tomasz@gymapp.pl",
      gymName: "Gym Central Wrocław Rynek",
      date: dateFromToday(-3),
      startHour: 8,
      endHour: 9,
      status: "DONE" as const,
      reviewPromptSent: false,
    },
    {
      memberEmail: "klient.maria@gymapp.pl",
      trainerEmail: "trener.tomasz@gymapp.pl",
      gymName: "Gym Central Gdańsk Wrzeszcz",
      date: dateFromToday(3),
      startHour: 14,
      endHour: 15,
      status: "CANCELLED" as const,
      reminderSent: false,
    },
    {
      memberEmail: "klient.ola@gymapp.pl",
      trainerEmail: "trener.marta@gymapp.pl",
      gymName: "Gym Central Poznań Malta",
      date: dateFromToday(4),
      startHour: 13,
      endHour: 14,
      status: "CONFIRMED" as const,
      reminderSent: false,
    },
  ];

  for (const res of reservationsToCreate) {
    const [member, assignment] = await Promise.all([
      getMember(res.memberEmail),
      getAssignment(res.trainerEmail, res.gymName),
    ]);

    if (!member || !assignment) continue;

    await prisma.trainerReservation.create({
      data: {
        userId: member.id,
        assignmentId: assignment.id,
        date: res.date,
        startHour: res.startHour,
        endHour: res.endHour,
        status: res.status,
        reminderSent: res.reminderSent ?? false,
        reviewPromptSent: res.reviewPromptSent ?? false,
        cancelledById: res.status === "CANCELLED" ? member.id : undefined,
      },
    });
  }

  // Pobierz wszystkie możliwe assignments (trenerzy przypisani do siłowni)
  const assignments = await prisma.trainerAssignment.findMany({
    include: { trainerProfile: true },
  });

  const members = await prisma.user.findMany({ where: { role: Role.MEMBER } });

  const seededRandom = (seed: string) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return () => {
      h = (h * 1664525 + 1013904223) >>> 0;
      return h / 2 ** 32;
    };
  };

  for (const member of members) {
    const rnd = seededRandom(member.email + "-reservations");
    const count = 3 + Math.floor(rnd() * 2); // 3-4

    const used: Set<string> = new Set();
    for (let i = 0; i < count; i++) {
      if (assignments.length === 0) break;
      let idx = Math.floor(rnd() * assignments.length);
      let attempts = 0;
      while (used.has(String(idx)) && attempts < 10) {
        idx = Math.floor(rnd() * assignments.length);
        attempts++;
      }
      used.add(String(idx));

      const assignment = assignments[idx];
      if (!assignment) continue;

      // wybierz datę w zakresie -10..+10 dni (deterministycznie)
      const offset = Math.floor(rnd() * 21) - 10;
      const date = dateFromToday(offset);

      const startHour = 8 + Math.floor(rnd() * 10); // 8..17
      const endHour = startHour + 1;

      const status: "DONE" | "CONFIRMED" | "CANCELLED" =
        date < new Date(new Date().setHours(0, 0, 0, 0))
          ? rnd() > 0.1
            ? "DONE"
            : "CANCELLED"
          : "CONFIRMED";

      await prisma.trainerReservation.create({
        data: {
          userId: member.id,
          assignmentId: assignment.id,
          date,
          startHour,
          endHour,
          status,
          reminderSent: status === "CONFIRMED" ? false : undefined,
          reviewPromptSent: status === "DONE" ? false : undefined,
          cancelledById: status === "CANCELLED" ? member.id : undefined,
        },
      });
    }
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
  // await seedGroupClassEnrollments();
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
