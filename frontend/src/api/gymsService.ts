const API_URL = "http://localhost:5174/api/gyms";

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
};
