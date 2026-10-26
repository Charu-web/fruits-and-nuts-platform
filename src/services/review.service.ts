import db from "@/lib/db";
import { AppError } from "@/lib/errors/app-error";
import { ModerationStatus, OrderStatus, Prisma } from "@prisma/client";
import {
  CreateReviewInput,
  CreateReviewSchema,
  UpdateReviewStatusInput,
  UpdateReviewStatusSchema,
  ReviewQueryInput,
  ReviewQuerySchema,
} from "@/lib/validation/review.schema";

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class ReviewService {
  /**
   * Submits a customer review for moderation.
   * Validates product existence, verified buyer status against delivered order items, and duplicate submissions.
   */
  static async submitReview(userId: string, input: CreateReviewInput) {
    const validated = CreateReviewSchema.parse(input);

    // 1. Verify product exists and is active
    const product = await db.product.findUnique({
      where: { id: validated.productId },
      select: { id: true, isActive: true },
    });

    if (!product || !product.isActive) {
      throw AppError.notFound("Product", validated.productId);
    }

    // 2. Validate Verified Buyer Status & Order Item Linkage
    let isVerifiedBuyer = false;
    let validOrderItemId: string | null = null;

    if (validated.orderItemId) {
      const orderItem = await db.orderItem.findUnique({
        where: { id: validated.orderItemId },
        include: {
          order: {
            select: {
              userId: true,
              orderStatus: true,
            },
          },
          reviews: true,
        },
      });

      if (!orderItem) {
        throw AppError.notFound("OrderItem", validated.orderItemId);
      }

      if (orderItem.order.userId !== userId) {
        throw AppError.forbidden("You can only review items from your own orders.");
      }

      if (orderItem.productId !== validated.productId) {
        throw AppError.validation("Order item does not match the specified product.");
      }

      if (orderItem.order.orderStatus !== OrderStatus.DELIVERED) {
        throw AppError.validation("Reviews can only be linked to delivered order items.");
      }

      if (orderItem.reviews.length > 0) {
        throw AppError.conflict("You have already submitted a review for this purchased item.");
      }

      isVerifiedBuyer = true;
      validOrderItemId = orderItem.id;
    } else {
      // Check if the user has any delivered purchase of this product
      const deliveredPurchase = await db.orderItem.findFirst({
        where: {
          productId: validated.productId,
          order: {
            userId: userId,
            orderStatus: OrderStatus.DELIVERED,
          },
        },
      });

      if (deliveredPurchase) {
        isVerifiedBuyer = true;
      }
    }

    // 3. Create Review in PENDING_MODERATION state
    const review = await db.review.create({
      data: {
        userId,
        productId: validated.productId,
        orderItemId: validOrderItemId,
        rating: validated.rating,
        title: validated.title,
        reviewText: validated.reviewText,
        photos: validated.photos && validated.photos.length > 0 ? validated.photos : undefined,
        isVerifiedBuyer,
        moderationStatus: ModerationStatus.PENDING_MODERATION,
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return review;
  }

  /**
   * Retrieves approved public reviews for a product with rating aggregation and distribution metrics.
   */
  static async getProductReviews(idOrSlug: string, queryInput?: Partial<ReviewQueryInput>) {
    const query = ReviewQuerySchema.parse(queryInput || {});

    // Resolve product ID if slug provided
    let productId = query.productId;
    if (!productId) {
      const product = await db.product.findFirst({
        where: {
          OR: [{ id: idOrSlug.match(/^[0-9a-fA-F-]{36}$/) ? idOrSlug : undefined }, { slug: idOrSlug }],
        },
        select: { id: true },
      });

      if (!product) {
        throw AppError.notFound("Product", idOrSlug);
      }
      productId = product.id;
    }

    // Build query conditions (Storefront only receives APPROVED reviews)
    const whereClause: Record<string, unknown> = {
      productId,
      moderationStatus: ModerationStatus.APPROVED,
    };

    if (query.rating) {
      whereClause.rating = query.rating;
    }

    const sortOrder: "asc" | "desc" = query.sortBy === "lowest" ? "asc" : "desc";
    const orderByClause = query.sortBy === "recent" ? { createdAt: "desc" as const } : { rating: sortOrder };

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [reviews, totalCount, allApprovedReviews] = await Promise.all([
      db.review.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
        select: {
          id: true,
          rating: true,
          title: true,
          reviewText: true,
          photos: true,
          isVerifiedBuyer: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      db.review.count({ where: whereClause }),
      db.review.findMany({
        where: {
          productId,
          moderationStatus: ModerationStatus.APPROVED,
        },
        select: { rating: true },
      }),
    ]);

    // Compute distribution and average rating
    const ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;

    for (const rev of allApprovedReviews) {
      const r = rev.rating as 1 | 2 | 3 | 4 | 5;
      if (ratingDistribution[r] !== undefined) {
        ratingDistribution[r]++;
      }
      ratingSum += rev.rating;
    }

    const totalApproved = allApprovedReviews.length;
    const averageRating = totalApproved > 0 ? Number((ratingSum / totalApproved).toFixed(1)) : 0;

    const summary: ReviewSummary = {
      averageRating,
      totalReviews: totalApproved,
      ratingDistribution,
    };

    return {
      reviews,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  /**
   * Retrieves customer's own submitted reviews.
   */
  static async getUserReviews(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { imageUrl: true, altText: true },
              },
            },
          },
        },
      }),
      db.review.count({ where: { userId } }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin listing of reviews across all products and moderation statuses.
   */
  static async getAdminReviews(queryInput?: Partial<ReviewQueryInput>) {
    const query = ReviewQuerySchema.parse(queryInput || {});
    const whereClause: Record<string, unknown> = {};

    if (query.status) {
      whereClause.moderationStatus = query.status;
    }
    if (query.productId) {
      whereClause.productId = query.productId;
    }
    if (query.rating) {
      whereClause.rating = query.rating;
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: {
            select: { id: true, name: true, skuBase: true, slug: true },
          },
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              profile: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      db.review.count({ where: whereClause }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Updates review moderation status (Approve / Reject) with admin audit logging.
   */
  static async updateModerationStatus(
    reviewId: string,
    input: UpdateReviewStatusInput,
    adminUserId?: string,
    ipAddress?: string
  ) {
    const validated = UpdateReviewStatusSchema.parse(input);

    const existing = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw AppError.notFound("Review", reviewId);
    }

    const updated = await db.review.update({
      where: { id: reviewId },
      data: {
        moderationStatus: validated.status,
      },
    });

    // Create Audit Log
    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "REVIEW_MODERATION",
        entityName: "Review",
        entityId: reviewId,
        prevState: { moderationStatus: existing.moderationStatus } as Prisma.InputJsonValue,
        newState: {
          moderationStatus: validated.status,
          notes: validated.moderationNotes,
        } as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    return updated;
  }

  /**
   * Deletes a review with audit logging.
   */
  static async deleteReview(reviewId: string, adminUserId?: string, ipAddress?: string) {
    const existing = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw AppError.notFound("Review", reviewId);
    }

    await db.review.delete({
      where: { id: reviewId },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "REVIEW_DELETED",
        entityName: "Review",
        entityId: reviewId,
        prevState: {
          productId: existing.productId,
          userId: existing.userId,
          rating: existing.rating,
        } as Prisma.InputJsonValue,
        newState: Prisma.DbNull,
        ipAddress,
      },
    });

    return { success: true, message: "Review deleted successfully" };
  }
}
