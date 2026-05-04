const API_URL = "http://localhost:3001/api/trainer-schedule";

export const reservationsService = {
  async getSchedule(assignmentId: string | number, weekStart: string) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${assignmentId}?weekStart=${weekStart}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async getClientReservations() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/client/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async getTrainerReservations() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/trainer/me/reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async bookSlot(data: { assignmentId: number; date: string; startHour: number; endHour: number }) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async cancelReservation(id: number) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${id}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};
