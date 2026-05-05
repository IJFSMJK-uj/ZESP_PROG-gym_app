import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import { gymsService, type OperatingHour } from "../api/gymsService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const timeToMinutes = (timeString: string) => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const DAYS_OF_WEEK = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

export const GymAdminPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [role, setRole] = useState("");
  const [gymName, setGymName] = useState("");
  const [address, setAddress] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const [schedule, setSchedule] = useState<{ dayOfWeek: number; open: string; close: string }[]>(
    DAYS_OF_WEEK.map((_, index) => ({ dayOfWeek: index, open: "", close: "" }))
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (profile.error) {
          setError(profile.error);
          setLoading(false);
          return;
        }

        setRole(profile.role || "");

        if (profile.role !== "GYM_MANAGER") {
          setLoading(false);
          return;
        }

        if (!profile.gym) {
          setError("Konto siłowni nie jest powiązane z żadną siłownią.");
          setLoading(false);
          return;
        }

        const gym = await gymsService.getGymById(profile.gym.id);
        if (gym.error) {
          setError(gym.error);
          setLoading(false);
          return;
        }

        setGymName(gym.name || "");
        setAddress(gym.address || "");
        setAdditionalInfo(gym.additionalInfo || "");

        if (gym.operatingHours && gym.operatingHours.length > 0) {
          const loadedSchedule = DAYS_OF_WEEK.map((_, index) => {
            const dayData = gym.operatingHours.find((h: any) => h.dayOfWeek === index);
            return dayData
              ? {
                  dayOfWeek: index,
                  open: minutesToTime(dayData.openTime),
                  close: minutesToTime(dayData.closeTime),
                }
              : { dayOfWeek: index, open: "", close: "" };
          });
          setSchedule(loadedSchedule);
        }
      } catch {
        setError("Nie udało się pobrać danych siłowni");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  const handleScheduleChange = (dayIndex: number, field: "open" | "close", value: string) => {
    setSchedule((prev) =>
      prev.map((day) => (day.dayOfWeek === dayIndex ? { ...day, [field]: value } : day))
    );
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    const operatingHoursToSave: OperatingHour[] = schedule
      .filter((day) => day.open !== "" && day.close !== "")
      .map((day) => ({
        dayOfWeek: day.dayOfWeek,
        openTime: timeToMinutes(day.open),
        closeTime: timeToMinutes(day.close),
      }));

    try {
      const data = await gymsService.updateMyGym({
        address,
        operatingHours: operatingHoursToSave,
        additionalInfo,
      });

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess("Dane siłowni zostały zaktualizowane pomyślnie.");
      }
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-white mb-4">Musisz się zalogować, aby zarządzać siłownią.</p>
        <Button variant="outline" onClick={() => navigate("/auth")} className="cursor-pointer">
          Przejdź do logowania
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white">Ładowanie danych siłowni...</p>
      </div>
    );
  }

  if (role !== "GYM_MANAGER") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-red-400 mb-4 text-center">
          Tylko konto siłowni ma dostęp do tej strony.
        </p>
        <Button variant="outline" onClick={() => navigate("/")} className="cursor-pointer">
          Powrót
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 flex justify-center">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <Card className="bg-black border border-zinc-800 rounded-3xl">
          <CardHeader>
            <CardTitle>Ustawienia siłowni</CardTitle>
            <CardDescription>
              Zarządzaj godzinami otwarcia i lokalizacją siłowni
              {gymName ? `: ${gymName}` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {error && (
              <div className="text-sm text-red-300 p-3 bg-red-500/10 rounded-xl">{error}</div>
            )}
            {success && (
              <div className="text-sm text-emerald-300 p-3 bg-emerald-500/10 rounded-xl">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400">Adres</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="np. ul. Sportowa 1, Warszawa"
                className="w-full border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs uppercase text-zinc-400">Godziny otwarcia</label>
              <div className="flex flex-col gap-3">
                {schedule.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className="grid grid-cols-[100px_1fr_1fr] items-center gap-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl"
                  >
                    <span className="text-sm text-zinc-300">{DAYS_OF_WEEK[day.dayOfWeek]}</span>
                    <Input
                      type="time"
                      value={day.open}
                      onChange={(e) => handleScheduleChange(day.dayOfWeek, "open", e.target.value)}
                      className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-sky-500 transition-colors"
                    />
                    <Input
                      type="time"
                      value={day.close}
                      onChange={(e) => handleScheduleChange(day.dayOfWeek, "close", e.target.value)}
                      className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-sky-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400">
                Dodatkowe informacje (wyjątki, święta, przerwy)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="np. W święta państwowe siłownia jest nieczynna."
                className="w-full min-h-[100px] p-3 rounded-md border border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-sky-500 transition-colors outline-none resize-y"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1 cursor-pointer">
                {saving ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
                className="cursor-pointer"
              >
                Anuluj
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
