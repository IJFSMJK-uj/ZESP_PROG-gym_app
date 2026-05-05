import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { adminService } from "../api/adminService";

interface Gym {
  id: number;
  name: string;
  address: string;
}

interface UserRow {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  managedGyms: { id: number; name: string }[];
}

type SortField = "id" | "email" | "role";
type SortDir = "asc" | "desc";

const ROLE_COLORS: Record<string, string> = {
  MEMBER: "text-zinc-400",
  TRAINER: "text-sky-400",
  GYM_MANAGER: "text-emerald-400",
  ADMIN: "text-red-400",
};

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
  const [assignGymId, setAssignGymId] = useState<string>("");

  const showFlash = (type: "ok" | "err", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    const [u, g] = await Promise.all([
      adminService.fetchUsers(token),
      adminService.fetchGyms(token),
    ]);
    if (!u.error) setUsers(u);
    if (!g.error) setGyms(g);
    setLoading(false);
  };

  useEffect(() => {
    if (token && user?.role === "ADMIN") load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRoleChange = async (userId: number, role: string) => {
    const data = await adminService.patchRole(token, userId, role);
    if (data.error) showFlash("err", data.error);
    else {
      showFlash("ok", "Rola zmieniona.");
      load();
    }
  };

  const handleAssignGym = async (userId: number) => {
    if (!assignGymId) return;
    const data = await adminService.assignGym(token, userId, parseInt(assignGymId));
    if (data.error) showFlash("err", data.error);
    else {
      showFlash("ok", "Przypisano do siłowni.");
      setAssigningUserId(null);
      setAssignGymId("");
      load();
    }
  };

  const handleRemoveGym = async (userId: number, gymId: number) => {
    const data = await adminService.removeGym(token, userId, gymId);
    if (data.error) showFlash("err", data.error);
    else {
      showFlash("ok", "Odepnięto od siłowni.");
      load();
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortArrow = (field: SortField) =>
    sortField !== field ? (
      <span className="text-zinc-700 ml-1">↕</span>
    ) : (
      <span className="text-red-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    );

  const filtered = users
    .filter((u) => {
      const matchSearch = u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === "ALL" || u.role === filterRole;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "id") return (a.id - b.id) * dir;
      if (sortField === "email") return a.email.localeCompare(b.email) * dir;
      if (sortField === "role") return a.role.localeCompare(b.role) * dir;
      return 0;
    });

  if (!token)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-zinc-400">Musisz się zalogować.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
          Zaloguj się
        </Button>
      </div>
    );

  if (!loading && user?.role !== "ADMIN")
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-red-400">Brak dostępu.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/")}>
          Powrót
        </Button>
      </div>
    );

  return (
    <div className="w-[80%] mx-auto py-8 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-white font-semibold">Użytkownicy</span>
        <span className="text-sm text-zinc-500">{user?.email}</span>
      </div>

      {flash && (
        <div
          className={`text-sm px-3 py-2 rounded-lg border ${flash.type === "ok" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-red-300 bg-red-500/10 border-red-500/20"}`}
        >
          {flash.msg}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        {/* FILTRY */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 flex-wrap">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po emailu..."
            className="h-8 w-64 border-zinc-700 bg-black text-zinc-100 focus:border-red-500"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="h-8 rounded-md border border-zinc-700 bg-black text-zinc-100 text-sm px-2 focus:border-red-500 outline-none cursor-pointer"
          >
            <option value="ALL">Wszystkie role</option>
            <option value="MEMBER">Członek</option>
            <option value="TRAINER">Trener</option>
            <option value="GYM_MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          <span className="text-sm text-zinc-600 ml-auto shrink-0">
            {loading ? "..." : `${filtered.length} / ${users.length}`}
          </span>
        </div>

        {/* TABELA */}
        {loading ? (
          <p className="text-sm text-zinc-500 px-4 py-6 text-center">Ładowanie...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-zinc-600 px-4 py-6 text-center">Brak wyników.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-600 border-b border-zinc-800">
                <th
                  className="px-4 py-2 text-left font-normal w-10 cursor-pointer hover:text-zinc-400 select-none"
                  onClick={() => toggleSort("id")}
                >
                  # {sortArrow("id")}
                </th>
                <th
                  className="px-4 py-2 text-left font-normal cursor-pointer hover:text-zinc-400 select-none"
                  onClick={() => toggleSort("email")}
                >
                  Email {sortArrow("email")}
                </th>
                <th
                  className="px-4 py-2 text-left font-normal cursor-pointer hover:text-zinc-400 select-none w-40"
                  onClick={() => toggleSort("role")}
                >
                  Rola {sortArrow("role")}
                </th>
                <th className="px-4 py-2 text-left font-normal">Zarządza siłowniami</th>
                <th className="px-4 py-2 text-right font-normal w-28">Dołączył</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isAssigning = assigningUserId === u.id;
                const availableGyms = gyms.filter(
                  (g) => !u.managedGyms.some((mg) => mg.id === g.id)
                );

                return (
                  <tr
                    key={u.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors align-top"
                  >
                    <td className="px-4 py-3 text-zinc-600">{u.id}</td>
                    <td className="px-4 py-3 text-zinc-200">{u.email}</td>

                    <td className="px-4 py-3">
                      {u.role === "ADMIN" ? (
                        <span className={`text-sm ${ROLE_COLORS["ADMIN"]}`}>Admin</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`bg-transparent border border-zinc-700 rounded-md px-2 py-0.5 text-sm outline-none cursor-pointer hover:border-zinc-500 ${ROLE_COLORS[u.role]}`}
                        >
                          <option value="MEMBER">Członek</option>
                          <option value="TRAINER">Trener</option>
                          <option value="GYM_MANAGER">Manager</option>
                        </select>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {u.role !== "GYM_MANAGER" ? (
                        <span className="text-xs text-zinc-600 italic">
                          Tylko manager może zarządzać siłowniami
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 items-center">
                          {u.managedGyms.length === 0 && !isAssigning && (
                            <span className="text-zinc-600">—</span>
                          )}
                          {u.managedGyms.map((gym) => (
                            <span
                              key={gym.id}
                              className="inline-flex items-center gap-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full px-2 py-0.5"
                            >
                              {gym.name}
                              <button
                                onClick={() => handleRemoveGym(u.id, gym.id)}
                                className="text-zinc-500 hover:text-red-400 cursor-pointer leading-none"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {isAssigning ? (
                            <span className="flex items-center gap-1">
                              <select
                                value={assignGymId}
                                onChange={(e) => setAssignGymId(e.target.value)}
                                className="h-7 text-xs bg-black border border-zinc-700 text-zinc-100 rounded-md px-2 outline-none focus:border-red-500 cursor-pointer"
                              >
                                <option value="">Wybierz siłownię...</option>
                                {availableGyms.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssignGym(u.id)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer"
                              >
                                ok
                              </button>
                              <button
                                onClick={() => {
                                  setAssigningUserId(null);
                                  setAssignGymId("");
                                }}
                                className="text-xs text-zinc-500 hover:text-white cursor-pointer"
                              >
                                anuluj
                              </button>
                            </span>
                          ) : (
                            availableGyms.length > 0 && (
                              <button
                                onClick={() => {
                                  setAssigningUserId(u.id);
                                  setAssignGymId("");
                                }}
                                className="text-xs text-zinc-600 hover:text-zinc-300 cursor-pointer border border-dashed border-zinc-700 hover:border-zinc-500 rounded-full px-2 py-0.5 transition-colors"
                              >
                                + przypisz
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-zinc-700 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("pl-PL")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
