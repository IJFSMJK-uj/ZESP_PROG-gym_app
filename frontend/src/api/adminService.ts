const API = "http://localhost:3001/api/admin";

const h = (token: string | null) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const adminService = {
  // Siłownie
  fetchGyms: (token: string | null) =>
    fetch(`${API}/gyms`, { headers: h(token) }).then((r) => r.json()),
  createGym: (
    token: string | null,
    d: { name: string; address: string; lat?: string; lng?: string }
  ) =>
    fetch(`${API}/gyms`, { method: "POST", headers: h(token), body: JSON.stringify(d) }).then((r) =>
      r.json()
    ),
  updateGym: (
    token: string | null,
    id: number,
    d: { name: string; address: string; lat?: string; lng?: string }
  ) =>
    fetch(`${API}/gyms/${id}`, { method: "PUT", headers: h(token), body: JSON.stringify(d) }).then(
      (r) => r.json()
    ),
  deleteGym: (token: string | null, id: number) =>
    fetch(`${API}/gyms/${id}`, { method: "DELETE", headers: h(token) }).then((r) => r.json()),

  // Użytkownicy
  fetchUsers: (token: string | null) =>
    fetch(`${API}/users`, { headers: h(token) }).then((r) => r.json()),
  patchRole: (token: string | null, userId: number, role: string) =>
    fetch(`${API}/users/${userId}/role`, {
      method: "PATCH",
      headers: h(token),
      body: JSON.stringify({ role }),
    }).then((r) => r.json()),
  assignGym: (token: string | null, userId: number, gymId: number) =>
    fetch(`${API}/users/${userId}/manager-gyms/${gymId}`, {
      method: "POST",
      headers: h(token),
    }).then((r) => r.json()),
  removeGym: (token: string | null, userId: number, gymId: number) =>
    fetch(`${API}/users/${userId}/manager-gyms/${gymId}`, {
      method: "DELETE",
      headers: h(token),
    }).then((r) => r.json()),
};
