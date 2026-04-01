import { useState } from "react";
import { Button } from "../components/ui/button";
import { availabilityService } from "../api/availabilityService";

const days = [
  { value: 0, label: "Niedziela" },
  { value: 1, label: "Poniedziałek" },
  { value: 2, label: "Wtorek" },
  { value: 3, label: "Środa" },
  { value: 4, label: "Czwartek" },
  { value: 5, label: "Piątek" },
  { value: 6, label: "Sobota" },
];

export default function AvailabilityForm({ gyms, onAdd }: any) {
  const [gymId, setGymId] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(12);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (startHour >= endHour) {
      setError("Godzina rozpoczęcia musi być mniejsza niż zakończenia");
      return;
    }

    setLoading(true);

    try {
      const res = await availabilityService.create({
        gymId: gymId ? Number(gymId) : null,
        dayOfWeek,
        startHour,
        endHour,
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      onAdd();
    } catch {
      setError("Błąd sieci");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 rounded-2xl bg-black border border-zinc-800"
    >
      {error && <div className="text-sm text-red-300 p-2 bg-red-500/10 rounded-md">{error}</div>}

      {/* SIŁOWNIA */}
      <div className="space-y-1">
        <label className="text-xs uppercase text-zinc-400">Siłownia</label>
        <select
          value={gymId}
          onChange={(e) => setGymId(e.target.value)}
          className="w-full p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
        >
          <option value="">Ogólna dostępność</option>
          {gyms.map((g: any) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* DZIEŃ */}
      <div className="space-y-1">
        <label className="text-xs uppercase text-zinc-400">Dzień tygodnia</label>
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(Number(e.target.value))}
          className="w-full p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
        >
          {days.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* GODZINY */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={startHour}
          onChange={(e) => setStartHour(Number(e.target.value))}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <option key={i} value={i}>
              {i}:00
            </option>
          ))}
        </select>

        <select
          value={endHour}
          onChange={(e) => setEndHour(Number(e.target.value))}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}:00
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center">
        <Button type="submit" variant="outline" className="w-1/2 cursor-pointer">
          {loading ? "Dodawanie..." : "Dodaj dostępność"}
        </Button>
      </div>
    </form>
  );
}
