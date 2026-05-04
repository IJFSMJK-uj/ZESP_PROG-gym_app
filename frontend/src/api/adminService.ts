const API_URL = "http://localhost:3001/api/admin";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const adminService = {
  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`, { headers: getAuthHeader() });
    return res.json();
  },
  getGyms: async () => {
    const res = await fetch(`${API_URL}/gyms`, { headers: getAuthHeader() });
    return res.json();
  },
};
