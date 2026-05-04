const API_URL = "http://localhost:3001/api/trainers";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const trainersService = {
  async getTrainersByGym(gymId: number | null) {
    const response = await fetch(`${API_URL}/gym/${gymId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      console.error("BŁąd pobierania trenerów");
      return { error: "Nie udało się pobrać trenerów" };
    }

    return response.json();
  },
};
