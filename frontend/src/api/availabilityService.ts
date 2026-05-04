const API_URL = "http://localhost:3001/api/trainer-availability";

export const availabilityService = {
  async getMyAvailability() {
    const response = await fetch(`${API_URL}/trainer/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.json();
  },

  async getMyGyms() {
    const response = await fetch(`${API_URL}/trainer/me/gyms`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.json();
  },

  async create(data: {
    assignmentId?: number | null;
    dayOfWeek: number;
    startHour: number;
    endHour: number;
  }) {
    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  async delete(id: number) {
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  },
};
