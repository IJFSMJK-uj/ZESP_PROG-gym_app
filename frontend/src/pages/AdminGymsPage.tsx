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
  lat: number | null;
  lng: number | null;
}

export const AdminGymsPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [search, setSearch] = useState("");

  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showFlash = (type: "ok" | "err", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    const data = await adminService.fetchGyms(token);
    if (data.error) showFlash("err", data.error);
    else setGyms(data);
    setLoading(false);
  };

  useEffect(() => {
    if (token && user?.role === "ADMIN") load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openEdit = (gym: Gym) => {
    setEditingGym(gym);
    setFormName(gym.name);
    setFormAddress(gym.address);
    setFormLat(gym.lat != null ? String(gym.lat) : "");
    setFormLng(gym.lng != null ? String(gym.lng) : "");
    setFormError("");
  };
  const cancelEdit = () => {
    setEditingGym(null);
    setFormName("");
    setFormAddress("");
    setFormLat("");
    setFormLng("");
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formAddress.trim()) {
      setFormError("Nazwa i adres są wymagane");
      return;
    }
    setFormLoading(true);
    setFormError("");
    const payload = { name: formName, address: formAddress, lat: formLat, lng: formLng };
    const data = editingGym
      ? await adminService.updateGym(token, editingGym.id, payload)
      : await adminService.createGym(token, payload);
    if (data.error) setFormError(data.error);
    else {
      showFlash("ok", editingGym ? "Zaktualizowano." : "Dodano.");
      cancelEdit();
      load();
    }
    setFormLoading(false);
  };

  const handleDelete = async (id: number) => {
    const data = await adminService.deleteGym(token, id);
    if (data.error) showFlash("err", data.error);
    else {
      showFlash("ok", "Usunięto.");
      setDeletingId(null);
      load();
    }
  };

  const filtered = gyms.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.address.toLowerCase().includes(search.toLowerCase())
  );

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
        <span className="text-white font-semibold">Siłownie</span>
        <span className="text-sm text-zinc-500">{user?.email}</span>
      </div>

      {flash && (
        <div
          className={`text-sm px-3 py-2 rounded-lg border ${flash.type === "ok" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-red-300 bg-red-500/10 border-red-500/20"}`}
        >
          {flash.msg}
        </div>
      )}

      {/* FORMULARZ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
        <span className="text-sm text-zinc-400">
          {editingGym ? `Edytujesz: ${editingGym.name}` : "Nowa siłownia"}
        </span>
        {formError && <p className="text-sm text-red-400">{formError}</p>}
        <div className="flex gap-2 flex-wrap">
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Nazwa"
            className="h-9 border-zinc-700 bg-black text-zinc-100 focus:border-red-500 min-w-40 flex-1"
          />
          <Input
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            placeholder="Adres"
            className="h-9 border-zinc-700 bg-black text-zinc-100 focus:border-red-500 min-w-48 flex-1"
          />
          <Input
            value={formLat}
            onChange={(e) => setFormLat(e.target.value)}
            placeholder="Szerokość (lat)"
            className="h-9 border-zinc-700 bg-black text-zinc-100 focus:border-red-500 w-36"
          />
          <Input
            value={formLng}
            onChange={(e) => setFormLng(e.target.value)}
            placeholder="Długość (lng)"
            className="h-9 border-zinc-700 bg-black text-zinc-100 focus:border-red-500 w-36"
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
        <p className="text-xs text-zinc-600">
          Współrzędne możesz skopiować z{" "}
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 hover:text-zinc-300 underline"
          >
            Google Maps
          </a>{" "}
          (PPM na mapie → „Co tu jest?")
        </p>
      </div>

      {/* LISTA */}
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
                <th className="px-4 py-2 text-left font-normal w-40">Koordynaty</th>
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
                  <td className="px-4 py-2 text-zinc-600 font-mono text-xs">
                    {gym.lat != null && gym.lng != null ? (
                      <span className="text-zinc-500">
                        {gym.lat.toFixed(5)}, {gym.lng.toFixed(5)}
                      </span>
                    ) : (
                      <span className="text-zinc-700 italic">brak</span>
                    )}
                  </td>
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
};
