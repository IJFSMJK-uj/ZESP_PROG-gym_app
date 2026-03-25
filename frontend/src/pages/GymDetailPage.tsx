import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useEffect, useState } from "react";
import { gymsService } from "../api/gymsService";
import { useAuth } from "../context/AuthContext";

export const GymDetailPage = () => {
  const { gymId } = useParams<{ gymId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadGym = async () => {
      try {
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
        <Button
          variant="outline"
          onClick={() => navigate("/auth")}
          className="cursor-pointer"
        >
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

  return (
    <div className="p-8 flex flex-col items-center">
      <Card className="w-full max-w-4xl bg-black border border-zinc-800 rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle>{gym.name}</CardTitle>
          <CardDescription>{gym.address}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-white mb-4">{gym.description}</p>
          <p className="text-white">Godziny otwarcia: {gym.openTime}</p>
          <p className="text-white">Godziny Zamknięcia: {gym.closeTime}</p>
          <p className="text-white">
            Trenerzy polecają:{" "}
            {gym.trainerRecommendation ? "tak 8/10" : "nie 2/10"}
          </p>
          <p className="text-white">Powierzchnia {`${gym.area} m2`}</p>
          {error && (
            <div className="text-sm text-red-300 p-2 bg-red-500/10 rounded-md mt-3  text-center ">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-emerald-300 p-2 bg-emerald-500/10 rounded-md mt-2 text-center">
              {success}
            </div>
          )}
        </CardContent>
        <div className="flex justify-center p-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="cursor-pointer text-xs hover:bg-zinc-800"
          >
            Wróć do listy
          </Button>
          <Button
            onClick={handleSave}
            variant="outline"
            className="cursor-pointer text-xs hover:bg-zinc-800 ml-2"
          >
            Wybierz
          </Button>
        </div>
      </Card>
    </div>
  );
};
