const API_URL = "http://localhost:5174/api/invite";

export const inviteService = {
  async generateTrainerInvite(expiresInHours?: number) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/trainer/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(expiresInHours ? { expiresInHours } : {}),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Błąd backendu generateTrainerInvite:", text);
      return { error: "Nie udało się wygenerować zaproszenia" };
    }

    return response.json();
  },

  async useTrainerInvite(hash: string) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/trainer/use`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ hash }),
    });

    if (!response.ok) {
      const json = await response.json();
      return {
        error: "Nie udało się wykorzystać zaproszenia. " + json.error + ".",
      };
    }

    return response.json();
  },

  async getTrainerInvite(hash: string) {
    const response = await fetch(`${API_URL}/trainer/${hash}`);

    if (!response.ok) {
      const text = await response.text();
      console.error("Błąd backendu getTrainerInvite:", text);
      return { error: "Nie znaleziono zaproszenia lub jest nieważne" };
    }

    return response.json();
  },

  async getActiveTrainerInvites() {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/trainer/active`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Błąd backendu getActiveTrainerInvites:", text);
      return { error: "Nie udało się pobrać aktywnych zaproszeń" };
    }

    return response.json();
  },
};
