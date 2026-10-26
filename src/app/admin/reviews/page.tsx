"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";

interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  reviewText: string;
  photos: string[] | null;
  isVerifiedBuyer: boolean;
  moderationStatus: "PENDING_MODERATION" | "APPROVED" | "REJECTED";
  createdAt: string;
  product: {
    id: string;
    name: string;
    skuBase: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
    phone: string | null;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_MODERATION");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("SPAM_INAPPROPRIATE");
  const [moderationNotes, setModerationNotes] = useState("");
  const [isSubmittingModeration, startSubmittingModeration] = useTransition();

  // Photo Lightbox Modal
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Fetch Current User
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.data?.role) {
            setUserRole(data.data.role.name || data.data.role);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user context", err);
      }
    }
    fetchMe();
  }, []);

  const canModerate = ["SUPER_ADMIN", "CONTENT_MGR"].includes(userRole);

  // Fetch Reviews
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (ratingFilter !== "ALL") params.set("rating", ratingFilter);

      const res = await fetch(`/api/v1/admin/reviews?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to load reviews");
      }
      const data = await res.json();
      setReviews(data.data?.reviews || []);
      if (data.data?.pagination) {
        setTotalCount(data.data.pagination.total || 0);
        setTotalPages(data.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Client-side search filtering (by reviewer email, name, product, text)
  const filteredReviews = reviews.filter((r) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const productName = r.product?.name?.toLowerCase() || "";
    const sku = r.product?.skuBase?.toLowerCase() || "";
    const email = r.user?.email?.toLowerCase() || "";
    const text = r.reviewText?.toLowerCase() || "";
    const title = r.title?.toLowerCase() || "";
    return productName.includes(query) || sku.includes(query) || email.includes(query) || text.includes(query) || title.includes(query);
  });

  // Handle Approve Action
  const handleApprove = (review: ReviewItem) => {
    startSubmittingModeration(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/reviews/${review.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "APPROVED",
            moderationNotes: "Approved by administrator for storefront publication",
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to approve review");
        }

        setSuccessMessage(`Review for "${review.product.name}" approved and published to storefront!`);
        fetchReviews();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to update review status");
      }
    });
  };

  // Handle Reject Action Submit
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    startSubmittingModeration(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/reviews/${selectedReview.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "REJECTED",
            moderationNotes: `[Reason: ${rejectReason}] ${moderationNotes.trim() || "Violates review guidelines"}`,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to reject review");
        }

        setSuccessMessage(`Review rejected and hidden from storefront.`);
        setIsRejectModalOpen(false);
        setSelectedReview(null);
        setModerationNotes("");
        fetchReviews();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to reject review");
      }
    });
  };

  // Handle Delete Action
  const handleDelete = (review: ReviewItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete this review for "${review.product.name}"? This action is logged.`
    );
    if (!confirmDelete) return;

    startSubmittingModeration(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/reviews/${review.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to delete review");
        }

        setSuccessMessage(`Review permanently deleted from system.`);
        fetchReviews();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to delete review");
      }
    });
  };

  // Render Star Icons
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-300 fill-neutral-100"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Customer Review Moderation
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Quality & Trust Station
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Authoritative moderation queue, verified buyer verification, UGC customer photo screening, and storefront publishing.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          <svg className={`h-4 w-4 ${loading ? "animate-spin text-amber-600" : "text-neutral-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Queue
        </button>
      </div>

      {/* Role Notice */}
      {!canModerate && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Read-Only View:</strong> Your role ({userRole}) has view-only permissions for reviews. Review moderation requires <code className="font-mono font-semibold">SUPER_ADMIN</code> or <code className="font-mono font-semibold">CONTENT_MGR</code> authorization.
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews by product, customer, text..."
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Moderation Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_MODERATION">Pending Queue</option>
              <option value="APPROVED">Approved (Live)</option>
              <option value="REJECTED">Rejected (Hidden)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {(statusFilter !== "PENDING_MODERATION" || ratingFilter !== "ALL" || search) && (
            <button
              onClick={() => {
                setStatusFilter("PENDING_MODERATION");
                setRatingFilter("ALL");
                setSearch("");
                setPage(1);
              }}
              className="text-xs font-medium text-amber-600 hover:text-amber-800"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Reviews Stream / Listing */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
            <svg className="mx-auto h-8 w-8 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="mt-3 text-sm">Loading moderation queue...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
            <svg className="mx-auto h-10 w-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 font-bold text-neutral-800">No reviews matching criteria</h3>
            <p className="text-xs text-neutral-400 mt-1">The current moderation queue is clear.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Product & Reviewer Header */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/products`}
                      className="font-bold text-neutral-900 hover:text-amber-600 hover:underline"
                    >
                      {review.product.name}
                    </Link>
                    <span className="font-mono text-xs text-neutral-500">({review.product.skuBase})</span>

                    {/* Status Badge */}
                    {review.moderationStatus === "PENDING_MODERATION" && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                        PENDING MODERATION
                      </span>
                    )}
                    {review.moderationStatus === "APPROVED" && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                        APPROVED (LIVE)
                      </span>
                    )}
                    {review.moderationStatus === "REJECTED" && (
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-600/20">
                        REJECTED (HIDDEN)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span>
                      Reviewer: <strong className="text-neutral-700">{review.user.email}</strong>
                    </span>
                    {review.isVerifiedBuyer && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <svg className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Buyer
                      </span>
                    )}
                    <span>•</span>
                    <span>
                      {new Date(review.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Moderation Actions */}
                {canModerate && (
                  <div className="flex items-center gap-2">
                    {review.moderationStatus !== "APPROVED" && (
                      <button
                        onClick={() => handleApprove(review)}
                        disabled={isSubmittingModeration}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                    )}

                    {review.moderationStatus !== "REJECTED" && (
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setIsRejectModalOpen(true);
                        }}
                        disabled={isSubmittingModeration}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-50 disabled:opacity-50"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(review)}
                      disabled={isSubmittingModeration}
                      title="Permanently Delete Review"
                      className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-rose-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Review Content & Stars */}
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  {review.title && <span className="font-bold text-neutral-900 text-sm">{review.title}</span>}
                </div>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                  {review.reviewText}
                </p>
              </div>

              {/* UGC Photos Grid */}
              {Array.isArray(review.photos) && review.photos.length > 0 && (
                <div className="mt-4 border-t border-neutral-100 pt-3">
                  <span className="text-xs font-semibold text-neutral-500">Customer Uploaded Photos:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {review.photos.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => setActivePhotoUrl(photo)}
                        className="group relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <img src={photo} alt="UGC review photo" className="h-full w-full object-cover group-hover:scale-105 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-6 py-4 rounded-xl shadow-sm text-xs text-neutral-500">
        <div>
          Showing page <span className="font-semibold">{page}</span> of{" "}
          <span className="font-semibold">{totalPages}</span> ({totalCount} total reviews in system)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-3 py-1.5 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-3 py-1.5 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REJECT REVIEW WITH AUDIT REASON */}
      {/* ========================================================================= */}
      {isRejectModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-bold text-neutral-900">Reject Customer Review</h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-neutral-500">Target Product:</span>
                <p className="font-semibold text-neutral-900">{selectedReview.product.name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Rejection Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 focus:border-rose-500 focus:outline-none"
                >
                  <option value="SPAM_INAPPROPRIATE">Inappropriate / Profane Language</option>
                  <option value="IRRELEVANT_CONTENT">Irrelevant to Product (Courier/Logistics only)</option>
                  <option value="COMPETITOR_PROMOTION">Competitor Promotion / False Claim</option>
                  <option value="DUPLICATE_SUBMISSION">Duplicate / Fraudulent Submission</option>
                  <option value="INCORRECT_PRODUCT">Review Mentions Incorrect Product</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Audit Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  placeholder="Internal justification logged in audit trail..."
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModeration}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmittingModeration && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UGC PHOTO LIGHTBOX */}
      {/* ========================================================================= */}
      {activePhotoUrl && (
        <div
          onClick={() => setActivePhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2">
            <img src={activePhotoUrl} alt="Enlarged UGC" className="max-h-[80vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
