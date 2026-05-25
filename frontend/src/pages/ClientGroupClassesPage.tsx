import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { groupClassesService, type GroupClassScheduleItem } from "../api/groupClassesService";
import { Button } from "../components/ui/button";

const DAYS_OF_WEEK = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export const ClientGroupClassesPage = () => {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<GroupClassScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const data = await groupClassesService.getGymClasses(Number(gymId));
      if (data.error) setError(data.error);
      else setClasses(data);
      setLoading(false);
    };
    load();
  }, [gymId]);

  const groupedClasses = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayOfWeek: index + 1,
    items: classes.filter((c) => c.dayOfWeek === index + 1 && c.isActive),
  }));

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
        <h1 className="text-2xl font-bold text-white">Grafik zajęć grupowych</h1>
        <Button variant="outline" onClick={() => navigate(-1)} className="cursor-pointer text-xs">
          Wróć
        </Button>
      </div>

      {classes.length === 0 ? (
        <p className="text-zinc-400 text-center py-12">Brak zaplanowanych zajęć grupowych.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedClasses.map(({ day, dayOfWeek, items }) => {
            if (items.length === 0) return null;
            return (
              <div key={dayOfWeek}>
                <h2 className="text-sky-400 font-semibold text-xs uppercase tracking-widest mb-3">
                  {day}
                </h2>
                <div className="flex flex-col gap-2">
                  {items.map((cls) => {
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
                        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-sky-400 font-mono text-sm w-28 shrink-0">
                            {minutesToTime(cls.startTime)} – {minutesToTime(cls.endTime)}
                          </span>
                          <div>
                            <p className="text-white font-medium">{cls.name}</p>
                            <p className="text-zinc-400 text-xs mt-0.5 flex flex-wrap gap-2">
                              {instructorNames && <span>Prowadzi: {instructorNames}</span>}
                              {cls.room && <span>· Sala: {cls.room.name}</span>}
                              {cls.capacity && <span>· Maks. {cls.capacity} osób</span>}
                            </p>
                            {cls.description && (
                              <p className="text-zinc-500 text-xs mt-1">{cls.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
