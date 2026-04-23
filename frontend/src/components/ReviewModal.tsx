import { useState } from "react";
import { reviewsService } from "../api/reviewsService";
import { RatingStars } from "./RatingStars";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation?: {
    id: number;
    date?: string;
    startHour?: number;
    endHour?: number;
    assignment: {
      trainerProfile: {
        firstName?: string;
        lastName?: string;
      };
    };
  };
  onSuccess?: () => void;
  onSkip?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export const ReviewModal = ({
  isOpen,
  onClose,
  reservation,
  onSuccess,
  onSkip,
  currentIndex = 0,
  totalCount = 1,
}: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [opinion, setOpinion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trainerName = reservation?.assignment.trainerProfile
    ? `${reservation.assignment.trainerProfile.firstName} ${reservation.assignment.trainerProfile.lastName}`
    : "Trener";
  const trainingDate = reservation?.date ? new Date(reservation.date).toLocaleDateString() : "";

  const trainingHours =
    reservation?.startHour !== undefined
      ? `${reservation.startHour}:00 - ${reservation.endHour}:00`
      : "";

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Proszę wybrać ocenę");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await reviewsService.addReview({
        reservationId: reservation!.id,
        rating,
        opinion: opinion || undefined,
      });

      if (res && !res.error) {
        setRating(0);
        setOpinion("");
        onClose();
        onSuccess?.();
      } else {
        setError(res?.error || "Błąd przy dodawaniu recenzji");
      }
    } catch (err) {
      setError("Błąd przy dodawaniu recenzji");
    } finally {
      setLoading(false);
    }
  };
  const handleSkip = () => {
    setRating(0);
    setOpinion("");
    setError("");
    onClose();
    onSkip?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white space-y-1">
            <div>Oceń {trainerName}</div>

            {totalCount > 0 && (
              <div className="text-xs text-emerald-400 font-normal">
                Ocena {currentIndex + 1} z {totalCount}
              </div>
            )}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {trainingDate} • {trainingHours}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium text-zinc-300 mb-3">Ocena:</p>
            <RatingStars rating={rating} onRatingChange={setRating} interactive={true} size="lg" />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Komentarz (opcjonalnie)
            </label>
            <Textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value.slice(0, 500))}
              placeholder="Czego się nauczyłeś? Jak się czuł trening?"
              className="bg-zinc-900 border-zinc-800 text-white resize-none"
              maxLength={500}
            />
            <p className="text-[10px] text-zinc-500 mt-1">{opinion.length}/500 znaków</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-2 rounded text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              onClick={handleSkip}
              variant="outline"
              disabled={loading}
              className="border-zinc-700 text-zinc-400 hover:text-white"
            >
              Nie teraz
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="border-zinc-700 text-zinc-400 hover:text-white"
            >
              Zamknij
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? "Wysyłanie..." : "Wyślij ocenę"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
