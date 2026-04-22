import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../api/adminService";
import { Card, CardContent, CardHeader } from "../components/ui/card";

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "gyms">("users");

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, gymsData] = await Promise.all([
          adminService.getUsers(),
          adminService.getGyms(),
        ]);
        if (!usersData.error) setUsers(usersData);
        if (!gymsData.error) setGyms(gymsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "ADMIN") fetchData();
  }, [user, navigate]);

  if (loading)
    return (
      <div className="p-8 text-center text-zinc-500 italic">Ładowanie panelu administratora...</div>
    );

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 md:p-8">
      <Card className="w-full max-w-6xl bg-black border border-red-500/40 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-red-900/5">
        <CardHeader className="pt-10 pb-6 space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-black text-red-500 uppercase tracking-tighter">
              Panel Administratora
            </h1>
            <p className="text-zinc-500 mt-2 text-sm">Podgląd bazy danych (Odczyt)</p>
          </div>

          <div className="flex justify-center p-1.5 bg-zinc-900/80 rounded-2xl border border-zinc-800 w-fit mx-auto">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-8 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${activeTab === "users" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Użytkownicy ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("gyms")}
              className={`px-8 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${activeTab === "gyms" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Siłownie ({gyms.length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-10">
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            {activeTab === "users" ? (
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900 text-xs uppercase text-zinc-500 font-black tracking-widest border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Imię i Nazwisko</th>
                    <th className="px-6 py-4">Siłownia</th>
                    <th className="px-6 py-4">Rola</th>
                    <th className="px-6 py-4">Data Rejestracji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {users.map((u) => {
                    const fullName = u.memberProfile?.firstName ? (
                      `${u.memberProfile.firstName} ${u.memberProfile.lastName || ""}`
                    ) : u.trainerProfile?.firstName ? (
                      `${u.trainerProfile.firstName} ${u.trainerProfile.lastName || ""}`
                    ) : (
                      <span className="text-zinc-600 italic">Brak danych</span>
                    );

                    const gymName = u.memberProfile?.homeGym?.name || (
                      <span className="text-zinc-600 italic">-</span>
                    );

                    return (
                      <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-zinc-500">{u.id}</td>
                        <td className="px-6 py-4 text-white font-medium">{u.email}</td>
                        <td className="px-6 py-4 text-zinc-300">{fullName}</td>
                        <td className="px-6 py-4 text-sky-400 font-semibold">{gymName}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-[10px] rounded-full uppercase font-bold tracking-wider border ${
                              u.role === "ADMIN"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : u.role === "TRAINER"
                                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900 text-xs uppercase text-zinc-500 font-black tracking-widest border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Nazwa</th>
                    <th className="px-6 py-4">Adres</th>
                    <th className="px-6 py-4 text-center">Klienci</th>
                    <th className="px-6 py-4 text-center">Trenerzy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {gyms.map((g) => (
                    <tr key={g.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-zinc-500">{g.id}</td>
                      <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                        {g.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-300 min-w-[200px]">{g.address}</td>
                      <td className="px-6 py-4 text-sky-400 font-bold text-center">
                        {g._count?.members || 0}
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-bold text-center">
                        {g._count?.trainerAssignments || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
