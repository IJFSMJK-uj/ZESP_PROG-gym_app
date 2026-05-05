import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

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

const API = "http://localhost:5174/api/admin";

function useAdminApi() {
  const { token } = useAuth();
  const h = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });
  return {
    fetchGyms: () => fetch(`${API}/gyms`, { headers: h() }).then((r) => r.json()),
    createGym: (d: { name: string; address: string }) =>
      fetch(`${API}/gyms`, { method: "POST", headers: h(), body: JSON.stringify(d) }).then((r) =>
        r.json()
      ),
    updateGym: (id: number, d: { name: string; address: string }) =>
      fetch(`${API}/gyms/${id}`, { method: "PUT", headers: h(), body: JSON.stringify(d) }).then(
        (r) => r.json()
      ),
    deleteGym: (id: number) =>
      fetch(`${API}/gyms/${id}`, { method: "DELETE", headers: h() }).then((r) => r.json()),
    fetchUsers: () => fetch(`${API}/users`, { headers: h() }).then((r) => r.json()),
    patchRole: (userId: number, role: string) =>
      fetch(`${API}/users/${userId}/role`, {
        method: "PATCH",
        headers: h(),
        body: JSON.stringify({ role }),
      }).then((r) => r.json()),
    assignGym: (userId: number, gymId: number) =>
      fetch(`${API}/users/${userId}/manager-gyms/${gymId}`, { method: "POST", headers: h() }).then(
        (r) => r.json()
      ),
    removeGym: (userId: number, gymId: number) =>
      fetch(`${API}/users/${userId}/manager-gyms/${gymId}`, {
        method: "DELETE",
        headers: h(),
      }).then((r) => r.json()),
  };
}

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Członek",
  TRAINER: "Trener",
  GYM_MANAGER: "Manager",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  MEMBER: "text-zinc-400",
  TRAINER: "text-sky-400",
  GYM_MANAGER: "text-emerald-400",
  ADMIN: "text-red-400",
};

// ─── ZAKŁADKA: SIŁOWNIE ──────────────────────────────────────────────────────

