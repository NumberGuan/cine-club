export interface Review {
  id: number;
  tmdbId: number;
  author: string;
  score: number;
  comment: string;
}

interface NewReview {
  tmdbId: number;
  author: string;
  score: number;
  comment: string;
}

const reviews: Review[] = [];
let nextReviewId = 1;

export function listReviews(tmdbId: number): Review[] {
  return reviews
    .filter((review) => review.tmdbId === tmdbId)
    .map((review) => ({ ...review }));
}

export function getAverageScore(tmdbId: number): number {
  const movieReviews = reviews.filter((review) => review.tmdbId === tmdbId);

  if (movieReviews.length === 0) {
    return 0;
  }

  const total = movieReviews.reduce((sum, review) => sum + review.score, 0);
  return Number((total / movieReviews.length).toFixed(1));
}

export function createReview(input: NewReview): Review {
  const review: Review = {
    id: nextReviewId,
    tmdbId: input.tmdbId,
    author: input.author,
    score: input.score,
    comment: input.comment,
  };

  nextReviewId += 1;
  reviews.push(review);
  return { ...review };
}

export function deleteReview(reviewId: number): boolean {
  const index = reviews.findIndex((review) => review.id === reviewId);

  if (index === -1) {
    return false;
  }

  reviews.splice(index, 1);
  return true;
}
