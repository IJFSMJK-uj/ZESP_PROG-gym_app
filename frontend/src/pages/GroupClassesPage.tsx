import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import {
  groupClassesService,
  type GroupClassScheduleItem,
  type GroupClassSchedulePayload,
} from "../api/groupClassesService";
import { gymsService, type GymRoom } from "../api/gymsService";
import { trainersService } from "../api/trainersService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0") + ":00");

const timeToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + (minutes || 0);
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const DAYS_OF_WEEK = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

type Tab = "form" | "schedule";

export const GroupClassesPage = () => {
  const navigate = useNavigate();

  const [managedGyms, setManagedGyms] = useState<any[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<Tab>("form");

  const [groupClasses, setGroupClasses] = useState<GroupClassScheduleItem[]>([]);
  const [groupClassesLoading, setGroupClassesLoading] = useState(false);
  const [groupClassesError, setGroupClassesError] = useState("");
  const [groupClassesSuccess, setGroupClassesSuccess] = useState("");
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

  const [trainers, setTrainers] = useState<any[]>([]);
  const [trainersLoading, setTrainersLoading] = useState(false);

  const [rooms, setRooms] = useState<GymRoom[]>([]);

  const [classForm, setClassForm] = useState({
    name: "",
    instructorIds: [] as number[],
    description: "",
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "09:00",
    capacity: "",
    isActive: true,
    roomId: null as number | null,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authService.getProfile();
        if (profile.error) {
          setError(profile.error);
          return;
        }
        if (profile.role !== "GYM_MANAGER") {
          navigate("/");
          return;
        }
        if (profile.managedGyms && profile.managedGyms.length > 0) {
          setManagedGyms(profile.managedGyms);
          setSelectedGymId(profile.managedGyms[0].id);
        } else {
          setError("Nie zarządzasz żadną siłownią");
        }
      } catch (err) {
        setError("Błąd ładowania profilu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [navigate]);

  useEffect(() => {
    if (selectedGymId) {
      loadGroupClasses();
      loadTrainers();
      loadRooms();
    }
  }, [selectedGymId]);

  const loadTrainers = async () => {
    if (!selectedGymId) return;
    setTrainersLoading(true);
    try {
      const res = await trainersService.getTrainersByGym(selectedGymId);
      if (res?.error) {
        setTrainers([]);
        return;
      }
      const trainersList = res?.trainers || res;
      setTrainers(Array.isArray(trainersList) ? trainersList : []);
    } catch {
      setTrainers([]);
    } finally {
      setTrainersLoading(false);
    }
  };

  const loadRooms = async () => {
    if (!selectedGymId) return;
    const res = await gymsService.getRooms(selectedGymId);
    if (!res.error) setRooms(res);
  };

  const loadGroupClasses = async () => {
    if (!selectedGymId) return;
    setGroupClassesLoading(true);
    setGroupClassesError("");
    try {
      const res = await groupClassesService.getSchedule(selectedGymId);
      if (res.error) {
        setGroupClassesError(res.error);
        return;
      }
      setGroupClasses(res);
    } catch {
      setGroupClassesError("Błąd ładowania grafiku zajęć");
    } finally {
      setGroupClassesLoading(false);
    }
  };

  const resetClassForm = () => {
    setEditingClassId(null);
    setClassForm({
      name: "",
      instructorIds: [],
      description: "",
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "09:00",
      capacity: "",
      isActive: true,
      roomId: null,
    });
  };

  const buildClassPayload = (): GroupClassSchedulePayload | null => {
    setGroupClassesError("");
    setGroupClassesSuccess("");
    if (!classForm.name.trim()) {
      setGroupClassesError("Nazwa zajęć jest wymagana");
      return null;
    }
    const startTime = timeToMinutes(classForm.startTime);
    const endTime = timeToMinutes(classForm.endTime);
    if (startTime >= endTime) {
      setGroupClassesError("Godzina zakończenia musi być późniejsza niż rozpoczęcia");
      return null;
    }
    const capacity = classForm.capacity ? Number(classForm.capacity) : null;
    if (capacity !== null && (!Number.isFinite(capacity) || capacity < 1)) {
      setGroupClassesError("Limit miejsc musi być większy od zera");
      return null;
    }
    return {
      name: classForm.name.trim(),
      instructorIds: classForm.instructorIds,
      description: classForm.description.trim() || null,
      dayOfWeek: classForm.dayOfWeek,
      startTime,
      endTime,
      capacity,
      isActive: classForm.isActive,
      roomId: classForm.roomId,
    };
  };

  const handleSaveGroupClass = async () => {
    if (!selectedGymId) return;
    const payload = buildClassPayload();
    if (!payload) return;
    try {
      const res =
        editingClassId === null
          ? await groupClassesService.createScheduleItem(selectedGymId, payload)
          : await groupClassesService.updateScheduleItem(selectedGymId, editingClassId, payload);
      if (res.error) {
        setGroupClassesError(res.error);
        return;
      }
      setGroupClassesSuccess(editingClassId === null ? "Dodano zajęcia" : "Zaktualizowano zajęcia");
      resetClassForm();
      loadGroupClasses();
    } catch {
      setGroupClassesError("Nie udało się zapisać zajęć");
    }
  };

  const handleEditGroupClass = (item: GroupClassScheduleItem) => {
    setGroupClassesError("");
    setGroupClassesSuccess("");
    setEditingClassId(item.id);
    setClassForm({
      name: item.name,
      instructorIds: item.instructors.map((instr) => instr.assignment.id),
      description: item.description || "",
      dayOfWeek: item.dayOfWeek,
      startTime: minutesToTime(item.startTime),
      endTime: minutesToTime(item.endTime),
      capacity: item.capacity ? String(item.capacity) : "",
      isActive: item.isActive,
      roomId: item.roomId,
    });
    setTab("form");
  };

  const handleDeleteGroupClass = async (classId: number) => {
    if (!selectedGymId) return;
    setGroupClassesError("");
    setGroupClassesSuccess("");
    try {
      const res = await groupClassesService.deleteScheduleItem(selectedGymId, classId);
      if (res.error) {
        setGroupClassesError(res.error);
        return;
      }
      if (editingClassId === classId) resetClassForm();
      setGroupClassesSuccess("Usunięto zajęcia z grafiku");
      loadGroupClasses();
    } catch {
      setGroupClassesError("Nie udało się usunąć zajęć");
    }
  };

  const groupedClasses = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayOfWeek: index + 1,
    items: groupClasses.filter((item) => item.dayOfWeek === index + 1),
  }));

  const selectedGym = managedGyms.find((g) => g.id === selectedGymId);

  if (loading) return <p className="text-white text-center mt-10">Ładowanie...</p>;

  if (error && managedGyms.length === 0) {
    return (
      <div className="w-[90%] mx-auto py-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => navigate("/profile")}>Wróć do profilu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto py-8 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-white font-semibold text-lg">Zajęcia grupowe</span>
        <span className="text-sm text-zinc-500">{selectedGym?.name}</span>
      </div>

      {/* Gym selector */}
      {managedGyms.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400 shrink-0">Siłownia:</span>
          <select
            value={selectedGymId || ""}
            onChange={(e) => setSelectedGymId(Number(e.target.value))}
            className="h-8 rounded-md border border-zinc-700 bg-black text-zinc-100 text-sm px-2 focus:border-sky-500 outline-none cursor-pointer"
          >
            {managedGyms.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedGym && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-2 px-4 py-3 border-b border-zinc-800">
            <button
              onClick={() => setTab("form")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${tab === "form" ? "bg-sky-500 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
            >
              {editingClassId !== null ? "Edytuj zajęcia" : "Dodaj zajęcia"}
            </button>
            <button
              onClick={() => setTab("schedule")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${tab === "schedule" ? "bg-sky-500 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
            >
              Grafik{" "}
              {groupClasses.length > 0 && (
                <span className="ml-1 text-xs opacity-60">{groupClasses.length}</span>
              )}
            </button>
          </div>

          {/* ══ FORM TAB ══════════════════════════════════════════════════════ */}
          {tab === "form" && (
            <div className="p-6 flex flex-col gap-4 text-white">
              {groupClassesError && <div className="text-red-400 text-sm">{groupClassesError}</div>}
              {groupClassesSuccess && (
                <div className="text-emerald-400 text-sm">{groupClassesSuccess}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input
                  value={classForm.name}
                  onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nazwa zajęć"
                  className="border-zinc-700 bg-black text-zinc-100 focus:border-sky-500"
                />
                <Input
                  type="number"
                  min="1"
                  value={classForm.capacity}
                  onChange={(e) => setClassForm((prev) => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Limit miejsc (opcjonalnie)"
                  className="border-zinc-700 bg-black text-zinc-100 focus:border-sky-500"
                />

                <select
                  value={classForm.dayOfWeek}
                  onChange={(e) =>
                    setClassForm((prev) => ({ ...prev, dayOfWeek: Number(e.target.value) }))
                  }
                  className="h-10 rounded-md bg-black text-white border border-zinc-700 px-3 text-sm focus:border-sky-500 outline-none cursor-pointer"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={day} value={index + 1}>
                      {day}
                    </option>
                  ))}
                </select>

                <select
                  value={classForm.startTime}
                  onChange={(e) => setClassForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="h-10 rounded-md bg-black text-white border border-zinc-700 px-3 text-sm focus:border-sky-500 outline-none cursor-pointer"
                >
                  {HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      Start: {hour}
                    </option>
                  ))}
                </select>

                <select
                  value={classForm.endTime}
                  onChange={(e) => setClassForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="h-10 rounded-md bg-black text-white border border-zinc-700 px-3 text-sm focus:border-sky-500 outline-none cursor-pointer"
                >
                  {HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      Koniec: {hour}
                    </option>
                  ))}
                </select>

                {/* Room selector */}
                <select
                  value={classForm.roomId ?? ""}
                  onChange={(e) =>
                    setClassForm((prev) => ({
                      ...prev,
                      roomId: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="h-10 rounded-md bg-black text-white border border-zinc-700 px-3 text-sm focus:border-sky-500 outline-none cursor-pointer"
                >
                  <option value="">Sala — bez przypisania</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                      {room.capacity ? ` (${room.capacity} os.)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trainers */}
              <div>
                <label className="text-xs uppercase text-zinc-400 block mb-2">Trenerzy</label>
                {trainersLoading ? (
                  <p className="text-sm text-zinc-400">Ładowanie trenerów...</p>
                ) : trainers.length === 0 ? (
                  <p className="text-sm text-zinc-500">Brak dostępnych trenerów dla tej siłowni</p>
                ) : (
                  <div className="border border-zinc-700 rounded-xl p-3 max-h-[160px] overflow-y-auto flex flex-col gap-2 bg-black">
                    {trainers.map((trainer: any) => (
                      <label
                        key={trainer.assignmentId}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={classForm.instructorIds.includes(trainer.assignmentId)}
                          onChange={(e) => {
                            const id = trainer.assignmentId;
                            setClassForm((prev) => ({
                              ...prev,
                              instructorIds: e.target.checked
                                ? [...prev.instructorIds, id]
                                : prev.instructorIds.filter((i) => i !== id),
                            }));
                          }}
                        />
                        <span>
                          {trainer.firstName} {trainer.lastName}{" "}
                          <span className="text-zinc-500">({trainer.email})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                value={classForm.description}
                onChange={(e) => setClassForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Opis zajęć (opcjonalnie)"
                className="p-3 bg-black text-white rounded-xl border border-zinc-700 min-h-[90px] w-full text-sm focus:border-sky-500 outline-none"
              />

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={classForm.isActive}
                  onChange={(e) =>
                    setClassForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                />
                Aktywne w grafiku
              </label>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white cursor-pointer"
                  onClick={handleSaveGroupClass}
                >
                  {editingClassId === null ? "Dodaj zajęcia" : "Zapisz zmiany"}
                </Button>
                {editingClassId !== null && (
                  <Button variant="outline" onClick={resetClassForm} className="cursor-pointer">
                    Anuluj edycję
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ══ SCHEDULE TAB ══════════════════════════════════════════════════ */}
          {tab === "schedule" && (
            <div className="p-6 flex flex-col gap-1 text-white">
              {groupClassesError && (
                <div className="text-red-400 text-sm mb-3">{groupClassesError}</div>
              )}
              {groupClassesSuccess && (
                <div className="text-emerald-400 text-sm mb-3">{groupClassesSuccess}</div>
              )}

              {groupClassesLoading ? (
                <p className="text-zinc-500 text-sm">Ładowanie grafiku...</p>
              ) : groupClasses.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">
                  Brak zajęć w grafiku. Dodaj pierwsze zajęcia w zakładce „Dodaj zajęcia".
                </p>
              ) : (
                groupedClasses.map(({ day, dayOfWeek, items }) =>
                  items.length === 0 ? null : (
                    <div key={dayOfWeek} className="border-b border-zinc-800/60 last:border-0 py-3">
                      <h3 className="text-xs uppercase text-zinc-500 font-semibold tracking-wide mb-2">
                        {day}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
                          >
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-zinc-100">
                                  {minutesToTime(item.startTime)}–{minutesToTime(item.endTime)}
                                </span>
                                <span className="text-zinc-300">{item.name}</span>
                                {!item.isActive && (
                                  <span className="text-xs text-zinc-600 italic">nieaktywne</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap text-xs text-zinc-500">
                                {item.room && (
                                  <span className="inline-flex items-center gap-1 text-sky-400/80">
                                    {item.room.name}
                                    {item.room.capacity ? ` · ${item.room.capacity} os.` : ""}
                                  </span>
                                )}
                                {item.instructors?.length > 0 && (
                                  <span>
                                    {item.instructors
                                      .map(
                                        (instr) =>
                                          `${instr.assignment.trainerProfile.firstName} ${instr.assignment.trainerProfile.lastName}`
                                      )
                                      .join(", ")}
                                  </span>
                                )}
                                {item.capacity && <span>limit {item.capacity} miejsc</span>}
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleEditGroupClass(item)}
                                className="text-xs text-zinc-400 hover:text-white cursor-pointer border border-zinc-700 hover:border-zinc-500 rounded-full px-3 py-1 transition-colors"
                              >
                                edytuj
                              </button>
                              <button
                                onClick={() => handleDeleteGroupClass(item.id)}
                                className="text-xs text-red-500/60 hover:text-red-400 cursor-pointer border border-red-900/40 hover:border-red-700/60 rounded-full px-3 py-1 transition-colors"
                              >
                                usuń
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </div>
      )}

      <Button
        variant="outline"
        className="w-fit cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        Powrót do panelu
      </Button>
    </div>
  );
};
