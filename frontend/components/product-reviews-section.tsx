"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type ReviewStats = {
  total: number;
  avgRating: number;
  distribution: { star: number; count: number; percent: number }[];
};

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  user: { name: string | null; avatarUrl?: string | null };
};

type ReviewPayload = {
  reviews: ReviewRow[];
  stats: ReviewStats;
};

type CanReviewPayload = {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  reviewStatus: string | null;
};

const EMPTY_REVIEW_PAYLOAD: ReviewPayload = {
  reviews: [],
  stats: {
    total: 0,
    avgRating: 0,
    distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, percent: 0 })),
  },
};

function Stars({
  rating,
  max = 5,
  interactive = false,
  onRate,
}: {
  rating: number;
  max?: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = interactive ? star <= (hover || rating) : star <= rating;

        return (
          <span
            key={star}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRate?.(star);
                    }
                  }
                : undefined
            }
            onClick={() => interactive && onRate?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            style={{
              fontSize: interactive ? "28px" : "18px",
              color: filled ? "#f7e047" : "#2a2a2a",
              cursor: interactive ? "pointer" : "default",
              transition: "color 0.1s",
              lineHeight: 1,
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

const RATING_LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

type Props = {
  productId: string;
  loginHref: string;
};

export function ProductReviewsSection({ productId, loginHref }: Props) {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [reviewData, setReviewData] = useState<ReviewPayload | null>(null);
  const [canReview, setCanReview] = useState<CanReviewPayload | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  const loadPublicReviews = useCallback(() => {
    void apiFetch<ReviewPayload>(`/reviews/product/${productId}`, { skipAuth: true })
      .then(setReviewData)
      .catch(() => setReviewData(EMPTY_REVIEW_PAYLOAD));
  }, [productId]);

  useEffect(() => {
    loadPublicReviews();
  }, [loadPublicReviews]);

  useEffect(() => {
    if (!productId || authLoading || !isLoggedIn) return;
    void apiFetch<CanReviewPayload>(`/reviews/can-review/${productId}`)
      .then(setCanReview)
      .catch(() => {});
  }, [isLoggedIn, authLoading, productId]);

  const handleSubmit = async () => {
    if (form.body.length < 10) return;
    setSubmitting(true);
    setSubmitMsg("");
    try {
      await apiFetch(`/reviews/product/${productId}`, {
        method: "POST",
        body: JSON.stringify({
          rating: form.rating,
          title: form.title.trim() || undefined,
          body: form.body.trim(),
        }),
      });
      setSubmitMsg(
        "✅ ¡Gracias! Tu reseña está pendiente de aprobación y se publicará pronto.",
      );
      setShowForm(false);
      setCanReview((prev) =>
        prev
          ? {
              ...prev,
              canReview: false,
              hasReviewed: true,
              reviewStatus: "PENDING",
            }
          : prev,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Error";
      setSubmitMsg(`❌ ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      style={{
        marginTop: "64px",
        paddingTop: "40px",
        borderTop: "1px solid #2a2a2a",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(20px, 4vw, 28px)",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "4px",
            margin: 0,
          }}
        >
          Reseñas
          <span style={{ color: "#d91920" }}> ({reviewData?.stats?.total ?? 0})</span>
        </h2>

        {canReview?.canReview && !showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-brand-outline"
            style={{ fontSize: "12px" }}
          >
            ✍️ Escribir reseña
          </button>
        ) : null}
      </div>

      {reviewData && reviewData.stats.total > 0 ? (
        <div
          style={{
            display: "flex",
            gap: "32px",
            alignItems: "center",
            marginBottom: "32px",
            padding: "20px",
            background: "#111111",
            border: "1px solid #2a2a2a",
            flexWrap: "wrap",
          }}
        >
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "56px",
                color: "#f7e047",
                margin: "0 0 4px",
                lineHeight: 1,
              }}
            >
              {reviewData.stats.avgRating}
            </p>
            <Stars rating={Math.round(reviewData.stats.avgRating)} />
            <p style={{ color: "#52525b", fontSize: "12px", marginTop: "4px" }}>
              {reviewData.stats.total} reseña{reviewData.stats.total !== 1 ? "s" : ""}
            </p>
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            {reviewData.stats.distribution.map((d) => (
              <div
                key={d.star}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    color: "#f7e047",
                    fontSize: "12px",
                    width: "12px",
                    textAlign: "right",
                  }}
                >
                  {d.star}
                </span>
                <span style={{ color: "#f7e047", fontSize: "12px" }}>★</span>
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    background: "#2a2a2a",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${d.percent}%`,
                      background: "#f7e047",
                      borderRadius: "4px",
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
                <span style={{ color: "#52525b", fontSize: "11px", width: "28px" }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {submitMsg ? (
        <div
          style={{
            padding: "14px 16px",
            background: submitMsg.includes("✅") ? "rgba(34,197,94,0.1)" : "rgba(217,25,32,0.1)",
            border: `1px solid ${submitMsg.includes("✅") ? "#22c55e" : "#d91920"}`,
            marginBottom: "24px",
            color: submitMsg.includes("✅") ? "#22c55e" : "#d91920",
            fontSize: "13px",
          }}
        >
          {submitMsg}
        </div>
      ) : null}

      {!isLoggedIn && !authLoading ? (
        <div
          style={{
            padding: "16px",
            background: "#111111",
            border: "1px solid #2a2a2a",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#a1a1aa", fontSize: "13px", margin: "0 0 12px" }}>
            Iniciá sesión para dejar tu reseña
          </p>
          <a href={loginHref} className="btn-brand-outline" style={{ fontSize: "12px" }}>
            Iniciar sesión
          </a>
        </div>
      ) : null}

      {canReview?.hasReviewed && canReview?.reviewStatus === "PENDING" ? (
        <div
          style={{
            padding: "14px 16px",
            background: "rgba(247,224,71,0.1)",
            border: "1px solid #f7e047",
            marginBottom: "24px",
            color: "#f7e047",
            fontSize: "13px",
          }}
        >
          ⏳ Tu reseña está pendiente de aprobación. Se publicará pronto.
        </div>
      ) : null}

      {canReview?.hasPurchased === false && isLoggedIn ? (
        <div
          style={{
            padding: "14px 16px",
            background: "#111111",
            border: "1px solid #2a2a2a",
            marginBottom: "24px",
            color: "#52525b",
            fontSize: "13px",
          }}
        >
          💡 Solo podés reseñar productos que hayas comprado.
        </div>
      ) : null}

      {showForm && canReview?.canReview ? (
        <div
          style={{
            padding: "24px",
            background: "#111111",
            border: "1px solid #2a2a2a",
            marginBottom: "32px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              color: "#f7e047",
              fontSize: "12px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            Tu calificación
          </p>

          <div style={{ marginBottom: "16px" }}>
            <Stars
              rating={form.rating}
              interactive={true}
              onRate={(r) => setForm({ ...form, rating: r })}
            />
            <p style={{ color: "#52525b", fontSize: "12px", marginTop: "6px" }}>
              {RATING_LABELS[form.rating] ?? ""}
            </p>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                color: "#a1a1aa",
                fontSize: "12px",
                display: "block",
                marginBottom: "6px",
                fontFamily: "var(--font-display)",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Título (opcional)
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Resumen de tu experiencia"
              className="input-brand"
              style={{ width: "100%" }}
              maxLength={100}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                color: "#a1a1aa",
                fontSize: "12px",
                display: "block",
                marginBottom: "6px",
                fontFamily: "var(--font-display)",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Tu reseña *
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Contá tu experiencia con el producto (mínimo 10 caracteres)"
              className="input-brand"
              style={{ width: "100%", minHeight: "100px", resize: "vertical" }}
              maxLength={500}
            />
            <p style={{ color: "#52525b", fontSize: "11px", textAlign: "right", marginTop: "4px" }}>
              {form.body.length}/500
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || form.body.trim().length < 10}
              className="btn-brand"
              style={{ flex: 1, minWidth: "140px" }}
            >
              {submitting ? "Enviando..." : "Enviar reseña"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-brand-outline">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {reviewData === null ? (
        <p style={{ color: "#52525b", fontSize: "13px", textAlign: "center", padding: "24px" }}>
          Cargando reseñas…
        </p>
      ) : reviewData.reviews.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reviewData.reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: "20px",
                background: "#111111",
                border: "1px solid #2a2a2a",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {review.user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.user.avatarUrl}
                        alt=""
                        width={36}
                        height={36}
                        style={{
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #d91920",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "#1a1a1a",
                          border: "2px solid #d91920",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#f7e047",
                          fontFamily: "var(--font-display)",
                          fontSize: "14px",
                          flexShrink: 0,
                        }}
                      >
                        {(review.user?.name?.charAt(0) ?? "U").toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p
                        style={{
                          color: "#e4e4e7",
                          fontSize: "13px",
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        {review.user?.name ?? "Cliente"}
                      </p>
                      <p style={{ color: "#52525b", fontSize: "11px", margin: 0 }}>
                        Compra verificada ✓
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Stars rating={review.rating} />
                  <p style={{ color: "#52525b", fontSize: "11px", marginTop: "4px" }}>
                    {new Date(review.createdAt).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {review.title ? (
                <p
                  style={{
                    color: "#f7e047",
                    fontFamily: "var(--font-display)",
                    fontSize: "14px",
                    letterSpacing: "1px",
                    margin: "0 0 8px",
                  }}
                >
                  {review.title}
                </p>
              ) : null}

              <p style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                {review.body}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "40px 24px",
            color: "#52525b",
          }}
        >
          <p style={{ fontSize: "40px", marginBottom: "12px" }}>⭐</p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "8px",
              color: "#3f3f46",
            }}
          >
            Sin reseñas aún
          </p>
          <p style={{ fontSize: "13px" }}>Sé el primero en opinar sobre este producto</p>
        </div>
      )}
    </section>
  );
}
