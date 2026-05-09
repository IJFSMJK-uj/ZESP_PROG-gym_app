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

export interface GroupClassScheduleItem {
  id: number;
  gymId: number;
  roomId: number | null;
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
  "id" | "gymId" | "roomId" | "instructors"
> & {
  instructorIds: number[];
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
};
