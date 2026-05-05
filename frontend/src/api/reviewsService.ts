const API_URL = "http://localhost:5174/api/reviews";

export const reviewsService = {
  async getTrainerReviews(trainerId: number) {
    const response = await fetch(`${API_URL}/trainer/${trainerId}`);
    return response.json();
  },

  async getTrainerRating(trainerId: number) {
    const response = await fetch(`${API_URL}/trainer/${trainerId}/rating`);
    return response.json();
  },

  async addReview(data: { reservationId: number; rating: number; opinion?: string }) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async updateReview(reviewId: number, data: { rating: number; opinion?: string }) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${reviewId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteReview(reviewId: number) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/${reviewId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};
