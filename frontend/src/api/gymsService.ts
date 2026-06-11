const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const API_URL = `${BASE_URL}/gyms`;

export interface GymRoom {
  id: number;
  gymId: number;
  name: string;
  capacity: number | null;
}

export interface OperatingHour {
  dayOfWeek: number;
  openTime: number;
  closeTime: number;
}

export const gymsService = {
  async getGyms() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(text);
      return { error: "Nie udało się pobrać siłowni" };
    }
    return response.json();
  },

  async getGymById(id: string | number) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(text);
      return { error: "Nie udało się pobrać siłowni" };
    }
    return response.json();
  },

  async selectGym(id: number | string) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(text);
      return { error: "Nie udało się wybrać siłowni" };
    }

    return response.json();
  },

  async updateMyGym(data: {
    address?: string;
    operatingHours?: OperatingHour[];
    additionalInfo?: string;
    description?: string;
    lat?: number | null;
    lng?: number | null;
  }) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(text);
      return { error: "Nie udało się zaktualizować danych siłowni" };
    }

    return response.json();
  },

  async updateGym(id: number, data: any) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(text);
      return { error: "Nie udało się zaktualizować danych siłowni" };
    }

    return response.json();
  },

  async getRooms(gymId: number) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${gymId}/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return { error: "Nie udało się pobrać sal" };
    return response.json();
  },

  async createRoom(gymId: number, data: { name: string; capacity?: number | null }) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${gymId}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) return { error: (await response.json()).error || "Błąd tworzenia sali" };
    return response.json();
  },

  async updateRoom(
    gymId: number,
    roomId: number,
    data: { name: string; capacity?: number | null }
  ) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${gymId}/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) return { error: (await response.json()).error || "Błąd aktualizacji sali" };
    return response.json();
  },

  async deleteRoom(gymId: number, roomId: number) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${gymId}/rooms/${roomId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return { error: (await response.json()).error || "Błąd usuwania sali" };
    return response.json();
  },

  async getGymStats(id: number) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/${id}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(text);
      return { error: "Nie udało się pobrać statystyk" };
    }

    return response.json();
  },
};
