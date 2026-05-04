import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface Slot {
  startHour: number;
  endHour: number;
  available: boolean;
  gym?: {
    id: number;
    name: string;
  } | null;
}

const daysMap: Record<number, string> = {
  1: "Poniedziałek",
  2: "Wtorek",
  3: "Środa",
  4: "Czwartek",
  5: "Piątek",
  6: "Sobota",
  0: "Niedziela",
};
const orderedDays = [1, 2, 3, 4, 5, 6, 0];

// 🔹 start tygodnia (poniedziałek)
function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function TrainerSchedulePage() {
  const { assignmentId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Record<number, Slot[]>>({});
  const [trainerName, setTrainerName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({});
  const [booking, setBooking] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [nextAvailable, setNextAvailable] = useState<string | null>(null);

  const findNextAvailable = (schedule: Record<number, Slot[]>) => {
    for (let day = 0; day < 7; day++) {
      const date = new Date(weekStart);
      const offset = day === 0 ? 6 : day - 1;
      date.setDate(weekStart.getDate() + offset);

      const slots = schedule[day] || [];

      for (const slot of slots) {
        if (!slot.available) continue;
        if (isPastSlot(date, slot.startHour)) continue;

        return `${date.toLocaleDateString()} ${slot.startHour}:00`;
      }
    }

    return null;
  };

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:3001/api/trainer-schedule/${assignmentId}?weekStart=${weekStart.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Błąd pobierania harmonogramu:", data.error);
        return;
      }

      setSchedule(data.schedule || {});
      setTrainerName(data.trainer?.username || data.trainer?.email || "Trener");
      setTrainerEmail(data.trainer?.email || "");
      setNextAvailable(findNextAvailable(data.schedule || {}));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/auth");
      return;
    }

    if (isAuthenticated) {
      fetchSchedule();
    }
  }, [assignmentId, isAuthenticated, weekStart]);
  useEffect(() => {
    const initial: Record<number, boolean> = {};

    Object.entries(daysMap).forEach(([day]) => {
      const dayNum = Number(day);

      const date = new Date(weekStart);
      const offset = dayNum === 0 ? 6 : dayNum - 1;
      date.setDate(weekStart.getDate() + offset);

      const slots = (schedule[dayNum] || []).sort((a, b) => a.startHour - b.startHour);

      const hasFutureSlots = slots.some((slot) => {
        return !isPastSlot(date, slot.startHour);
      });

      initial[dayNum] = hasFutureSlots;
    });

    setOpenDays(initial);
  }, [schedule, weekStart]);

  const MAX_WEEKS = 4;
  const todayStart = getStartOfWeek(new Date());

  const weekDiff = (weekStart.getTime() - todayStart.getTime()) / (7 * 24 * 60 * 60 * 1000);

  const isFutureLimit = weekDiff >= MAX_WEEKS;

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + 7);
    setWeekStart(d);
  };

  const prevWeek = () => {
    const currentWeekStart = getStartOfWeek(new Date());

    const newWeek = new Date(weekStart);
    newWeek.setDate(weekStart.getDate() - 7);

    if (newWeek < currentWeekStart) return;

    setWeekStart(newWeek);
  };
  const isPastWeek = new Date(weekStart).getTime() === getStartOfWeek(new Date()).getTime();
  const isPastSlot = (date: Date, hour: number) => {
    const now = new Date();

    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);

    // blokada: teraz + 1h
    const minTime = new Date(now.getTime() + 60 * 60 * 1000);

    return slotTime < minTime;
  };

  if (isAuthenticated === false) return null;

  if (loading) {
    return <div className="text-center mt-20 text-white">Ładowanie harmonogramu...</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4">
      <Card className="w-full max-w-lg bg-black border border-zinc-800 rounded-3xl">
        <CardHeader className="pt-5 space-y-5">
          {/* TYTUŁ STRONY */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Rezerwacja treningu</h1>
            <p className="text-sm text-zinc-500">Wybierz dostępny termin u trenera</p>
          </div>
          <div className="border-t border-zinc-800 my-2" />
          {/* AVATAR + INFO */}
          <div className="flex items-center gap-4 pt-3 justify-center">
            {/* AVATAR */}
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sky-400 font-bold text-2xl uppercase">
              {(trainerName || "T")[0]}
            </div>

            {/* INFO */}
            <div className="text-left">
              <CardTitle className="text-white text-xl">{trainerName || "Trener"}</CardTitle>

              <CardDescription className="text-zinc-500">{trainerEmail || ""}</CardDescription>
            </div>
          </div>
          {nextAvailable ? (
            <div className="text-center text-xs text-emerald-400">
              Najbliższy wolny: {nextAvailable}
            </div>
          ) : (
            <div className="text-center text-xs text-zinc-500">
              Brak wolnych terminów w tym tygodniu
            </div>
          )}

          <div className="flex items-center justify-between mt-4 px-2">
            <Button
              size="icon"
              variant="outline"
              onClick={prevWeek}
              disabled={isPastWeek}
              className="rounded-full w-9 h-9"
            >
              ←
            </Button>

            <div className="flex flex-col items-center">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Tydzień</span>

              <span className="text-white text-lg font-semibold">
                {weekStart.toLocaleDateString()}
                <span className="text-zinc-400 mx-2">—</span>
                {new Date(
                  new Date(weekStart).setDate(weekStart.getDate() + 6)
                ).toLocaleDateString()}
              </span>
            </div>

            <Button
              size="icon"
              variant="outline"
              onClick={nextWeek}
              disabled={isFutureLimit}
              className="rounded-full w-9 h-9"
            >
              →
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {orderedDays.map((dayNum) => {
            const label = daysMap[dayNum];
            const slots = schedule[dayNum] || [];
            const isOpen = openDays[dayNum] ?? true;

            const date = new Date(weekStart);
            const offset = dayNum === 0 ? 6 : dayNum - 1;
            date.setDate(weekStart.getDate() + offset);
            const isToday = new Date().toDateString() === date.toDateString();
            const availableCount = slots.filter(
              (s) => s.available && !isPastSlot(date, s.startHour)
            ).length;

            return (
              <div
                key={dayNum}
                className={`space-y-3 p-4 rounded-2xl border ${
                  isToday ? "bg-sky-500/5 border-sky-500/30" : "bg-zinc-950 border-zinc-800"
                }`}
              >
                {/* HEADER */}
                <button
                  onClick={() =>
                    setOpenDays((prev) => ({
                      ...prev,
                      [dayNum]: !isOpen,
                    }))
                  }
                  className="w-full flex justify-between items-center"
                >
                  <div className="text-left">
                    <p className="text-white font-semibold">
                      {label}
                      {availableCount > 0 && (
                        <span className="ml-2 text-sky-400 text-xs">({availableCount})</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">{date.toLocaleDateString()}</p>
                  </div>

                  <span className="text-zinc-500 text-lg">{isOpen ? "−" : "+"}</span>
                </button>

                {/* CONTENT */}
                {isOpen && (
                  <div className="space-y-2">
                    {slots.length === 0 && (
                      <div className="text-sm text-zinc-500 p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                        Brak dostępności w tym dniu
                      </div>
                    )}

                    {slots.map((slot, idx) => {
                      const disabled = !slot.available || isPastSlot(date, slot.startHour);
                      const slotDate = new Date(date);
                      slotDate.setHours(slot.startHour, 0, 0, 0);

                      const bookingKey = slotDate.toISOString();

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-sky-500/40 transition"
                        >
                          <div className="flex flex-col">
                            <span className="text-white font-medium text-sm">
                              {slot.startHour}:00 - {slot.endHour}:00
                            </span>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md w-fit mt-1 ${
                                slot.gym
                                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md w-fit mt-1 flex items-center gap-1 ${
                                  slot.gym
                                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                }`}
                              >
                                {slot.gym ? "🏋️ " : "🌐 "}
                                {slot.gym ? slot.gym.name : "Ogólna"}
                              </span>
                            </span>
                          </div>
                          {successKey === bookingKey && (
                            <div className="text-emerald-400 text-xs mt-1">
                              Termin zarezerwowany
                            </div>
                          )}

                          {errorKey === bookingKey && (
                            <span className="text-red-400 text-xs mt-1">
                              Termin został już zarezerwowany
                            </span>
                          )}

                          <Button
                            disabled={disabled || booking === bookingKey}
                            size="sm"
                            className="cursor-pointer"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("token");

                                if (!token) {
                                  navigate("/auth");
                                  return;
                                }
                                setBooking(bookingKey);
                                const res = await fetch(
                                  "http://localhost:3001/api/trainer-schedule",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      assignmentId: Number(assignmentId),
                                      date: date.toISOString(),
                                      startHour: slot.startHour,
                                      endHour: slot.endHour,
                                    }),
                                  }
                                );

                                if (!res.ok) {
                                  setErrorKey(bookingKey);
                                  await fetchSchedule();
                                  setTimeout(() => setErrorKey(null), 3000);
                                  return;
                                }

                                await fetchSchedule();
                                setSuccessKey(bookingKey);
                                setTimeout(() => setSuccessKey(null), 3000);
                              } catch (err) {
                                console.error(err);
                                alert("Błąd rezerwacji");
                              } finally {
                                setBooking(null);
                              }
                            }}
                          >
                            {booking === bookingKey
                              ? "Rezerwuję..."
                              : disabled
                                ? "Niedostępne"
                                : "Rezerwuj"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
