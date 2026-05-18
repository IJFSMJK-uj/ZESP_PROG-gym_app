import { useEffect, useState, useRef } from "react";
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

type GymEquipment = { id: number; name: string; imageUrl?: string; description?: string; };
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
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<GymEquipment[]>([]);
  const [schedule, setSchedule] = useState(
    DAYS_OF_WEEK.map((_, index) => ({ dayOfWeek: index, open: "", close: "" }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [standardEquipment, setStandardEquipment] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStandardLabel, setSelectedStandardLabel] = useState("Własne urządzenie (wpisz ręcznie)");
  const [selectedStandardImageUrl, setSelectedStandardImageUrl] = useState<string | null>(null);

  const [machineName, setMachineName] = useState("");
  const [machineDesc, setMachineDesc] = useState("");
  const [machineFile, setMachineFile] = useState<File | null>(null);

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Ładowanie szablonów ze słownika
  const loadStandardEquipment = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/gyms/equipment/standard", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!data.error) setStandardEquipment(data);
    } catch (err) {
      console.error("Nie udało się pobrać szablonów urządzeń", err);
    }
  };

  const refreshMediaAndEquipment = async () => {
    if (!gymId) return;
    try {
      const gym = await gymsService.getGymById(gymId);
      setMainImage(gym.mainImage || null);
      setGallery(gym.gallery || []);
      setEquipment(gym.equipment || []);
    } catch (err) {
      console.error("Nie udało się odświeżyć multimediów", err);
    }
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
        setMainImage(gym.mainImage || null);
        setGallery(gym.gallery || []);
        setEquipment(gym.equipment || []);

        await loadStandardEquipment();

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

  const uploadMainImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gymId) return;
    setError(""); setSuccess("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`http://localhost:3001/api/gyms/${gymId}/main-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        setSuccess("Zdjęcie główne zostało zaktualizowane.");
        await refreshMediaAndEquipment();
      } else {
        setError("Błąd podczas wgrywania zdjęcia głównego.");
      }
    } catch {
      setError("Błąd połączenia z serwerem.");
    }
  };

  const deleteMainImage = async () => {
    if (!gymId) return;
    if (!window.confirm("Czy na pewno chcesz usunąć zdjęcie główne siłowni?")) return;
    setError(""); setSuccess("");

    try {
      const res = await fetch(`http://localhost:3001/api/gyms/${gymId}/main-image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setSuccess("Zdjęcie główne zostało usunięte.");
        await refreshMediaAndEquipment();
      } else {
        setError("Nie udało się usunąć zdjęcia głównego.");
      }
    } catch {
      setError("Błąd połączenia z serwerem.");
    }
  };

  const uploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !gymId || files.length === 0) return;
    setError(""); setSuccess("");

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("gallery", file));

    try {
      const res = await fetch(`http://localhost:3001/api/gyms/${gymId}/gallery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        setSuccess("Zdjęcia zostały pomyślnie dodane do galerii.");
        await refreshMediaAndEquipment();
      } else {
        setError("Błąd podczas wgrywania galerii.");
      }
    } catch {
      setError("Błąd połączenia z serwerem.");
    }
  };

  const deleteGalleryImage = async (url: string) => {
    if (!gymId) return;
    if (!window.confirm("Czy na pewno chcesz usunąć to zdjęcie z galerii?")) return;
    setError(""); setSuccess("");

    try {
      const res = await fetch(`http://localhost:3001/api/gyms/${gymId}/gallery`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ imageUrl: url })
      });
      if (res.ok) {
        setSuccess("Zdjęcie zostało usunięte z galerii.");
        await refreshMediaAndEquipment();
      } else {
        setError("Nie udało się usunąć zdjęcia z galerii.");
      }
    } catch {
      setError("Błąd połączenia z serwerem.");
    }
  };

  const handleSelectStandardEquipment = (item: any) => {
    if (item === "custom") {
      setSelectedStandardLabel("Własne urządzenie (wpisz ręcznie)");
      setSelectedStandardImageUrl(null);
      setMachineName("");
    } else {
      setSelectedStandardLabel(item.name);
      setMachineName(item.name); 
      setSelectedStandardImageUrl(item.imageUrl || null);
    }
    setDropdownOpen(false);
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineName.trim() || !gymId) return;
    setError(""); setSuccess("");

    const formData = new FormData();
    formData.append("name", machineName.trim());
    formData.append("description", machineDesc.trim());
    
    if (machineFile) {
      formData.append("image", machineFile);
    } else if (selectedStandardImageUrl) {
      formData.append("imageUrl", selectedStandardImageUrl);
    }

    try {
      const res = await fetch(`http://localhost:3001/api/gyms/${gymId}/equipment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (res.ok) {
        setSuccess(`Pomyślnie dodano sprzęt: ${machineName}`);
        setMachineName("");
        setMachineDesc("");
        setMachineFile(null);
        setSelectedStandardLabel("Własne urządzenie (wpisz ręcznie)");
        setSelectedStandardImageUrl(null);
        const fileInput = document.getElementById("equipment-file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        await refreshMediaAndEquipment();
      } else {
        setError("Nie udało się zapisać urządzenia.");
      }
    } catch {
      setError("Błąd sieci podczas dodawania sprzętu.");
    }
  };

  const handleDeleteEquipment = async (equipmentId: number, name: string) => {
    if (!gymId) return;
    if (!window.confirm(`Czy na pewno chcesz trwale usunąć urządzenie "${name}" z tej siłowni?`)) return;
    setError(""); setSuccess("");

    try {
      const res = await fetch(`http://localhost:3001/api/gyms/${gymId}/equipment/${equipmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setSuccess(`Urządzenie "${name}" zostało usunięte.`);
        await refreshMediaAndEquipment();
      } else {
        setError("Nie udało się usunąć urządzenia.");
      }
    } catch {
      setError("Błąd połączenia z serwerem.");
    }
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-b border-zinc-800 pb-6 text-white mb-2">
                
                <div className="flex flex-col gap-3 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60">
                  <p className="text-xs uppercase text-zinc-400 font-bold tracking-wide">
                    Panoramiczne zdjęcie główne klubu
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    
                    <div className="relative group w-full sm:w-44 h-24 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center text-xs text-zinc-500 shrink-0">
                      {mainImage ? (
                        <>
                          <img src={mainImage} alt="Główne siłowni" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              type="button"
                              onClick={deleteMainImage}
                              className="p-2 bg-red-600/80 rounded-full text-white hover:bg-red-600 transition-colors cursor-pointer shadow-lg"
                              title="Usuń zdjęcie"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        "Brak zdjęcia"
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <input type="file" ref={mainImageInputRef} onChange={uploadMainImage} className="hidden" accept="image/*" />
                      <Button variant="outline" size="sm" onClick={() => mainImageInputRef.current?.click()} className="cursor-pointer w-fit text-xs bg-black border-zinc-700 text-zinc-200">
                        Prześlij zdjęcie główne
                      </Button>
                      <p className="text-[10px] text-zinc-500">Wyświetlane w wyszukiwarce na mapie oraz w menu bocznym.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60 h-full justify-between">
                  <div className="flex justify-between items-center">
                    <p className="text-xs uppercase text-zinc-400 font-bold tracking-wide">
                      Galeria zdjęć wnętrza klubu
                    </p>
                    <input type="file" multiple ref={galleryInputRef} onChange={uploadGallery} className="hidden" accept="image/*" />
                    <Button size="sm" onClick={() => galleryInputRef.current?.click()} className="cursor-pointer text-xs bg-sky-600 hover:bg-sky-500 text-white h-7 px-3">
                      + Dodaj zdjęcia
                    </Button>
                  </div>
                  
                  {gallery && gallery.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-20 overflow-y-auto pr-1 mt-2">
                      {gallery.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                          <img src={url} alt={`Galeria ${idx}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              type="button"
                              onClick={() => deleteGalleryImage(url)}
                              className="p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-600 transition-colors cursor-pointer shadow"
                              title="Usuń zdjęcie"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic py-4 text-center">Brak wgranych zdjęć do galerii.</p>
                  )}
                </div>

              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                <div className="flex flex-col gap-5">
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
                      <Button onClick={handleSearchAddress} className="shrink-0 cursor-pointer">
                        Szukaj
                      </Button>
                    </div>

                    <div className="h-[250px] w-full rounded-xl overflow-hidden border border-zinc-800">
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
                      className="p-3 bg-black text-white rounded-xl border border-zinc-700 min-h-[80px] text-sm focus:border-sky-500 outline-none resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-4 border-t border-zinc-800 pt-4 text-white">
                    <p className="text-xs uppercase text-zinc-400 font-bold tracking-wide">
                      Wyposażenie i maszyny w obiekcie
                    </p>

                    <form onSubmit={handleAddEquipment} className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-2xl space-y-4">
                      <p className="text-xs text-zinc-400 font-medium">Rejestruj nowy sprzęt na siłowni</p>
                      
                      <div className="space-y-1 relative" ref={dropdownRef}>
                        <label className="text-[11px] text-zinc-500">Wybierz urządzenie ze słownika szablonów</label>
                        <div 
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="w-full bg-black border border-zinc-700 hover:border-zinc-500 rounded-lg p-2.5 text-xs text-zinc-200 cursor-pointer flex justify-between items-center h-9 transition-colors"
                        >
                          <span>{selectedStandardLabel}</span>
                          <span className="text-zinc-500 text-[10px]">▼</span>
                        </div>

                        {dropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-zinc-900">
                            <div 
                              onClick={() => handleSelectStandardEquipment("custom")}
                              className="p-2 text-xs text-zinc-400 hover:bg-zinc-900 cursor-pointer font-medium"
                            >
                              Własne urządzenie (wpisz ręcznie)
                            </div>
                            {standardEquipment.map((item) => (
                              <div 
                                key={item.id}
                                onClick={() => handleSelectStandardEquipment(item)}
                                className="p-2 text-xs text-white hover:bg-zinc-900 cursor-pointer flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 bg-black rounded overflow-hidden border border-zinc-800 flex-shrink-0 flex items-center justify-center text-[7px] text-zinc-600">
                                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : "Brak"}
                                </div>
                                <span className="font-medium">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-500">Nazwa urządzenia (możesz zmienić)</label>
                          <Input 
                            type="text" 
                            required
                            placeholder="Wpisz nazwę sprzętu" 
                            value={machineName} 
                            onChange={(e) => setMachineName(e.target.value)}
                            className="h-8 text-xs border-zinc-700 bg-black text-zinc-100 focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-500">Zmień/Dodaj własne zdjęcie</label>
                          <Input 
                            id="equipment-file-input"
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setMachineFile(e.target.files?.[0] || null)}
                            className="h-8 text-xs border-zinc-700 bg-black text-zinc-100 file:text-zinc-300 file:bg-zinc-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-zinc-500">Krótka specyfikacja / Strefa (opcjonalnie)</label>
                        <Input 
                          type="text" 
                          placeholder="np. Strefa Cardio, obciążenie stosu do 120kg" 
                          value={machineDesc} 
                          onChange={(e) => setMachineDesc(e.target.value)}
                          className="h-8 text-xs border-zinc-700 bg-black text-zinc-100 focus:border-sky-500"
                        />
                      </div>

                      <Button type="submit" className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs cursor-pointer px-4">
                        Zapisz sprzęt
                      </Button>
                    </form>

                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500 font-medium">Zarejestrowane maszyny ({equipment.length})</p>
                      {equipment && equipment.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {equipment.map((eq) => (
                            <div key={eq.id} className="relative group bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 bg-black rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-[8px] text-zinc-600 border border-zinc-800">
                                {eq.imageUrl ? <img src={eq.imageUrl} alt={eq.name} className="w-full h-full object-cover" /> : "Brak foto"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-semibold text-zinc-200 truncate">{eq.name}</h5>
                                {eq.description && <p className="text-[10px] text-zinc-400 truncate mt-0.5">{eq.description}</p>}
                              </div>
                              
                              <div className="absolute inset-0 bg-black/80 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                                  className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors cursor-pointer shadow-md"
                                  title="Usuń maszynę z siłowni"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-600 italic">Brak dodanych maszyn. Użyj formularza powyżej.</p>
                      )}
                    </div>
                  </div>
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

              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-4">
                <Button
                  className="flex-1 py-5 text-lg bg-sky-500 hover:bg-sky-600 text-white cursor-pointer"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Zapisywanie..." : "Zapisz dane siłowni"}
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
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3 text-white">
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