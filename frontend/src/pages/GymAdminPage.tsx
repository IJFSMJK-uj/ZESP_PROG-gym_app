import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import { gymsService, type OperatingHour, type GymRoom } from "../api/gymsService";
import { groupClassesService, type GroupClassScheduleItem } from "../api/groupClassesService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useParams } from "react-router-dom";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0") + ":00");

const timeToMinutes = (timeString: string) => {
  const [hours] = timeString.split(":").map(Number);
  return hours * 60;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  return `${h}:00`;
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

const FlyTo = ({ lat, lng }: any) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 15);
  }, [lat, lng]);
  return null;
};

const normalizePhone = (phone: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("48")) digits = digits.slice(2);
  return digits;
};

type Tab = "settings" | "rooms" | "roomOccupancy" | "stats";

const DAY_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const fmt = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export const GymAdminPage = () => {
  const navigate = useNavigate();
  const { gymId } = useParams();

  const [role, setRole] = useState("");
  const [gymName, setGymName] = useState("");
  const [tab, setTab] = useState<Tab>("settings");

  // Settings
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [schedule, setSchedule] = useState(
    DAYS_OF_WEEK.map((_, index) => ({ dayOfWeek: index, open: "", close: "" }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Rooms
  const [rooms, setRooms] = useState<GymRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomFlash, setRoomFlash] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [editingRoom, setEditingRoom] = useState<GymRoom | null>(null);
  const [roomFormName, setRoomFormName] = useState("");
  const [roomFormCapacity, setRoomFormCapacity] = useState("");
  const [roomFormError, setRoomFormError] = useState("");
  const [roomFormLoading, setRoomFormLoading] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);

  // Room occupancy
  const [occupancyClasses, setScheduleClasses] = useState<GroupClassScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const [loading, setLoading] = useState(true);

  const showRoomFlash = (type: "ok" | "err", msg: string) => {
    setRoomFlash({ type, msg });
    setTimeout(() => setRoomFlash(null), 3000);
  };

  const loadRooms = async () => {
    if (!gymId) return;
    setRoomsLoading(true);
    const data = await gymsService.getRooms(Number(gymId));
    if (!data.error) setRooms(data);
    setRoomsLoading(false);
  };

  const loadStats = async () => {
    if (!gymId) return;
    setStatsLoading(true);
    setStatsError("");
    try {
      const res = await gymsService.getGymStats(Number(gymId));
      setStats(res);
    } catch {
      setStatsError("Błąd ładowania statystyk");
    } finally {
      setStatsLoading(false);
    }
  };

  const loadScheduleClasses = async () => {
    if (!gymId) return;
    setScheduleLoading(true);
    setScheduleError("");
    const res = await groupClassesService.getSchedule(Number(gymId));
    if (res.error) setScheduleError(res.error);
    else setScheduleClasses(res as GroupClassScheduleItem[]);
    setScheduleLoading(false);
  };

  useEffect(() => {
    if (tab === "stats") loadStats();
    if (tab === "rooms") loadRooms();
    if (tab === "roomOccupancy") {
      loadRooms();
      loadScheduleClasses();
    }
  }, [tab]);

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await authService.getProfile();
        setRole(profile.role || "");
        if (profile.role !== "GYM_MANAGER") {
          navigate("/");
          return;
        }
        if (!gymId) {
          setError("Brak ID siłowni");
          return;
        }
        const gym = await gymsService.getGymById(gymId);
        setGymName(gym.name || "");
        setAddress(gym.address || "");
        setEmail(gym.email || "");
        setPhoneNumber(gym.phoneNumber || "");
        setAdditionalInfo(gym.additionalInfo || "");
        setDescription(gym.description || "");
        setLat(gym.lat || null);
        setLng(gym.lng || null);
        if (gym.operatingHours) {
          const loaded = DAYS_OF_WEEK.map((_, index) => {
            const d = gym.operatingHours.find((h: any) => h.dayOfWeek === index + 1);
            return d
              ? {
                  dayOfWeek: index,
                  open: minutesToTime(d.openTime),
                  close: minutesToTime(d.closeTime),
                }
              : { dayOfWeek: index, open: "", close: "" };
          });
          setSchedule(loaded);
        }
        if (gym.rooms) setRooms(gym.rooms);
      } catch {
        setError("Błąd ładowania");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [gymId]);

  const handleSearchAddress = async () => {
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(address)}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const first = data[0];
        const newLat = parseFloat(first.lat);
        const newLng = parseFloat(first.lon);
        setLat(newLat);
        setLng(newLng);
        if (first.address) {
          const a = first.address;
          const shortAddress = [a.road, a.house_number, a.postcode, a.city || a.town || a.village]
            .filter(Boolean)
            .join(", ");
          setAddress(shortAddress.length > 0 ? shortAddress : first.display_name);
        } else {
          setAddress(first.display_name);
        }
      } else {
        setError("Nie znaleziono adresu");
        setSuccess("");
      }
    } catch {
      setError("Błąd wyszukiwania");
    }
  };

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data.display_name) {
        const a = data.address;
        const shortAddress = [a.road, a.house_number, a.postcode, a.city || a.town || a.village]
          .filter(Boolean)
          .join(", ");
        setAddress(shortAddress);
      }
    } catch {}
  };

  const handleScheduleChange = (dayIndex: number, field: "open" | "close", value: string) => {
    setSchedule((prev) =>
      prev.map((day) => (day.dayOfWeek === dayIndex ? { ...day, [field]: value } : day))
    );
  };

  const validate = () => {
    setError("");
    setSuccess("");
    if (!address) {
      setError("Adres jest wymagany");
      return false;
    }
    if (!email) {
      setError("Email jest wymagany");
      return false;
    }
    if (!phoneNumber) {
      setError("Numer telefonu jest wymagany");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Nieprawidłowy email");
      return false;
    }
    if (!/^[0-9]{9}$/.test(normalizePhone(phoneNumber))) {
      setError("Nieprawidłowy numer telefonu (np. 123456789)");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    if (!validate()) return;
    setSaving(true);
    const operatingHours: OperatingHour[] = schedule
      .filter((d) => d.open && d.close)
      .map((d) => ({
        dayOfWeek: d.dayOfWeek + 1,
        openTime: timeToMinutes(d.open),
        closeTime: timeToMinutes(d.close),
      }));
    try {
      const res = await gymsService.updateGym(Number(gymId), {
        address,
        email,
        phoneNumber,
        additionalInfo,
        description,
        lat,
        lng,
        operatingHours,
      });
      if (res.error) setError(res.error);
      else setSuccess("Zapisano!");
    } catch {
      setError("Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  // ── Rooms handlers ──────────────────────────────────────────────────────────

  const openEditRoom = (room: GymRoom) => {
    setEditingRoom(room);
    setRoomFormName(room.name);
    setRoomFormCapacity(room.capacity != null ? String(room.capacity) : "");
    setRoomFormError("");
  };

  const cancelEditRoom = () => {
    setEditingRoom(null);
    setRoomFormName("");
    setRoomFormCapacity("");
    setRoomFormError("");
  };

  const handleRoomSubmit = async () => {
    if (!roomFormName.trim()) {
      setRoomFormError("Nazwa sali jest wymagana");
      return;
    }
    setRoomFormLoading(true);
    setRoomFormError("");
    const payload = {
      name: roomFormName,
      capacity: roomFormCapacity ? Number(roomFormCapacity) : null,
    };
    const data = editingRoom
      ? await gymsService.updateRoom(Number(gymId), editingRoom.id, payload)
      : await gymsService.createRoom(Number(gymId), payload);
    if (data.error) setRoomFormError(data.error);
    else {
      showRoomFlash("ok", editingRoom ? "Zaktualizowano." : "Dodano salę.");
      cancelEditRoom();
      loadRooms();
    }
    setRoomFormLoading(false);
  };

  const handleRoomDelete = async (id: number) => {
    const data = await gymsService.deleteRoom(Number(gymId), id);
    if (data.error) showRoomFlash("err", data.error);
    else {
      showRoomFlash("ok", "Usunięto salę.");
      setDeletingRoomId(null);
      loadRooms();
    }
  };

  if (loading) return <p className="text-white text-center mt-10">Ładowanie...</p>;

  const TABS: { id: Tab; label: string }[] = [
    { id: "settings", label: "Ustawienia" },
    { id: "rooms", label: "Sale" },
    { id: "roomOccupancy", label: "Obłożenie sal" },
    { id: "stats", label: "Obłożenie trenerów" },
  ];

  return (
    <div className="w-[90%] mx-auto py-8 flex flex-col gap-6">
      <Card className="bg-black border border-zinc-800 rounded-3xl">
        <CardHeader>
          <CardTitle>Siłownia</CardTitle>
          <CardDescription>{gymName}</CardDescription>
        </CardHeader>

        {/* TABS */}
        <div className="flex gap-2 px-6 pb-2 border-b border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                tab === t.id
                  ? "bg-sky-500 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <CardContent className="pt-6 flex flex-col gap-5">
          {/* ═══ SETTINGS ═══════════════════════════════════════════════════ */}
          {tab === "settings" && (
            <>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              {success && <div className="text-green-400 text-sm">{success}</div>}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* ── LEWA kolumna: mapa + adres ── */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs uppercase text-zinc-500 font-semibold tracking-wide">
                    Lokalizacja
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setError("");
                      }}
                      placeholder="Adres siłowni"
                      className="border-zinc-700 bg-black text-zinc-100 focus:border-sky-500"
                    />
                    <Button onClick={handleSearchAddress} className="shrink-0">
                      Szukaj
                    </Button>
                  </div>

                  <div className="h-[340px] w-full rounded-xl overflow-hidden border border-zinc-800">
                    <MapContainer
                      center={lat && lng ? [lat, lng] : [50.0647, 19.945]}
                      zoom={13}
                      className="h-full w-full z-0"
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <FlyTo lat={lat} lng={lng} />
                      {lat && lng && (
                        <Marker
                          position={[lat, lng]}
                          draggable={true}
                          eventHandlers={{
                            dragend: (e) => {
                              const pos = e.target.getLatLng();
                              setLat(pos.lat);
                              setLng(pos.lng);
                              setError("");
                              fetchAddressFromCoords(pos.lat, pos.lng);
                            },
                          }}
                        />
                      )}
                    </MapContainer>
                  </div>

                  <p className="text-xs uppercase text-zinc-500 font-semibold tracking-wide mt-2">
                    Opis
                  </p>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opis siłowni..."
                    className="p-3 bg-black text-white rounded-xl border border-zinc-700 min-h-[100px] text-sm focus:border-sky-500 outline-none"
                  />
                </div>

                {/* ── PRAWA kolumna: kontakt + godziny ── */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs uppercase text-zinc-500 font-semibold tracking-wide">
                    Kontakt
                  </p>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="border-zinc-700 bg-black text-zinc-100 focus:border-sky-500"
                  />
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Telefon"
                    className="border-zinc-700 bg-black text-zinc-100 focus:border-sky-500"
                  />

                  <p className="text-xs uppercase text-zinc-500 font-semibold tracking-wide mt-2">
                    Godziny otwarcia
                  </p>
                  <div className="flex flex-col gap-2">
                    {schedule.map((day) => (
                      <div
                        key={day.dayOfWeek}
                        className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5"
                      >
                        <span className="w-28 text-sm text-zinc-300 shrink-0">
                          {DAYS_OF_WEEK[day.dayOfWeek]}
                        </span>
                        <select
                          value={day.open}
                          onChange={(e) =>
                            handleScheduleChange(day.dayOfWeek, "open", e.target.value)
                          }
                          className="flex-1 bg-black text-white text-sm py-1 px-2 rounded border border-zinc-700 cursor-pointer focus:border-sky-500 outline-none"
                        >
                          <option value="">zamknięte</option>
                          {HOURS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <span className="text-zinc-600 text-xs shrink-0">–</span>
                        <select
                          value={day.close}
                          onChange={(e) =>
                            handleScheduleChange(day.dayOfWeek, "close", e.target.value)
                          }
                          className="flex-1 bg-black text-white text-sm py-1 px-2 rounded border border-zinc-700 cursor-pointer focus:border-sky-500 outline-none"
                        >
                          <option value="">--</option>
                          {HOURS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-zinc-800">
                <Button
                  className="flex-1 py-5 text-lg bg-sky-500 hover:bg-sky-600 text-white cursor-pointer"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Zapisywanie..." : "Zapisz"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 py-5 text-lg cursor-pointer"
                  onClick={() => navigate("/dashboard")}
                >
                  Powrót
                </Button>
              </div>
            </>
          )}

          {/* ═══ ROOMS ═══════════════════════════════════════════════════════ */}
          {tab === "rooms" && (
            <div className="flex flex-col gap-4">
              {roomFlash && (
                <div
                  className={`text-sm px-3 py-2 rounded-lg border ${roomFlash.type === "ok" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-red-300 bg-red-500/10 border-red-500/20"}`}
                >
                  {roomFlash.msg}
                </div>
              )}

              {/* Form */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3">
                <span className="text-sm text-zinc-400">
                  {editingRoom ? `Edytujesz: ${editingRoom.name}` : "Nowa sala"}
                </span>
                {roomFormError && <p className="text-sm text-red-400">{roomFormError}</p>}
                <div className="flex gap-2 flex-wrap">
                  <Input
                    value={roomFormName}
                    onChange={(e) => setRoomFormName(e.target.value)}
                    placeholder="Nazwa sali (np. Sala A, Siłownia główna)"
                    className="h-9 border-zinc-700 bg-black text-zinc-100 focus:border-sky-500 flex-1 min-w-48"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={roomFormCapacity}
                    onChange={(e) => setRoomFormCapacity(e.target.value)}
                    placeholder="Pojemność (opcjonalnie)"
                    className="h-9 border-zinc-700 bg-black text-zinc-100 focus:border-sky-500 w-52"
                  />
                  <Button
                    size="sm"
                    onClick={handleRoomSubmit}
                    disabled={roomFormLoading}
                    className="h-9 shrink-0 cursor-pointer"
                  >
                    {roomFormLoading ? "..." : editingRoom ? "Zapisz" : "Dodaj"}
                  </Button>
                  {editingRoom && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEditRoom}
                      className="h-9 shrink-0 cursor-pointer text-zinc-400"
                    >
                      Anuluj
                    </Button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                {roomsLoading ? (
                  <p className="text-sm text-zinc-500 px-4 py-6 text-center">Ładowanie...</p>
                ) : rooms.length === 0 ? (
                  <p className="text-sm text-zinc-600 px-4 py-6 text-center">
                    Brak sal. Dodaj pierwszą salę powyżej.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-zinc-600 border-b border-zinc-800">
                        <th className="px-4 py-2 text-left font-normal w-10">#</th>
                        <th className="px-4 py-2 text-left font-normal">Nazwa</th>
                        <th className="px-4 py-2 text-left font-normal w-36">Pojemność</th>
                        <th className="px-4 py-2 text-right font-normal w-32"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => (
                        <tr
                          key={room.id}
                          className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                        >
                          <td className="px-4 py-2 text-zinc-600">{room.id}</td>
                          <td className="px-4 py-2 text-zinc-200">{room.name}</td>
                          <td className="px-4 py-2 text-zinc-500">
                            {room.capacity != null ? (
                              `${room.capacity} os.`
                            ) : (
                              <span className="italic text-zinc-700">brak</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {deletingRoomId === room.id ? (
                              <span className="flex items-center justify-end gap-1">
                                <span className="text-red-400 mr-1">Usunąć?</span>
                                <button
                                  onClick={() => handleRoomDelete(room.id)}
                                  className="text-red-400 hover:text-red-300 cursor-pointer"
                                >
                                  tak
                                </button>
                                <span className="text-zinc-700">/</span>
                                <button
                                  onClick={() => setDeletingRoomId(null)}
                                  className="text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  nie
                                </button>
                              </span>
                            ) : (
                              <span className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => openEditRoom(room)}
                                  className="text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  edytuj
                                </button>
                                <button
                                  onClick={() => setDeletingRoomId(room.id)}
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
          )}

          {/* ═══ ROOM OCCUPANCY ══════════════════════════════════════════════ */}
          {tab === "roomOccupancy" && (
            <div className="flex flex-col gap-3">
              {scheduleLoading ? (
                <p className="text-sm text-zinc-500 py-6 text-center">Ładowanie...</p>
              ) : scheduleError ? (
                <p className="text-sm text-red-400">{scheduleError}</p>
              ) : rooms.length === 0 ? (
                <p className="text-sm text-zinc-600 py-6 text-center">
                  Brak sal. Dodaj sale w zakładce „Sale".
                </p>
              ) : (
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                  {rooms.map((room, i) => {
                    const classes = occupancyClasses
                      .filter((c) => c.roomId === room.id)
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime - b.startTime);

                    return (
                      <div
                        key={room.id}
                        className={`flex items-start gap-4 px-4 py-3 ${i < rooms.length - 1 ? "border-b border-zinc-800/60" : ""}`}
                      >
                        <div className="w-44 shrink-0">
                          <span className="text-sm text-zinc-200 font-medium">{room.name}</span>
                          {room.capacity != null && (
                            <span className="ml-2 text-xs text-zinc-600">{room.capacity} os.</span>
                          )}
                        </div>

                        {classes.length === 0 ? (
                          <span className="text-sm text-zinc-700 italic">brak zajęć</span>
                        ) : (
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {classes.map((c) => (
                              <span key={c.id} className="text-sm text-zinc-400">
                                <span className="text-zinc-500">{DAY_SHORT[c.dayOfWeek - 1]}</span>{" "}
                                {fmt(c.startTime)}–{fmt(c.endTime)}
                                <span className="text-zinc-600 ml-1">({c.name})</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ STATS ═══════════════════════════════════════════════════════ */}
          {tab === "stats" && (
            <div className="flex flex-col gap-4 text-white">
              {statsLoading ? (
                <p>Ładowanie statystyk...</p>
              ) : statsError ? (
                <p className="text-red-400">{statsError}</p>
              ) : stats ? (
                <>
                  <p className="text-zinc-400 text-sm">Wszystkie rezerwacje</p>
                  <div className="flex gap-4 flex-wrap">
                    <div className="p-4 bg-zinc-900 rounded-xl flex-1 min-w-28">
                      <p className="text-zinc-500 text-xs mb-1">Przyszłe</p>
                      <p className="text-2xl font-bold text-sky-400">{stats.confirmed}</p>
                    </div>
                    <div className="p-4 bg-zinc-900 rounded-xl flex-1 min-w-28">
                      <p className="text-zinc-500 text-xs mb-1">Anulowane</p>
                      <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
                    </div>
                    <div className="p-4 bg-zinc-900 rounded-xl flex-1 min-w-28">
                      <p className="text-zinc-500 text-xs mb-1">Wykonane</p>
                      <p className="text-2xl font-bold text-emerald-400">{stats.done}</p>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold mt-2">Obłożenie trenerów</h3>
                  <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    {stats.trainers.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40"
                      >
                        <span className="text-zinc-200">
                          {t.firstName} {t.lastName}
                        </span>
                        <div className="flex gap-4 text-xs">
                          <span className="text-emerald-400">Wykonane: {t.done}</span>
                          <span className="text-sky-400">Przyszłe: {t.confirmed}</span>
                          <span className="text-red-400">Anulowane: {t.cancelled}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-zinc-500">Brak danych</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
