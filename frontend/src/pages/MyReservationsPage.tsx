import { useEffect, useState, useMemo } from "react";
import { reservationsService } from "../api/reservationsService";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { ReviewModal } from "../components/ReviewModal";

export const MyReservationsPage = () => {
  const { user } = useAuth();
  const [clientReservations, setClientReservations] = useState<any[]>([]);
  const [trainerReservations, setTrainerReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const cData = await reservationsService.getClientReservations();
      if (cData && !cData.error) setClientReservations(cData);

      if (user?.role === "TRAINER") {
        const tData = await reservationsService.getTrainerReservations();
        if (tData && !tData.error) setTrainerReservations(tData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadAllData();
  }, [user]);

  const handleCancel = async (id: number) => {
    if (!window.confirm("Czy na pewno chcesz anulować tę rezerwację?")) return;
    const res = await reservationsService.cancelReservation(id);
    if (res && !res.error) loadAllData();
  };

  const handleOpenReviewModal = (res: any) => {
    setSelectedReservation(res);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = async () => {
    const nextIndex = reviewIndex + 1;

    await loadAllData();

    if (nextIndex < reviewQueue.length) {
      setReviewIndex(nextIndex);
      setSelectedReservation(reviewQueue[nextIndex]);
      setReviewModalOpen(true);
    } else {
      setReviewModalOpen(false);
      setSelectedReservation(null);
      setReviewQueue([]);
      setReviewIndex(0);
    }
  };
  const handleSkipReview = () => {
    const nextIndex = reviewIndex + 1;

    if (nextIndex < reviewQueue.length) {
      setReviewIndex(nextIndex);
      setSelectedReservation(reviewQueue[nextIndex]);
      setReviewModalOpen(true);
    } else {
      setReviewModalOpen(false);
      setSelectedReservation(null);
      setReviewQueue([]);
      setReviewIndex(0);
    }
  };

  const pendingReviews = useMemo(() => {
    return clientReservations.filter((r: any) => r.status === "DONE" && !r.review);
  }, [clientReservations]);

  const startReviewQueue = () => {
    setReviewQueue(pendingReviews);
    setReviewIndex(0);

    if (pendingReviews.length > 0) {
      setSelectedReservation(pendingReviews[0]);
      setReviewModalOpen(true);
    }
  };

  const upClient = clientReservations.filter((r) => r.status === "CONFIRMED");
  const histClient = clientReservations.filter((r) => r.status !== "CONFIRMED");

  const upTrainer = trainerReservations.filter((r) => r.status === "CONFIRMED");
  const histTrainer = trainerReservations.filter((r) => r.status !== "CONFIRMED");

  if (loading)
    return (
      <div className="p-8 text-center text-zinc-500 italic">Synchronizacja Twoich planów...</div>
    );

  const ReservationItem = ({ res, type }: { res: any; type: "as_client" | "as_trainer" }) => {
    const isTrainer = type === "as_trainer";
    const trainerProfile = res.assignment?.trainerProfile;
    const displayName = isTrainer
      ? res.user?.email
      : trainerProfile?.firstName
        ? `${trainerProfile.firstName} ${trainerProfile.lastName}`
        : "Trener";

    return (
      <div
        className={`p-4 rounded-xl border transition-colors border-zinc-800 ${
          res.status === "CANCELLED"
            ? "bg-red-500/5 opacity-70"
            : res.status === "DONE"
              ? "bg-zinc-950 opacity-80"
              : "bg-zinc-900 shadow-lg shadow-emerald-500/5"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="font-bold text-sm text-zinc-400">
              {new Date(res.date).toLocaleDateString()} | {res.startHour}:00 - {res.endHour}:00
            </p>
            <p className="text-xs text-zinc-400">
              {isTrainer ? "Klient: " : "Trener: "}{" "}
              <span className="text-zinc-200">{displayName}</span>
            </p>
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-tighter">
              📍 {res.assignment?.gym?.name}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-black tracking-widest ${
                res.status === "CANCELLED"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : res.status === "DONE"
                    ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {res.status === "CANCELLED"
                ? "Anulowano"
                : res.status === "DONE"
                  ? "Odbył się"
                  : "Nadchodzący"}
            </span>
            {res.status === "CONFIRMED" && (
              <button
                onClick={() => handleCancel(res.id)}
                className="text-[10px] text-zinc-500 hover:text-red-500 transition-colors underline cursor-pointer"
              >
                Anuluj
              </button>
            )}{" "}
            {res.status === "DONE" && !isTrainer && !res.review && (
              <button
                onClick={() => handleOpenReviewModal(res)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors underline cursor-pointer"
              >
                Oceń trenera
              </button>
            )}{" "}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 md:p-8">
      <Card className="w-full max-w-4xl bg-black border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="pt-10 pb-6 space-y-6 text-center">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Moje rezerwacje
          </h1>
          {pendingReviews.length > 0 && (
            <div className="mx-auto max-w-md rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4">
              <p className="text-xs uppercase font-black tracking-widest text-yellow-400 mb-2">
                Masz {pendingReviews.length} treningów do oceny
              </p>

              <button
                onClick={startReviewQueue}
                className="px-5 py-2 rounded-xl bg-yellow-500 text-black text-xs font-black uppercase hover:scale-105 transition-all cursor-pointer"
              >
                Oceń teraz
              </button>
            </div>
          )}

          <div className="flex justify-center p-1.5 bg-zinc-900/80 rounded-2xl border border-zinc-800 w-fit mx-auto">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-8 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${activeTab === "upcoming" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Nadchodzące ({upClient.length + upTrainer.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-8 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${activeTab === "history" ? "bg-zinc-700 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Historia ({histClient.length + histTrainer.length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-10 pb-16 px-6 md:px-12">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Moje rezerwacje
              </h2>
              <div className="h-px bg-zinc-800 flex-grow"></div>
            </div>
            <div className="grid gap-3">
              {(activeTab === "upcoming" ? upClient : histClient).length === 0 ? (
                <p className="text-center py-6 text-zinc-700 text-xs italic">
                  Brak rezerwacji w tej sekcji.
                </p>
              ) : (
                (activeTab === "upcoming" ? upClient : histClient).map((res) => (
                  <ReservationItem key={res.id} res={res} type="as_client" />
                ))
              )}
            </div>
          </div>

          {user?.role === "TRAINER" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                  Treningi, które prowadzę
                </h2>
                <div className="h-px bg-zinc-800 flex-grow"></div>
              </div>
              <div className="grid gap-3">
                {(activeTab === "upcoming" ? upTrainer : histTrainer).length === 0 ? (
                  <p className="text-center py-6 text-zinc-700 text-xs italic">
                    Brak rezerwacji w tej sekcji.
                  </p>
                ) : (
                  (activeTab === "upcoming" ? upTrainer : histTrainer).map((res) => (
                    <ReservationItem key={res.id} res={res} type="as_trainer" />
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        reservation={selectedReservation}
        onSuccess={handleReviewSuccess}
        onSkip={handleSkipReview}
        currentIndex={reviewIndex}
        totalCount={reviewQueue.length}
      />
    </div>
  );
};
