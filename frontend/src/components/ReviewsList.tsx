import { useEffect, useState } from "react";
import { reviewsService } from "../api/reviewsService";
import { RatingStars } from "./RatingStars";
import { Card, CardContent } from "./ui/card";

interface ReviewsListProps {
  trainerId: number;
}

export const ReviewsList = ({ trainerId }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reviewsData = await reviewsService.getTrainerReviews(trainerId);
        const ratingData = await reviewsService.getTrainerRating(trainerId);

        if (reviewsData && !reviewsData.error) setReviews(reviewsData);
        if (ratingData && !ratingData.error) setAvgRating(ratingData.averageRating || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainerId]);

  if (loading)
    return (
      <div className="text-center text-zinc-500 text-xs italic py-4">Ładowanie recenzji...</div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-300">Recenzje ({reviews.length})</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <RatingStars rating={Math.round(avgRating)} size="sm" />
            <span className="text-xs text-zinc-400">{avgRating.toFixed(1)}/5</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-xs text-zinc-600 italic">Brak recenzji</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <RatingStars rating={review.rating} size="sm" />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {review.opinion && <p className="text-xs text-zinc-300">{review.opinion}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
