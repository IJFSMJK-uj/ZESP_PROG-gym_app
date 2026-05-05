import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import { gymsService, type OperatingHour } from "../api/gymsService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useParams } from "react-router-dom";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// godziny
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
    if (lat && lng) {
      map.flyTo([lat, lng], 15);
    }
  }, [lat, lng]);

  return null;
};

const normalizePhone = (phone: string) => {
  let digits = phone.replace(/\D/g, ""); // usuń wszystko poza cyframi

  if (digits.startsWith("48")) {
    digits = digits.slice(2); // usuń prefix 48
  }

  return digits;
};

export const GymAdminPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { gymId } = useParams();

  const [role, setRole] = useState("");
  const [gymName, setGymName] = useState("");

  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [description, setDescription] = useState("");

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [schedule, setSchedule] = useState(
    DAYS_OF_WEEK.map((_, index) => ({
      dayOfWeek: index,
      open: "",
      close: "",
    }))
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔥 LOAD
  useEffect(() => {
    const init = async () => {
      try {
        const profile = await authService.getProfile();
        setRole(profile.role || "");

        if (profile.role !== "GYM_MANAGER") return;

        // const gym = await gymsService.getGymById(profile.gym.id);

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
      } catch {
        setError("Błąd ładowania");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

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

        // 🔥 KLUCZOWE: fallback
        if (first.address) {
          const a = first.address;

          const shortAddress = [a.road, a.house_number, a.postcode, a.city || a.town || a.village]
            .filter(Boolean)
            .join(", ");

          if (shortAddress.length > 0) {
            setAddress(shortAddress);
          } else {
            setAddress(first.display_name);
          }
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

  // marker
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
    // wymagane pola
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

    // EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Nieprawidłowy email");
      return false;
    }

    // TELEFON
    const normalized = normalizePhone(phoneNumber);

    if (!/^[0-9]{9}$/.test(normalized)) {
      setError("Nieprawidłowy numer telefonu (np. 123456789 lub +48 123 456 789)");
      return false;
    }

    return true;
  };

  // SAVE
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
      // const res = await gymsService.updateMyGym({
      //   address,
      //   email,
      //   phoneNumber,
      //   additionalInfo,
      //   description,
      //   lat,
      //   lng,
      //   operatingHours,
      // });

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

  return (
    <div className="p-8 flex justify-center">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <Card className="bg-black border border-zinc-800 rounded-3xl mb-10">
          <CardHeader>
            <CardTitle>Ustawienia siłowni</CardTitle>
            <CardDescription>{gymName}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {error && <div className="text-red-400">{error}</div>}
            {success && <div className="text-green-400">{success}</div>}

            {/* ADDRESS */}
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setError("");
                }}
              />
              <Button onClick={handleSearchAddress}>Szukaj</Button>
            </div>

            {/* MAP */}
            <div className="h-[300px] w-full rounded-xl overflow-hidden">
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

            {/* EMAIL / PHONE */}
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Telefon"
            />

            <div className="flex flex-col gap-2">
              {/* <label className="text-sm text-zinc-400">Opis siłowni</label> */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opis siłowni..."
                className="p-3 bg-zinc-900 text-white rounded-xl border border-zinc-700 min-h-[120px]"
              />
            </div>

            {/* HOURS */}
            {schedule.map((day) => (
              <div key={day.dayOfWeek} className="flex gap-3 items-center ">
                <span className="w-32 text-white">{DAYS_OF_WEEK[day.dayOfWeek]}</span>

                <select
                  value={day.open}
                  onChange={(e) => handleScheduleChange(day.dayOfWeek, "open", e.target.value)}
                  className="bg-zinc-900 text-white p-2 px-8 rounded ml-60 "
                >
                  <option value="">--</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>

                <select
                  value={day.close}
                  onChange={(e) => handleScheduleChange(day.dayOfWeek, "close", e.target.value)}
                  className="bg-zinc-900 text-white p-2 px-8 rounded"
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

            {/* INFO
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="p-2 bg-zinc-900 text-white"
            /> */}

            {error && <div className="text-red-400 text-center text-sm my-4">{error}</div>}

            {success && <div className="text-green-400 text-center my-4">{success}</div>}

            <div className="flex gap-3">
              <Button
                className="flex-1 cursor-pointer px-2 py-5 text-xl bg-sky-500 hover:bg-sky-600 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Zapisywanie..." : "Zapisz"}
              </Button>

              <Button
                variant="outline"
                className="flex-1 cursor-pointer px-2 py-5 text-xl"
                onClick={() => navigate("/dashboard")}
              >
                Powrót
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
