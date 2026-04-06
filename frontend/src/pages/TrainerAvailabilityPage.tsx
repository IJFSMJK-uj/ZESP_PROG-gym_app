import { useEffect, useState } from "react";
import AvailabilityForm from "../components/AvailabilityForm";
import AvailabilityList from "../components/AvailabilityList";
import { availabilityService } from "../api/availabilityService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function TrainerAvailabilityPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [availability, setAvailability] = useState<any[]>([]);
  const [gyms, setGyms] = useState<any[]>([]);

  const isTrainer = isAuthenticated && user?.role === "TRAINER";

  useEffect(() => {
    if (!isTrainer) {
      setAvailability([]);
      setGyms([]);
      return;
    }

    const fetchData = async () => {
      try {
        const [availabilityData, gymsData] = await Promise.all([
          availabilityService.getMyAvailability(),
          availabilityService.getMyGyms(),
        ]);

        setAvailability(availabilityData || []);
        setGyms(gymsData || []);
      } catch (e) {
        console.error("Availability fetch error:", e);
      }
    };

    fetchData();
  }, [isTrainer]);

  const deleteItem = async (id: number) => {
    if (!isTrainer) return;
    await availabilityService.delete(id);
    const data = await availabilityService.getMyAvailability();
    setAvailability(data || []);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <p className="text-lg text-white mb-4">Musisz się zalogować aby ustawić dostępność</p>
        <Button onClick={() => navigate("/auth")}>Zaloguj się</Button>
      </div>
    );
  }

  if (user.role !== "TRAINER") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <p className="text-lg text-white mb-4">Tylko trener może ustawiać dostępność</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] p-4">
      <Card className="w-full max-w-lg bg-black border border-zinc-800 rounded-3xl">
        <CardHeader className="text-center pt-8">
          <CardTitle>Dostępność trenera</CardTitle>
          <CardDescription>Dodaj dni i godziny swojej dostępności</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <AvailabilityForm
            gyms={gyms}
            onAdd={() => availabilityService.getMyAvailability().then(setAvailability)}
          />

          <AvailabilityList data={availability} onDelete={deleteItem} />
        </CardContent>
      </Card>
    </div>
  );
}
