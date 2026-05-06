import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

export const PanelPage = () => {
  const [gyms, setGyms] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  const navigate = useNavigate();
  const perPage = 5;

  useEffect(() => {
    const load = async () => {
      const profile = await authService.getProfile();

      setRole(profile.role);

      if (profile.role !== "GYM_MANAGER") return;

      if (profile.managedGyms?.length > 0) {
        setGyms(profile.managedGyms);
      } else if (profile.gym) {
        setGyms([profile.gym]);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (role && role !== "GYM_MANAGER") {
    return <div className="text-white text-center mt-10">Pusto</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-white mb-4">
          Musisz się zalogować, aby wybrać siłownie macierzystą
        </p>
        <Button variant="outline" onClick={() => navigate("/auth")} className="cursor-pointer">
          Przejdź do logowania
        </Button>
      </div>
    );
  }
  const filtered = gyms.filter(
    (g) =>
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.address?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="w-[80%] mx-auto py-8 flex flex-col gap-4">
      <h1 className="text-white text-2xl font-bold">Panel managera</h1>

      {/* SEARCH */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Szukaj siłowni..."
        className="bg-zinc-900 border-zinc-700"
      />

      {/* TABLE */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Nazwa</th>
              <th className="px-4 py-2 text-left">Adres</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-zinc-500 py-6">
                  Brak siłowni
                </td>
              </tr>
            ) : (
              paginated.map((gym) => (
                <tr
                  key={gym.id}
                  onClick={() => navigate(`/gym/${gym.id}/admin`)}
                  className="cursor-pointer border-b border-zinc-800 hover:bg-zinc-900 transition"
                >
                  <td className="px-4 py-2 text-zinc-500">{gym.id}</td>
                  <td className="px-4 py-2 text-white">{gym.name}</td>
                  <td className="px-4 py-2 text-zinc-400">{gym.address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Prev
        </Button>

        <span className="text-zinc-400">
          {page} / {totalPages || 1}
        </span>

        <Button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
