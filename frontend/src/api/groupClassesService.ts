const API_URL = "http://localhost:3001/api/group-classes";

export interface GroupClassInstructor {
  id: number;
  assignment: {
    id: number;
    trainerProfile: {
      id: number;
      firstName: string | null;
      lastName: string | null;
      user: {
        id: number;
        email: string;
      };
    };
  };
}

export interface GroupClassRoom {
  id: number;
  name: string;
  capacity: number | null;
}

export interface GroupClassScheduleItem {
  id: number;
  gymId: number;
  roomId: number | null;
  room: GroupClassRoom | null;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: number;
  endTime: number;
  capacity: number | null;
  isActive: boolean;
  instructors: GroupClassInstructor[];
}

export type GroupClassSchedulePayload = Omit<
  GroupClassScheduleItem,
  "id" | "gymId" | "room" | "instructors"
> & {
  instructorIds: number[];
};

export const getNextClassDate = (dayOfWeek: number): Date => {
  const today = new Date();
  const currentDay = today.getDay() === 0 ? 7 : today.getDay();
  const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntil);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const getUpcomingDate = (dayOfWeek: number, startTime: number): Date | null => {
  const now = new Date();
  const jsDay = now.getDay();
  const dbDay = dayOfWeek;

  const jsTarget = dbDay === 7 ? 0 : dbDay;

  let daysUntil = (jsTarget - jsDay + 7) % 7;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (daysUntil === 0 && startTime <= currentMinutes) daysUntil = 7;

  const date = new Date(now);
  date.setDate(now.getDate() + daysUntil);
  date.setHours(Math.floor(startTime / 60), startTime % 60, 0, 0);
  return date;
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const readResponse = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: data.error || fallback };
  }

  return data;
};

export const groupClassesService = {
  async getSchedule(gymId: number | string) {
    const response = await fetch(`${API_URL}/gyms/${gymId}/schedule`, {
      headers: authHeaders(),
    });

    return readResponse(response, "Nie udało się pobrać grafiku zajęć");
  },

  async createScheduleItem(gymId: number | string, data: GroupClassSchedulePayload) {
    const response = await fetch(`${API_URL}/gyms/${gymId}/schedule`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    return readResponse(response, "Nie udało się dodać zajęć");
  },

  async updateScheduleItem(
    gymId: number | string,
    classId: number,
    data: GroupClassSchedulePayload
  ) {
    const response = await fetch(`${API_URL}/gyms/${gymId}/schedule/${classId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    return readResponse(response, "Nie udało się zaktualizować zajęć");
  },

  async deleteScheduleItem(gymId: number | string, classId: number) {
    const response = await fetch(`${API_URL}/gyms/${gymId}/schedule/${classId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    return readResponse(response, "Nie udało się usunąć zajęć");
  },

  async getGymClasses(gymId: number | string) {
    const now = new Date().toISOString();
    const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const response = await fetch(`${API_URL}/gyms/${gymId}/classes?from=${now}&to=${weekLater}`, {
      headers: authHeaders(),
    });
    return readResponse(response, "Nie udało się pobrać grafiku zajęć");
  },

  async enrollInClass(gymId: number | string, classId: number, date: Date) {
    const response = await fetch(`${API_URL}/gyms/${gymId}/classes/${classId}/enroll`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ date: date.toISOString() }),
    });
    return readResponse(response, "Nie udało się zapisać na zajęcia");
  },

  async unenrollFromClass(gymId: number | string, classId: number, date: Date) {
    const response = await fetch(`${API_URL}/gyms/${gymId}/classes/${classId}/enroll`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ date: date.toISOString() }),
    });
    return readResponse(response, "Nie udało się wypisać z zajęć");
  },
};
