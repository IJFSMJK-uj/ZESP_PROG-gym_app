const API_URL = "http://localhost:5174/api/auth";

export const authService = {
  async register(email: string, password: string) {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem("token", data.token); // Zapisujemy sesję
    }
    return data;
  },

  logout() {
    localStorage.removeItem("token");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  async getProfile() {
    const response = await fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.json();
  },

  async updateProfile(data: { email?: string; role?: string }) {
    const response = await fetch(`${API_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async requestPasswordReset(email: string) {
    try {
      const response = await fetch(`${API_URL}/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      return { error: "Błąd połączenia z serwerem" };
    }
  },

  changePassword: async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      return await response.json();
    } catch (error) {
      return { error: "Błąd sieci. Spróbuj ponownie." };
    }
  },
};
