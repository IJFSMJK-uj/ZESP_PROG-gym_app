import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Link } from "react-router-dom";
import { gymsService } from "../api/gymsService";
import { useAuth } from "../context/AuthContext";

interface Gym {
  id: number;
  name: string;
  address: string;
}

export const SelectGymPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div className="p-8 flex justify-center">
      <div className="flex flex-wrap justify-center gap-6 max-w-6xl ">
        {gyms.map((gym) => (
          <Card key={gym.id} className="w-64 h-32 bg-black border border-zinc-800 rounded-3xl">
            <CardHeader className="text-center">
              <CardTitle>{gym.name}</CardTitle>
              <CardDescription>{gym.address}</CardDescription>
            </CardHeader>
            <div className="flex justify-center">
              <Button
                asChild
                variant="outline"
                className="cursor-pointer text-xs hover:bg-zinc-800"
              >
                <Link to={`/gyms/${gym.id}`}>Zobacz więcej</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
