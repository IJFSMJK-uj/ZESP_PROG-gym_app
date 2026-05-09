import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import {
  groupClassesService,
  type GroupClassScheduleItem,
  type GroupClassSchedulePayload,
} from "../api/groupClassesService";
import { trainersService } from "../api/trainersService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

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

export const GroupClassesPage = () => {
  const navigate = useNavigate();

  const [managedGyms, setManagedGyms] = useState<any[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [groupClasses, setGroupClasses] = useState<GroupClassScheduleItem[]>([]);
  const [groupClassesLoading, setGroupClassesLoading] = useState(false);
  const [groupClassesError, setGroupClassesError] = useState("");
  const [groupClassesSuccess, setGroupClassesSuccess] = useState("");
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

  const [trainers, setTrainers] = useState<any[]>([]);
  const [trainersLoading, setTrainersLoading] = useState(false);

  const [classForm, setClassForm] = useState({
    name: "",
    instructorIds: [] as number[],
    description: "",
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "09:00",
    capacity: "",
    isActive: true,
  });

  // Load managed gyms
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

  // Load group classes when gym selected
  useEffect(() => {
    if (selectedGymId) {
      loadGroupClasses();
      loadTrainers();
    }
  }, [selectedGymId]);

  const loadTrainers = async () => {
    if (!selectedGymId) return;
    setTrainersLoading(true);

    try {
      const res = await trainersService.getTrainersByGym(selectedGymId);
      if (res?.error) {
        console.error(res.error);
        setTrainers([]);
        return;
      }

      // API zwraca { gym, trainers }
      const trainersList = res?.trainers || res;
      setTrainers(Array.isArray(trainersList) ? trainersList : []);
    } catch (error) {
      console.error("Błąd ładowania trenerów", error);
      setTrainers([]);
    } finally {
      setTrainersLoading(false);
    }
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
    });
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
      <div className="p-8 flex justify-center">
        <Card className="bg-black border border-zinc-800 rounded-3xl w-full max-w-md">
          <CardHeader>
            <CardTitle>Zajęcia grupowe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-400">{error}</p>
            <Button onClick={() => navigate("/profile")} className="mt-4 w-full">
              Wróć do profilu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 flex justify-center">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <Card className="bg-black border border-zinc-800 rounded-3xl">
          <CardHeader>
            <CardTitle>Zajęcia grupowe</CardTitle>
            <CardDescription>Zarządzaj zajęciami dla swoich siłowni</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5 text-white">
            {/* SELECT GYM */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase text-zinc-400">Wybierz siłownię</label>
              <select
                value={selectedGymId || ""}
                onChange={(e) => setSelectedGymId(Number(e.target.value))}
                className="bg-zinc-900 text-white p-3 rounded-xl border border-zinc-700"
              >
                {managedGyms.map((gym) => (
                  <option key={gym.id} value={gym.id}>
                    {gym.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedGym && (
              <>
                <div className="border-t border-zinc-800 pt-4">
                  <h3 className="font-semibold mb-4">Dodaj/Edytuj zajęcia</h3>

                  {groupClassesError && (
                    <div className="text-red-400 mb-3 text-sm">{groupClassesError}</div>
                  )}
                  {groupClassesSuccess && (
                    <div className="text-green-400 mb-3 text-sm">{groupClassesSuccess}</div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <Input
                      value={classForm.name}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nazwa zajęć"
                    />

                    <Input
                      type="number"
                      min="1"
                      value={classForm.capacity}
                      onChange={(e) =>
                        setClassForm((prev) => ({ ...prev, capacity: e.target.value }))
                      }
                      placeholder="Limit miejsc"
                    />

                    <select
                      value={classForm.dayOfWeek}
                      onChange={(e) =>
                        setClassForm((prev) => ({ ...prev, dayOfWeek: Number(e.target.value) }))
                      }
                      className="bg-zinc-900 text-white p-2 rounded border border-zinc-700"
                    >
                      {DAYS_OF_WEEK.map((day, index) => (
                        <option key={day} value={index + 1}>
                          {day}
                        </option>
                      ))}
                    </select>

                    <select
                      value={classForm.startTime}
                      onChange={(e) =>
                        setClassForm((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                      className="bg-zinc-900 text-white p-2 rounded border border-zinc-700"
                    >
                      {HOURS.map((hour) => (
                        <option key={hour} value={hour}>
                          Start: {hour}
                        </option>
                      ))}
                    </select>

                    <select
                      value={classForm.endTime}
                      onChange={(e) =>
                        setClassForm((prev) => ({ ...prev, endTime: e.target.value }))
                      }
                      className="bg-zinc-900 text-white p-2 rounded border border-zinc-700"
                    >
                      {HOURS.map((hour) => (
                        <option key={hour} value={hour}>
                          Koniec: {hour}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs uppercase text-zinc-400 block mb-2">Trenerzy</label>
                    {trainersLoading ? (
                      <p className="text-sm text-zinc-400">Ładowanie trenerów...</p>
                    ) : trainers.length === 0 ? (
                      <p className="text-sm text-zinc-400">
                        Brak dostępnych trenerów dla tej siłowni
                      </p>
                    ) : (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 max-h-[150px] overflow-y-auto flex flex-col gap-2">
                        {trainers.map((trainer: any) => (
                          <label
                            key={trainer.assignmentId}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={classForm.instructorIds.includes(trainer.assignmentId)}
                              onChange={(e) => {
                                const assignmentId = trainer.assignmentId;
                                if (e.target.checked) {
                                  setClassForm((prev) => ({
                                    ...prev,
                                    instructorIds: [...prev.instructorIds, assignmentId],
                                  }));
                                } else {
                                  setClassForm((prev) => ({
                                    ...prev,
                                    instructorIds: prev.instructorIds.filter(
                                      (id) => id !== assignmentId
                                    ),
                                  }));
                                }
                              }}
                            />
                            <span>
                              {trainer.firstName} {trainer.lastName} ({trainer.email})
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    value={classForm.description}
                    onChange={(e) =>
                      setClassForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Opis zajęć"
                    className="p-3 bg-zinc-900 text-white rounded-xl border border-zinc-700 min-h-[90px] w-full mb-4"
                  />

                  <label className="flex items-center gap-2 text-sm text-zinc-300 mb-4">
                    <input
                      type="checkbox"
                      checked={classForm.isActive}
                      onChange={(e) =>
                        setClassForm((prev) => ({ ...prev, isActive: e.target.checked }))
                      }
                    />
                    Aktywne w grafiku
                  </label>

                  <div className="flex gap-3 mb-4">
                    <Button
                      className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
                      onClick={handleSaveGroupClass}
                    >
                      {editingClassId === null ? "Dodaj zajęcia" : "Zapisz zmiany"}
                    </Button>

                    {editingClassId !== null && (
                      <Button variant="outline" onClick={resetClassForm}>
                        Anuluj edycję
                      </Button>
                    )}
                  </div>
                </div>

                {/* CLASSES LIST */}
                <div className="border-t border-zinc-800 pt-4">
                  <h3 className="font-semibold mb-4">Grafik zajęć</h3>

                  <div className="flex flex-col gap-4">
                    {groupClassesLoading ? (
                      <p>Ładowanie grafiku...</p>
                    ) : groupClasses.length === 0 ? (
                      <p className="text-zinc-400">Brak zajęć w grafiku</p>
                    ) : (
                      groupedClasses.map(({ day, dayOfWeek, items }) => (
                        <div key={dayOfWeek} className="border-t border-zinc-800 pt-3">
                          <h3 className="font-semibold mb-2">{day}</h3>

                          {items.length === 0 ? (
                            <p className="text-sm text-zinc-500">Brak zajęć</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3"
                                >
                                  <div>
                                    <div className="font-medium">
                                      {minutesToTime(item.startTime)} -{" "}
                                      {minutesToTime(item.endTime)} {item.name}
                                    </div>
                                    <div className="text-sm text-zinc-400">
                                      {item.instructors?.length > 0
                                        ? item.instructors
                                            .map(
                                              (instr) =>
                                                `${instr.assignment.trainerProfile.firstName} ${instr.assignment.trainerProfile.lastName}`
                                            )
                                            .join(", ")
                                        : "Bez prowadzącego"}
                                      {item.capacity ? ` · limit ${item.capacity} miejsc` : ""}
                                      {!item.isActive ? " · nieaktywne" : ""}
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleEditGroupClass(item)}
                                    >
                                      Edytuj
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleDeleteGroupClass(item.id)}
                                    >
                                      Usuń
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>
              Wróć do profilu
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
