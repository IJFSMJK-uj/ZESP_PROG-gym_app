import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { gymsService } from "../api/gymsService";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L, { LatLngBounds } from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

// fix ikonek — wklej przed komponentem
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

// komponent przesuwający mapę do siłowni
const FlyTo = ({ coords }: { coords: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 15);
  }, [coords]);
  return null;
};

const BoundsWatcher = ({
  onBoundsChange,
  onMoveEnd,
}: {
  onBoundsChange: (bounds: LatLngBounds) => void;
  onMoveEnd: () => void;
}) => {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
      onMoveEnd();
    },
    zoomend: () => onBoundsChange(map.getBounds()),
    load: () => onBoundsChange(map.getBounds()),
  });
  return null;
};

interface Gym {
  id: number;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export const SelectGymPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [search, setSearch] = useState("");
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isSearching = search.trim().length > 0 || isMapMoving;

  useEffect(() => {
    const loadGyms = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await gymsService.getGyms();
        if (data.error) {
          setError(data.error);
        } else {
          setGyms(data);
        }
      } catch {
        setError("Nie udało się pobrać siłowni");
      } finally {
        setLoading(false);
      }
    };
    loadGyms();
  }, [isAuthenticated]);

  const handleGymClick = (gym: Gym) => {
    setSelectedGymId(gym.id);
    setIsMapMoving(true);
    setShowDropdown(false);
    setSearch("");
    if (gym.lat && gym.lng) setFlyTo([gym.lat, gym.lng]);
  };

  const filteredGyms = gyms.filter((gym) => gym.name.toLowerCase().includes(search.toLowerCase()));

  const visibleGyms = !isSearching
    ? gyms.filter((gym) =>
        bounds && gym.lat && gym.lng ? bounds.contains([gym.lat, gym.lng]) : true
      )
    : [];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white">Ładowanie siłowni...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-400 mb-4 text-2xl">{error}</p>
        <Button variant="outline" onClick={() => navigate("/")} className="cursor-pointer">
          Powrót
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-117px)] overflow-hidden">
      {/* LISTA PO LEWEJ */}
      <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-zinc-800 bg-black">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-white font-bold text-lg">Siłownie</h2>
          {/* <p className="text-zinc-400 text-xs mt-1">{visibleGyms.length} dostępnych</p> */}
        </div>
        <div className="flex flex-col gap-2 p-3">
          <div className="p-3">
            <input
              type="text"
              placeholder="Szukaj siłowni..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const foundGym = gyms.find((gym) =>
                    gym.name.toLowerCase().includes(search.toLowerCase())
                  );

                  if (foundGym?.lat && foundGym?.lng) {
                    setFlyTo([foundGym.lat, foundGym.lng]);
                    setSelectedGymId(foundGym.id);
                  }
                }
              }}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm outline-none focus:border-sky-500"
            />
            {showDropdown && search && filteredGyms.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg mt-2 max-h-60 overflow-y-auto">
                {filteredGyms.map((gym) => (
                  <div
                    key={gym.id}
                    onClick={() => handleGymClick(gym)}
                    className="px-3 py-2 text-sm text-white cursor-pointer hover:bg-zinc-800"
                  >
                    {gym.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {visibleGyms.map((gym) => (
            <div
              key={gym.id}
              onClick={() => handleGymClick(gym)}
              className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                selectedGymId === gym.id
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
              }`}
            >
              <p className="text-white font-medium text-sm">{gym.name}</p>
              <p className="text-zinc-400 text-xs mt-1">{gym.address}</p>
              <Link
                to={`/gyms/${gym.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sky-400 text-xs mt-2 inline-block hover:text-sky-300"
              >
                Zobacz więcej →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* MAPA PO PRAWEJ */}
      <div className="flex-1 overflow-hidden">
        <MapContainer center={[50.0647, 19.945]} zoom={11} className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          />

          <FlyTo coords={flyTo} />
          <BoundsWatcher onBoundsChange={setBounds} onMoveEnd={() => setIsMapMoving(false)} />

          {gyms
            .filter((gym) => gym.lat && gym.lng)
            .map((gym) => (
              <Marker key={gym.id} position={[gym.lat!, gym.lng!]}>
                <Popup>
                  <div className="flex flex-col gap-1 min-w-[150px]">
                    <strong>{gym.name}</strong>
                    <span className="text-xs text-gray-500">{gym.address}</span>
                    <button
                      onClick={() => navigate(`/gyms/${gym.id}`)}
                      className="mt-1 bg-sky-500 text-white text-xs px-3 py-1 rounded cursor-pointer"
                    >
                      Zobacz szczegóły →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
};
