import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useEffect, useState } from "react";
import { gymsService } from "../api/gymsService";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const mapDayToIndex = (day: number) => day % 7;

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

type OperatingHour = {
  dayOfWeek: number;
  openTime: number;
  closeTime: number;
};

type Gym = {
  id: number;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  email?: string;
  phoneNumber?: string;
  description?: string;
  additionalInfo?: string;
  operatingHours: OperatingHour[];
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

const GymMap = ({
  lat,
  lng,
  name,
  address,
}: {
  lat: number;
  lng: number;
  name: string;
  address: string;
}) => {
  return (
    <div className="h-[250px] w-full max-w-xl mx-auto rounded-xl overflow-hidden">
      <MapContainer center={[lat, lng]} zoom={15} className="h-full w-full z-0">
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <strong>{name}</strong>
            <br />
            {address}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export const GymDetailPage = () => {
  const { gymId } = useParams<{ gymId: string }>();
  const { isAuthenticated, updateUser, user } = useAuth();
  const navigate = useNavigate();

  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadGym = async () => {
      try {
        if (!gymId) return;
        const data = await gymsService.getGymById(gymId);
        setGym(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadGym();
  }, [gymId]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-white mb-4">
          Musisz się zalogować, aby wybrać siłownie macierzystą
        </p>
        <Button variant="outline" onClick={() => navigate("/auth")} className="cursor-pointer">
          Przejdź do logowania
        </Button>
      </div>
    );
  }

  const handleSave = async () => {
    setError("");
    setSuccess("");

    try {
      const data = await gymsService.selectGym(gym.id);
      if (data.error) {
        setError(data.error);
        return;
      }

      updateUser({ gymId: gym.id });
      setSuccess(data.message);
    } catch (err) {
      console.error(err);
      setError("Błąd sieci. Spróbuj ponownie.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white">Ładowanie siłowni...</p>
      </div>
    );
  }

  if (!gym) return <p className="text-red-500">Nie znaleziono siłowni</p>;

  const sortedHours = gym.operatingHours
    ? [...gym.operatingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex flex-col items-center mx-30 mt-20 mb-5">
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center">{gym.name}</h1>
        <h1 className="text-sm md:text-base text-zinc-400 text-center mt-1 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
          {gym.address}
        </h1>
      </div>
      <div className="mt-10 mb-12 text-center">
        <h2 className="text-zinc-300 font-semibold mb-2 text-center text-2xl">Lokalizacja:</h2>
        {gym.lat && gym.lng ? (
          <div>
            <GymMap lat={gym.lat} lng={gym.lng} name={gym.name} address={gym.address} />
            <a
              href={`https://www.google.com/maps?q=${gym.lat},${gym.lng}`}
              target="_blank"
              className="text-blue-400 text-sm mt-2 inline-block"
            >
              Otwórz w Google Maps
            </a>
          </div>
        ) : (
          <p className="text-zinc-500">Brak lokalizacji siłowni.</p>
        )}
      </div>
      <div className="flex flex-col items-center mx-30 mt-20 mb-20">
        <h2 className="text-xl font-semibold text-white mb-3 text-center">Dlaczego {gym.name}?</h2>
        <h2 className="text-sm text-zinc-300 leading-relaxed max-w-2xl mx-auto text-center">
          {gym.description}
        </h2>
      </div>
      <div className="flex flex-col items-center mx-30 mt-20 mb-20">
        <h2 className="text-lg font-semibold text-white mb-3">Kontakt</h2>
        <div className="flex flex-col mt-3">
          {(gym.email || gym.phoneNumber) && (
            <div className="mt-5 gap-8 flex flex-col text-zinc-400">
              {gym.email && (
                <div className="flex justify-between text-sm border-b border-zinc-800 py-2">
                  <div className="text-zinc-500">E-mail</div>
                  <div>{gym.email}</div>
                </div>
              )}
              {gym.phoneNumber && (
                <div className="flex justify-between text-sm border-b border-zinc-800 py-2">
                  <div className="text-zinc-500">Telefon</div>
                  <div>{gym.phoneNumber}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center mt-12 mb-12 w-full max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-white mb-3">Godziny otwarcia</h2>
        <div className="mt-5 text-2xl">
          {sortedHours.length > 0 ? (
            <ul className="space-y-6">
              {sortedHours.map((hour) => (
                <li
                  key={hour.dayOfWeek}
                  className="text-zinc-400 grid grid-cols-[1fr_auto] text-sm border-b border-zinc-800 py-2 gap-6"
                >
                  <span>{DAYS_OF_WEEK[mapDayToIndex(hour.dayOfWeek)]}</span>
                  <span>
                    {minutesToTime(hour.openTime)} - {minutesToTime(hour.closeTime)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500">Brak danych o godzinach otwarcia.</p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center mb-20">
        {/* komunikaty */}
        {error && (
          <div className="text-sm text-red-300 p-3 bg-red-500/10 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-emerald-300 p-3 bg-emerald-500/10 rounded-xl mb-4 text-center">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-3 items-center">
          {user?.role !== "GYM_MANAGER" && (
            <Button
              onClick={handleSave}
              className="cursor-pointer px-4 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white"
            >
              Wybierz tę siłownię
            </Button>
          )}
          <Button
            onClick={() => navigate("/gyms")}
            variant="outline"
            className="cursor-pointer px-4 py-2 text-sm hover:bg-zinc-800"
          >
            Powrót do mapy
          </Button>
        </div>
      </div>
    </div>
  );
};
