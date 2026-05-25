import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useEffect, useState, useRef } from "react";
import { gymsService } from "../api/gymsService";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

const mapDayToIndex = (day: number) => day % 7;
const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

type OperatingHour = { dayOfWeek: number; openTime: number; closeTime: number };
type GymEquipment = { id: number; name: string; imageUrl?: string; description?: string };

type Gym = {
  id: number;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  email?: string;
  phoneNumber?: string;
  description?: string;
  mainImage?: string;
  gallery?: string[];
  equipment?: GymEquipment[];
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
          attribution="© OpenStreetMap"
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

  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const loadGym = async () => {
    try {
      if (!gymId) return;
      const data = await gymsService.getGymById(gymId);

      if (data && data.error) {
        setError(data.error);
        setGym(null);
      } else {
        setGym(data);
        setError("");
      }
    } catch (err) {
      console.error(err);
      setError("Wystąpił błąd podczas pobierania danych siłowni.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGym();
  }, [gymId]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-white mb-4">Musisz się zalogować, aby zobaczyć tę stronę</p>
        <Button variant="outline" onClick={() => navigate("/auth")}>
          Przejdź do logowania
        </Button>
      </div>
    );
  }

  const handleSave = async () => {
    setError("");
    setSuccess("");
    try {
      const data = await gymsService.selectGym(gym!.id);
      if (data.error) {
        setError(data.error);
        return;
      }
      updateUser({ gymId: gym!.id });
      setSuccess(data.message);
    } catch (err) {
      setError("Błąd sieci. Spróbuj ponownie.");
    }
  };

  const getToken = () => localStorage.getItem("token");

  const uploadMainImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gymId) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`/api/gyms/${gymId}/main-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        setSuccess("Zdjęcie główne zaktualizowane");
        loadGym();
      } else {
        setError("Błąd wgrywania zdjęcia");
      }
    } catch {
      setError("Błąd połączenia");
    }
  };

  const uploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !gymId || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("gallery", file));

    try {
      const res = await fetch(`/api/gyms/${gymId}/gallery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        setSuccess("Galeria zaktualizowana");
        loadGym();
      } else {
        setError("Błąd wgrywania galerii");
      }
    } catch {
      setError("Błąd połączenia");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">Ładowanie...</div>
    );

  if (error && !gym)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-400 text-xl mb-4">{error}</p>
        <Button
          onClick={() => navigate("/gyms")}
          variant="outline"
          className="border-zinc-700 text-white hover:bg-zinc-800 cursor-pointer"
        >
          Powrót do mapy
        </Button>
      </div>
    );

  if (!gym) return <p className="text-red-500 text-center mt-20">Nie znaleziono siłowni</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      {/* SEKCJA ZDJĘCIA GŁÓWNEGO I NAGŁÓWKA */}
      <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden mt-10 shadow-2xl shadow-sky-900/20 border border-zinc-800">
        {gym.mainImage ? (
          <img src={gym.mainImage} alt={gym.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500">
            Brak zdjęcia
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-8 pointer-events-none">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 pointer-events-auto">
            {gym.name}
          </h1>
          <h2 className="text-lg text-sky-400 pointer-events-auto">{gym.address}</h2>
        </div>
      </div>

      {/* GALERIA */}
      <div className="mt-16">
        <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-2">
          <h2 className="text-2xl font-semibold text-white">Galeria</h2>
        </div>

        {gym.gallery && gym.gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gym.gallery.map((imgSrc, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-zinc-800 hover:border-sky-500 transition-colors bg-zinc-900"
                onClick={() => setLightboxIndex(idx)}
              >
                <img
                  src={imgSrc}
                  alt="Galeria"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-8">Galeria jest pusta.</p>
        )}

        <Lightbox
          open={lightboxIndex >= 0}
          index={lightboxIndex}
          close={() => setLightboxIndex(-1)}
          plugins={[Zoom]}
          slides={(gym.gallery || []).map((src) => ({ src }))}
        />
      </div>

      {/* URZĄDZENIA I MASZYNY */}
      <div className="mt-16">
        <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-2">
          <h2 className="text-2xl font-semibold text-white">Wyposażenie i Sprzęt</h2>
        </div>

        {gym.equipment && gym.equipment.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gym.equipment.map((eq) => (
              <div
                key={eq.id}
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0">
                  {eq.imageUrl ? (
                    <img src={eq.imageUrl} alt={eq.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500 border border-zinc-800 text-center">
                      Brak
                      <br />
                      zdjęcia
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">{eq.name}</h3>
                  {eq.description && <p className="text-xs text-zinc-400 mt-1">{eq.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-8">Brak informacji o wyposażeniu.</p>
        )}
      </div>

      {/* OPIS I MAPA */}
      <div className="mt-16 text-center">
        <h2 className="text-xl font-semibold text-white mb-3">O siłowni</h2>
        <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl mx-auto">
          {gym.description || "Brak opisu siłowni."}
        </p>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-xl font-semibold text-white mb-6">Lokalizacja</h2>
        {gym.lat && gym.lng ? (
          <div>
            <GymMap lat={gym.lat} lng={gym.lng} name={gym.name} address={gym.address} />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${gym.lat},${gym.lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 text-sm mt-4 inline-block hover:underline"
            >
              Otwórz w Google Maps
            </a>
          </div>
        ) : (
          <p className="text-zinc-500">Brak lokalizacji siłowni na mapie.</p>
        )}
      </div>

      {/* ZAJĘCIA GRUPOWE */}
      <div className="mt-16 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-2">
          <h2 className="text-xl font-semibold text-white">Zajęcia grupowe</h2>
          <Link
            to={`/gyms/${gym.id}/classes`}
            className="text-sky-400 hover:text-sky-300 text-sm transition-colors"
          >
            Zobacz pełny grafik →
          </Link>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl mx-auto text-center">
          Sprawdź dostępne zajęcia grupowe w tej siłowni - jogę, spinning, crossfit i wiele więcej.
        </p>
      </div>

      {/* GODZINY OTWARCIA - BEZPIECZNE ŁADOWANIE */}
      <div className="mt-16 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold text-white mb-6 text-center">Godziny otwarcia</h2>
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          {gym.operatingHours && gym.operatingHours.length > 0 ? (
            <ul className="space-y-4">
              {[...gym.operatingHours]
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((hour) => (
                  <li
                    key={hour.dayOfWeek}
                    className="flex justify-between items-center text-zinc-300 text-sm border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="font-medium">
                      {DAYS_OF_WEEK[mapDayToIndex(hour.dayOfWeek)]}
                    </span>
                    <span className="text-sky-400">
                      {minutesToTime(hour.openTime)} - {minutesToTime(hour.closeTime)}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-zinc-500 text-center">Brak danych o godzinach otwarcia.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center mt-12 mb-10">
        {error && (
          <div className="text-sm text-red-300 p-3 bg-red-500/10 rounded-xl mb-4 w-full max-w-md text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-emerald-300 p-3 bg-emerald-500/10 rounded-xl mb-4 w-full max-w-md text-center">
            {success}
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          {user?.role !== "GYM_MANAGER" && (
            <Button
              onClick={handleSave}
              className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              Ustaw jako moją siłownię
            </Button>
          )}
          <Button
            onClick={() => navigate("/gyms")}
            variant="outline"
            className="border-zinc-700 hover:bg-zinc-800 text-white cursor-pointer"
          >
            Powrót do mapy
          </Button>
        </div>
      </div>
    </div>
  );
};
