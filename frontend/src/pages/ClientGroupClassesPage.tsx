import { use, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUpcomingDate, groupClassesService } from "../api/groupClassesService";
import { Button } from "../components/ui/button";
import { useAuth } from "@/context/AuthContext";

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

interface GroupClass {
  id: number;
  name: string;
  description?: string;
  dayOfWeek: number;
  startTime: number;
  endTime: number;
  capacity?: number;
  enrolledCount: number;
  isEnrolled: boolean;
  room?: { name: string } | null;
  instructors: {
    assignment: {
      trainerProfile: { firstName?: string; lastName?: string };
    };
  }[];
}

type ClassWithDate = GroupClass & { upcomingDate: Date };

export const ClientGroupClassesPage = () => {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const { user } = useAuth();

  const isMyGym = user?.gymId === Number(gymId);

  const load = async () => {
    const data = await groupClassesService.getGymClasses(Number(gymId));
    if (data.error) {
      setError(data.error);
      setLoading(false);
      return;
    }
    setClasses(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [gymId]);

  const upcomingClasses: ClassWithDate[] = classes
    .map((c) => ({ ...c, upcomingDate: getUpcomingDate(c.dayOfWeek, c.startTime) }))
    .filter((c): c is ClassWithDate => c.upcomingDate !== null)
    .sort((a, b) => a.upcomingDate.getTime() - b.upcomingDate.getTime());

  const groupedByDate = upcomingClasses.reduce(
    (acc, cls) => {
      const d = cls.upcomingDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(cls);
      return acc;
    },
    {} as Record<string, ClassWithDate[]>
  );

  const isEnrollmentOpen = (upcomingDate: Date): boolean => {
    const hoursUntil = (upcomingDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 48;
  };

  const handleEnroll = async (cls: ClassWithDate) => {
    setActionLoading(cls.id);
    setActionMessage("");
    const res = await groupClassesService.enrollInClass(Number(gymId), cls.id, cls.upcomingDate);
    if (res.error) {
      setActionMessage(res.error);
    } else {
      setActionMessage("Zapisano na zajęcia!");
      setClasses((prev) =>
        prev.map((c) =>
          c.id === cls.id ? { ...c, isEnrolled: true, enrolledCount: c.enrolledCount + 1 } : c
        )
      );
    }
    setActionLoading(null);
  };

  const handleUnenroll = async (cls: ClassWithDate) => {
    if (!window.confirm("Czy na pewno chcesz się wypisać z tych zajęć?")) return;
    setActionLoading(cls.id);
    setActionMessage("");
    const res = await groupClassesService.unenrollFromClass(
      Number(gymId),
      cls.id,
      cls.upcomingDate
    );
    if (res.error) {
      setActionMessage(res.error);
    } else {
      setActionMessage("Wypisano z zajęć.");
      setClasses((prev) =>
        prev.map((c) =>
          c.id === cls.id
            ? { ...c, isEnrolled: false, enrolledCount: Math.max(c.enrolledCount - 1, 0) }
            : c
        )
      );
    }
    setActionLoading(null);
  };

  if (loading) return <p className="text-white p-8 text-center">Ładowanie grafiku...</p>;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Wróć
        </Button>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Nadchodzące zajęcia</h1>
        {/* <Button variant="outline" onClick={() => navigate(-1)} className="cursor-pointer text-xs">
          Wróć
        </Button> */}
      </div>

      {actionMessage && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs text-center ${
            actionMessage.includes("Zapisano")
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {actionMessage}
        </div>
      )}

      {upcomingClasses.length === 0 ? (
        <p className="text-zinc-400 text-center py-12">Brak nadchodzących zajęć w ciągu 7 dni.</p>
      ) : (
        <div className="flex flex-col">
          {Object.entries(groupedByDate).map(([dateKey, items]) => (
            <div key={dateKey}>
              <h2 className="text-sky-400 font-semibold text-xs uppercase tracking-widest mb-3 capitalize">
                {formatDate(items[0].upcomingDate)}
              </h2>
              <div className="flex flex-col gap-2 mb-6">
                {items.map((cls) => {
                  const isFull = cls.capacity != null && cls.enrolledCount >= cls.capacity;
                  const isLoading = actionLoading === cls.id;
                  const enrollOpen = isEnrollmentOpen(cls.upcomingDate);

                  const instructorNames = cls.instructors
                    .map((i) => {
                      const p = i.assignment.trainerProfile;
                      return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
                    })
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <div
                      key={cls.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        cls.isEnrolled
                          ? "bg-sky-500/10 border-sky-500/50"
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-medium">{cls.name}</p>
                          {cls.isEnrolled && (
                            <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">
                              Zapisany
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          {minutesToTime(cls.startTime)} – {minutesToTime(cls.endTime)}
                          {instructorNames && ` · Prowadzi: ${instructorNames}`}
                          {cls.room && ` · Sala: ${cls.room.name}`}
                          {cls.capacity != null && (
                            <span className={isFull ? " text-red-400" : ""}>
                              {` · ${cls.enrolledCount}/${cls.capacity} miejsc`}
                            </span>
                          )}
                        </p>
                        {!enrollOpen && !cls.isEnrolled && (
                          <p className="text-zinc-500 text-xs mt-1">
                            Zapisy otwierają się 48h przed zajęciami
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 ml-4 w-24 flex justify-end">
                        {!isMyGym ? (
                          <span className="text-xs text-zinc-600 text-center">
                            Nie twoja siłownia
                          </span>
                        ) : cls.isEnrolled ? (
                          <button
                            onClick={() => handleUnenroll(cls)}
                            disabled={isLoading}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/60 rounded-full px-3 py-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isLoading ? "..." : "Wypisz się"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnroll(cls)}
                            disabled={isLoading || isFull || !enrollOpen}
                            className={`w-full text-xs rounded-full px-3 py-1 transition-colors cursor-pointer disabled:opacity-50 ${
                              isFull
                                ? "text-zinc-500 border border-zinc-700 cursor-not-allowed"
                                : !enrollOpen
                                  ? "text-zinc-600 border border-zinc-800 cursor-not-allowed"
                                  : "text-sky-400 hover:text-sky-300 border border-sky-900/40 hover:border-sky-700/60"
                            }`}
                          >
                            {isLoading
                              ? "..."
                              : isFull
                                ? "Brak miejsc"
                                : !enrollOpen
                                  ? "Wkrótce"
                                  : "Zapisz się"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
