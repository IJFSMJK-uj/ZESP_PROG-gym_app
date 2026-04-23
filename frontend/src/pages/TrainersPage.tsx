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
import { MapPin } from "lucide-react";
import { ReviewsList } from "../components/ReviewsList";

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
  worksAt: { name: string; address: string }[];
}

interface GymInfo {
  name: string;
  address: string;
}

export const TrainersPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [currentGym, setCurrentGym] = useState<GymInfo | null>(null);
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
            setTrainers(data.trainers);
            setCurrentGym(data.gym);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-white mb-4">Musisz się zalogować, aby przejrzeć trenerów.</p>
        <Button variant="outline" onClick={() => navigate("/auth")} className="cursor-pointer">
          Przejdź do logowania
        </Button>
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

      {currentGym && (
        <div className="flex items-center text-zinc-400 mb-8 gap-2">
          <MapPin size={18} className="text-sky-500" />
          <p>
            <span className="text-white">{currentGym.name}</span> ({currentGym.address})
          </p>
        </div>
      )}

      {trainers.length === 0 ? (
        <p className="text-zinc-500">
          Twoja siłownia nie ma jeszcze przypisanych żadnych trenerów.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trainers.map((trainer) => (
            <Card
              key={trainer.assignmentId}
              className="bg-zinc-950 border-zinc-800 rounded-2xl hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] transition-all duration-300 pt-8 pb-6"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 rounded-full bg-zinc-800 flex items-center justify-center text-sky-400 font-bold text-xl uppercase">
                    {(trainer.firstName || trainer.email)[0]}
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl">{getDisplayName(trainer)}</CardTitle>
                    <CardDescription className="text-zinc-500">{trainer.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mt-2">
                  <Button
                    variant="link"
                    onClick={() => setSelectedTrainer(trainer)}
                    className="flex-auto bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
                  >
                    Zobacz Profil
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-auto bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
                    onClick={() => {
                      // POPRAWKA: używamy obiektu "trainer" z mapowania, a nie stanu!
                      navigate(`/trainer/${trainer.assignmentId}/schedule`);
                    }}
                  >
                    Sprawdź dostępność
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!selectedTrainer} onOpenChange={(open) => !open && setSelectedTrainer(null)}>
        <DialogContent className="bg-black border border-zinc-800 text-white sm:max-w-md rounded-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {selectedTrainer && (
            <>
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="px-6 pt-6">
                  <DialogHeader className="flex flex-col items-center text-center space-y-4">
                    <div className="w-30 h-30 rounded-full bg-zinc-900 border-2 border-sky-500 flex items-center justify-center text-sky-400 font-bold text-4xl uppercase shadow-[0_0_20px_rgba(14,165,233,0.3)]">
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
                </div>

                <div className="py-6 space-y-4 px-6">
                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                      O mnie
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {selectedTrainer.bio || "Ten trener nie dodał jeszcze opisu."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 flex flex-col justify-start">
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                        Kontakt
                      </h3>
                      <p className="text-sm font-bold text-white">
                        {selectedTrainer.phoneNumber || "Brak nr"}
                      </p>
                    </div>

                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 flex flex-col justify-start">
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                        Pracuje w
                      </h3>
                      <ul className="space-y-3">
                        {selectedTrainer.worksAt.map((gym, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <MapPin size={16} className="text-sky-500 mt-0.5 shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="font-medium text-zinc-200 leading-tight mb-0.5">
                                {gym.name}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
                    <ReviewsList trainerId={selectedTrainer.trainerProfileId} />
                  </div>
                </div>
              </div>

              <div className="bg-black border-t border-zinc-800 p-4 flex gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTrainer(null)}
                  className="flex-auto border-zinc-700 hover:bg-zinc-800 cursor-pointer"
                >
                  Zamknij
                </Button>
                <Button
                  className="flex-auto bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer"
                  onClick={() => {
                    navigate(`/trainer/${selectedTrainer.assignmentId}/schedule`);
                    setSelectedTrainer(null);
                  }}
                >
                  Zarezerwuj trening
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
