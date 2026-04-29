"use client";

import { useState } from "react";
import { reviews as reviewsApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assetUrl } from "@/lib/utils";
import type { User, Review } from "@/lib/api";

interface Props {
  productId: number;
  user: User | null;
  initialReviews: Review[];
  onAvgRatingChange: (avg: { average: number; count: number } | null) => void;
}

export function ProductReviews({ productId, user, initialReviews, onAvgRatingChange }: Props) {
  const [productReviews, setProductReviews] = useState<Review[]>(initialReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editReviewImages, setEditReviewImages] = useState<File[]>([]);
  const [editReviewLoading, setEditReviewLoading] = useState(false);
  const [editReviewError, setEditReviewError] = useState("");

  const refreshAvg = async () => {
    const avg = await reviewsApi.average(productId).catch(() => null);
    onAvgRatingChange(avg);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    setReviewLoading(true);
    try {
      const r = await reviewsApi.create({
        product_id: productId,
        rating,
        comment: comment || undefined,
        images: reviewImages.length ? reviewImages : undefined,
      });
      setProductReviews((prev) => [r, ...prev]);
      setComment("");
      setRating(5);
      setReviewImages([]);
      setShowReviewForm(false);
      await refreshAvg();
    } catch (err: any) {
      setReviewError(err.message || "Erreur");
    } finally {
      setReviewLoading(false);
    }
  };

  const openEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setEditReviewImages([]);
    setEditReviewError("");
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditReviewImages([]);
    setEditReviewError("");
  };

  const submitEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewId) return;
    setEditReviewError("");
    setEditReviewLoading(true);
    try {
      const updated = await reviewsApi.update(editingReviewId, {
        rating: editRating,
        comment: editComment || undefined,
        images: editReviewImages.length ? editReviewImages : undefined,
      });
      setProductReviews((prev) => prev.map((rev) => (rev.id === updated.id ? updated : rev)));
      setEditingReviewId(null);
      setEditReviewImages([]);
      await refreshAvg();
    } catch (err: any) {
      setEditReviewError(err.message || "Erreur");
    } finally {
      setEditReviewLoading(false);
    }
  };

  return (
    <section className="mt-16 border-t border-stone-200 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-light tracking-tight text-stone-900">Avis clients</h2>
        {user && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="border-b border-stone-200 pb-0.5 text-xs text-stone-500 hover:border-stone-800 hover:text-stone-800"
          >
            + écrire un avis
          </button>
        )}
      </div>

      {/* Review form */}
      {user && showReviewForm && (
        <div className="mb-8 border border-stone-200 bg-stone-50 p-5">
          <form onSubmit={submitReview} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-stone-400">nouvel avis</p>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            {reviewError && (
              <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent">
                <AlertDescription>{reviewError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-xs text-stone-500">note</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRating(r)}
                    className={`text-2xl ${r <= rating ? "text-stone-800" : "text-stone-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-stone-500">commentaire</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="votre avis (minimum 10 caractères)..."
                rows={3}
                className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-stone-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-stone-500">photos (optionnel, max 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setReviewImages(Array.from(e.target.files || []).slice(0, 5))}
                className="block w-full text-xs text-stone-600 file:mr-3 file:border file:border-stone-300 file:bg-stone-50 file:px-2 file:py-1 file:text-xs file:text-stone-600"
              />
              {reviewImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reviewImages.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(f)} alt="" className="h-14 w-14 border border-stone-200 object-cover" />
                      <button
                        type="button"
                        onClick={() => setReviewImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center border border-stone-300 bg-white text-xs text-stone-600 hover:bg-stone-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={reviewLoading}
              className="border border-stone-800 bg-stone-800 px-4 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
            >
              {reviewLoading ? "envoi..." : "publier l'avis"}
            </button>
          </form>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {productReviews.length === 0 ? (
          <p className="text-sm italic text-stone-400">— aucun avis pour ce produit —</p>
        ) : (
          productReviews.map((rev) => (
            <div key={rev.id} className="border border-stone-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex text-stone-600">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-sm">
                        {i < rev.rating ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-stone-400">
                    {new Date(rev.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <span className="text-stone-300">|</span>
                  <span className="text-xs text-stone-500">
                    {user && rev.user_id === user.id
                      ? "vous"
                      : rev.reviewer_name || `utilisateur #${rev.user_id}`}
                  </span>
                </div>
                {user && rev.user_id === user.id && editingReviewId !== rev.id && (
                  <button
                    onClick={() => openEditReview(rev)}
                    className="text-xs text-stone-400 hover:text-stone-700"
                  >
                    modifier
                  </button>
                )}
              </div>

              {editingReviewId === rev.id ? (
                <form onSubmit={submitEditReview} className="mt-3 space-y-3 border-t border-stone-200 pt-3">
                  {editReviewError && (
                    <Alert variant="destructive" className="rounded-none border border-stone-300 bg-transparent">
                      <AlertDescription>{editReviewError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-stone-500">note</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setEditRating(r)}
                          className={`text-2xl ${r <= editRating ? "text-stone-800" : "text-stone-300"}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-stone-500">commentaire</label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={3}
                      className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-stone-500">remplacer les photos (optionnel, max 5)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        setEditReviewImages(Array.from(e.target.files || []).slice(0, 5))
                      }
                      className="block w-full text-xs text-stone-600 file:mr-3 file:border file:border-stone-300 file:bg-stone-50 file:px-2 file:py-1 file:text-xs file:text-stone-600"
                    />
                    {editReviewImages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editReviewImages.map((f, i) => (
                          <div key={i} className="relative">
                            <img
                              src={URL.createObjectURL(f)}
                              alt=""
                              className="h-14 w-14 border border-stone-200 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEditReviewImages((prev) => prev.filter((_, j) => j !== i))
                              }
                              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center border border-stone-300 bg-white text-xs text-stone-600 hover:bg-stone-100"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={editReviewLoading}
                      className="border border-stone-800 bg-stone-800 px-3 py-1.5 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
                    >
                      {editReviewLoading ? "enregistrement..." : "sauvegarder"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditReview}
                      className="border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800"
                    >
                      annuler
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {rev.comment && (
                    <p className="mt-2 text-sm text-stone-600">{rev.comment}</p>
                  )}
                  {rev.images && rev.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rev.images.map((img) => (
                        <a
                          key={img.id}
                          href={assetUrl(img.image_url, "review-images")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={assetUrl(img.image_url, "review-images")}
                            alt=""
                            className="h-20 w-20 border border-stone-200 object-cover transition-opacity hover:opacity-90"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
