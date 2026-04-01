import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { trainersService } from "../api/trainersService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

interface Trainer {
  assignmentId: number;
  trainerProfileId: number;
  userId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  phoneNumber: string | null;
  role: string;
}

export const TrainersPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  useEffect(() => {
    if (isAuthenticated && user && user.gymId) {
      const fetchTrainers = async () => {
        try {
          const data = await trainersService.getTrainersByGym(user.gymId);

          if (data.error) {
            setError(data.error);
          } else {
            setTrainers(data);
          }
        } catch {
          setError("Wystąpił błąd podczas ładowania trenerów:");
        } finally {
          setLoading(false);
        }
      };

      fetchTrainers();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <p className="text-xl text-white mb-4">
          Zaloguj się, aby zobaczyć trenerów ze swojej siłowni.
        </p>
        <Button onClick={() => navigate("/auth")}>Zaloguj się</Button>
      </div>
    );
  }

  if (!user?.gymId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <p className="text-xl text-white mb-4">Do twojego konta nie jest przypisana siłownia</p>
        <p className="text-zinc-400 mb-6">
          Wybierz siłownię, aby zobaczyć dostępnych w niej trenerów.
        </p>
        <Button variant="outline" onClick={() => navigate("/gyms")} className="cursor-pointer">
          Wybierz siłownię
        </Button>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center mt-20 text-white">Ładowanie trenerów...</div>;
  }

  if (error) {
    return <div className="text-center mt-20 text-red-500">{error}</div>;
  }

  const getDisplayName = (trainer: Trainer) => {
    if (trainer.firstName && trainer.lastName) {
      return `${trainer.firstName} ${trainer.lastName}`;
    }
    return "Trener";
  };

  return (
    <div className="container mx-auto p-8 relative">
      <h1 className="text-4xl font-bold text-white mb-2">Nasi Trenerzy</h1>
      <p className="text-zinc-400 mb-8">Trenerzy dostępni w Twojej siłowni (ID: {user.gymId})</p>

      {trainers.length === 0 ? (
        <p className="text-zinc-500">
          Niestety, Twoja siłownia nie ma jeszcze przypisanych żadnych trenerów.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
            <Card
              key={trainer.assignmentId}
              className="bg-zinc-950 border-zinc-800 rounded-2xl hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  {/* Pseudo-Awatar z pierwszą literą maila/nazwy */}
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-sky-400 font-bold text-xl uppercase">
                    {(trainer.firstName || trainer.email)[0]}
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl">{getDisplayName(trainer)}</CardTitle>
                    <CardDescription className="text-zinc-500">{trainer.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <Button
                    onClick={() => setSelectedTrainer(trainer)}
                    className="w-full bg-zinc-800 hover:bg-sky-500 text-white transition-colors cursor-pointer"
                  >
                    Zobacz Profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {}
      <Dialog open={!!selectedTrainer} onOpenChange={(open) => !open && setSelectedTrainer(null)}>
        <DialogContent className="bg-black border border-zinc-800 text-white sm:max-w-md rounded-3xl">
          {selectedTrainer && (
            <>
              <DialogHeader className="flex flex-col items-center text-center space-y-4 pt-6">
                <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-sky-500 flex items-center justify-center text-sky-400 font-bold text-4xl uppercase shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                  {(selectedTrainer.firstName || selectedTrainer.email)[0]}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {getDisplayName(selectedTrainer)}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    {selectedTrainer.email}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                    O mnie
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {selectedTrainer.bio || "Ten trener nie dodał jeszcze opisu."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 text-center">
                    <p className="text-xs text-zinc-500 uppercase">Nr telefonu</p>
                    <p className="text-sm font-bold text-emerald-400">
                      {selectedTrainer.phoneNumber || "Brak nr telefonu"}
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 text-center">
                    <p className="text-xs text-zinc-500 uppercase">Siłownia ID</p>
                    <p className="text-sm font-bold text-white">{user?.gymId}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pb-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTrainer(null)}
                  className="w-1/2 border-zinc-700 hover:bg-zinc-800 cursor-pointer"
                >
                  Zamknij
                </Button>
                <Button
                  className="w-1/2 bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer shadow-lg shadow-sky-500/20"
                  onClick={() => {
                    navigate(`/trainer/${selectedTrainer.assignmentId}/schedule`);
                    setSelectedTrainer(null);
                  }}
                >
                  Zarezerwuj
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