function GymsTab({
  api,
  flash,
}: {
  api: ReturnType<typeof useAdminApi>;
  flash: (t: "ok" | "err", m: string) => void;
}) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await api.fetchGyms();
    if (data.error) flash("err", data.error);
    else setGyms(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (gym: Gym) => {
    setEditingGym(gym);
    setFormName(gym.name);
    setFormAddress(gym.address);
    setFormError("");
  };
  const cancelEdit = () => {
    setEditingGym(null);
    setFormName("");
    setFormAddress("");
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formAddress.trim()) {
      setFormError("Nazwa i adres są wymagane");
      return;
    }
    setFormLoading(true);
    setFormError("");
    const data = editingGym
      ? await api.updateGym(editingGym.id, { name: formName, address: formAddress })
      : await api.createGym({ name: formName, address: formAddress });
    if (data.error) setFormError(data.error);
    else {
      flash("ok", editingGym ? "Zaktualizowano." : "Dodano.");
      cancelEdit();
      load();
    }
    setFormLoading(false);
  };

  const handleDelete = async (id: number) => {
    const data = await api.deleteGym(id);
    if (data.error) flash("err", data.error);
    else {
      flash("ok", "Usunięto.");
      setDeletingId(null);
      load();
    }
  };

  const filtered = gyms.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* formularz */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
        <span className="text-sm text-zinc-400">
          {editingGym ? `Edytujesz: ${editingGym.name}` : "Nowa siłownia"}
        </span>
        {formError && <p className="text-sm text-red-400">{formError}</p>}
        <div className="flex gap-2">
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Nazwa"
            className="h-9 border-zinc-700 bg-black text-zinc-100 focus:border-red-500"
          />
          <Input
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            placeholder="Adres"
            className="h-9 border-zinc-700 bg-black text-zinc-100 focus:border-red-500"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={formLoading}
            className="h-9 shrink-0 cursor-pointer"
          >
            {formLoading ? "..." : editingGym ? "Zapisz" : "Dodaj"}
          </Button>
          {editingGym && (
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelEdit}
              className="h-9 shrink-0 cursor-pointer text-zinc-400"
            >
              Anuluj
            </Button>
          )}
        </div>
      </div>

      {/* lista */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj siłowni..."
            className="h-8 border-zinc-700 bg-black text-zinc-100 focus:border-red-500"
          />
          <span className="text-sm text-zinc-600 shrink-0">
            {loading ? "..." : `${filtered.length} / ${gyms.length}`}
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-zinc-500 px-4 py-6 text-center">Ładowanie...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-zinc-600 px-4 py-6 text-center">Brak wyników.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-600 border-b border-zinc-800">
                <th className="px-4 py-2 text-left font-normal w-10">#</th>
                <th className="px-4 py-2 text-left font-normal">Nazwa</th>
                <th className="px-4 py-2 text-left font-normal">Adres</th>
                <th className="px-4 py-2 text-right font-normal w-32"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((gym) => (
                <tr
                  key={gym.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-2 text-zinc-600">{gym.id}</td>
                  <td className="px-4 py-2 text-zinc-200">{gym.name}</td>
                  <td className="px-4 py-2 text-zinc-400">{gym.address}</td>
                  <td className="px-4 py-2 text-right">
                    {deletingId === gym.id ? (
                      <span className="flex items-center justify-end gap-1">
                        <span className="text-red-400 mr-1">Usunąć?</span>
                        <button
                          onClick={() => handleDelete(gym.id)}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          tak
                        </button>
                        <span className="text-zinc-700">/</span>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-zinc-400 hover:text-white cursor-pointer"
                        >
                          nie
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(gym)}
                          className="text-zinc-400 hover:text-white cursor-pointer"
                        >
                          edytuj
                        </button>
                        <button
                          onClick={() => setDeletingId(gym.id)}
                          className="text-red-500/60 hover:text-red-400 cursor-pointer"
                        >
                          usuń
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── ZAKŁADKA: UŻYTKOWNICY ───────────────────────────────────────────────────

function UsersTab({
  api,
  flash,
}: {
  api: ReturnType<typeof useAdminApi>;
  flash: (t: "ok" | "err", m: string) => void;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
  const [assignGymId, setAssignGymId] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const [u, g] = await Promise.all([api.fetchUsers(), api.fetchGyms()]);
    if (!u.error) setUsers(u);
    if (!g.error) setGyms(g);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (userId: number, role: string) => {
    const data = await api.patchRole(userId, role);
    if (data.error) flash("err", data.error);
    else {
      flash("ok", "Rola zmieniona.");
      load();
    }
  };

  const handleAssignGym = async (userId: number) => {
    if (!assignGymId) return;
    const data = await api.assignGym(userId, parseInt(assignGymId));
    if (data.error) flash("err", data.error);
    else {
      flash("ok", "Przypisano do siłowni.");
      setAssigningUserId(null);
      setAssignGymId("");
      load();
    }
  };

  const handleRemoveGym = async (userId: number, gymId: number) => {
    const data = await api.removeGym(userId, gymId);
    if (data.error) flash("err", data.error);
    else {
      flash("ok", "Odepnięto od siłowni.");
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

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return <span className="text-zinc-700 ml-1">↕</span>;
    return <span className="text-red-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

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

  return (
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
                className="px-4 py-2 text-left font-normal cursor-pointer hover:text-zinc-400 select-none w-36"
                onClick={() => toggleSort("role")}
              >
                Rola {sortArrow("role")}
              </th>
              <th className="px-4 py-2 text-left font-normal">Zarządza siłowniami</th>
              <th className="px-4 py-2 text-right font-normal w-36">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const isAssigning = assigningUserId === user.id;
              const availableGyms = gyms.filter(
                (g) => !user.managedGyms.some((mg) => mg.id === g.id)
              );

              return (
                <tr
                  key={user.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors align-top"
                >
                  <td className="px-4 py-3 text-zinc-600">{user.id}</td>
                  <td className="px-4 py-3 text-zinc-200">{user.email}</td>

                  {/* ROLA */}
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`bg-transparent border border-zinc-700 rounded-md px-2 py-0.5 text-sm outline-none cursor-pointer hover:border-zinc-500 ${ROLE_COLORS[user.role]}`}
                    >
                      <option value="MEMBER">Członek</option>
                      <option value="TRAINER">Trener</option>
                      <option value="GYM_MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>

                  {/* SIŁOWNIE */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 items-center">
                      {user.managedGyms.length === 0 && !isAssigning && (
                        <span className="text-zinc-600 text-sm">—</span>
                      )}
                      {user.managedGyms.map((gym) => (
                        <span
                          key={gym.id}
                          className="inline-flex items-center gap-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full px-2 py-0.5"
                        >
                          {gym.name}
                          <button
                            onClick={() => handleRemoveGym(user.id, gym.id)}
                            className="text-zinc-500 hover:text-red-400 cursor-pointer leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {isAssigning ? (
                        <span className="flex items-center gap-1 mt-1">
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
                            onClick={() => handleAssignGym(user.id)}
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
                              setAssigningUserId(user.id);
                              setAssignGymId("");
                            }}
                            className="text-xs text-zinc-600 hover:text-zinc-300 cursor-pointer border border-dashed border-zinc-700 hover:border-zinc-500 rounded-full px-2 py-0.5 transition-colors"
                          >
                            + przypisz
                          </button>
                        )
                      )}
                    </div>
                  </td>

                  {/* AKCJE (placeholder na przyszłość) */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-zinc-700">
                      {new Date(user.createdAt).toLocaleDateString("pl-PL")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── GŁÓWNA STRONA ───────────────────────────────────────────────────────────

export const AdminPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const api = useAdminApi();

  const [flash, setFlash] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const showFlash = (type: "ok" | "err", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3000);
  };

  if (!token)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-zinc-400">Musisz się zalogować.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
          Zaloguj się
        </Button>
      </div>
    );

  if (user?.role !== "ADMIN")
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
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white font-semibold">Panel Administratora</span>
        </div>
        <span className="text-sm text-zinc-500">{user.email}</span>
      </div>

      {/* FLASH */}
      {flash && (
        <div
          className={`text-sm px-3 py-2 rounded-lg border ${flash.type === "ok" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-red-300 bg-red-500/10 border-red-500/20"}`}
        >
          {flash.msg}
        </div>
      )}

      {/* TABS */}
      <Tabs defaultValue="gyms">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="gyms" className="data-active:bg-zinc-800 data-active:text-white">
            Siłownie
          </TabsTrigger>
          <TabsTrigger value="users" className="data-active:bg-zinc-800 data-active:text-white">
            Użytkownicy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gyms">
          <GymsTab api={api} flash={showFlash} />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab api={api} flash={showFlash} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
