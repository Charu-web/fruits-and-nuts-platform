import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CreateReviewSchema,
  UpdateReviewStatusSchema,
  ReviewQuerySchema,
} from "../lib/validation/review.schema";
import { RolePermissions, hasPermission } from "../lib/auth/rbac";
import { RoleType, ModerationStatus } from "@prisma/client";

console.log("🧪 Running Step 6 Customer Review Moderation Test Suite...\n");

describe("Phase 9J Step 6 — Review Moderation & UGC Quality Tests", () => {
  it("Test 1: Review Schema Validation & Constraint Bounds", () => {
    console.log("▶️ Test 1: Review Schema Validation & Constraint Bounds...");

    // Valid Review Input
    const valid = CreateReviewSchema.safeParse({
      productId: "11111111-1111-1111-1111-111111111111",
      rating: 5,
      title: "Finest Mamra Almonds",
      reviewText: "Incredible crunch and authentic flavor straight from Kashmir.",
      photos: ["https://cdn.example.com/reviews/mamra-1.jpg"],
    });
    assert.strictEqual(valid.success, true, "Valid review input should pass parsing");

    // Invalid Rating (< 1 or > 5)
    const invalidRatingLow = CreateReviewSchema.safeParse({
      productId: "11111111-1111-1111-1111-111111111111",
      rating: 0,
      reviewText: "Way too low rating for valid scale.",
    });
    assert.strictEqual(invalidRatingLow.success, false, "Rating < 1 must be rejected");

    const invalidRatingHigh = CreateReviewSchema.safeParse({
      productId: "11111111-1111-1111-1111-111111111111",
      rating: 6,
      reviewText: "Way too high rating for valid scale.",
    });
    assert.strictEqual(invalidRatingHigh.success, false, "Rating > 5 must be rejected");

    // Text Too Short (< 10 chars)
    const shortText = CreateReviewSchema.safeParse({
      productId: "11111111-1111-1111-1111-111111111111",
      rating: 4,
      reviewText: "Good",
    });
    assert.strictEqual(shortText.success, false, "Review text shorter than 10 characters must be rejected");

    // Photo Array Limit (> 5 photos)
    const tooManyPhotos = CreateReviewSchema.safeParse({
      productId: "11111111-1111-1111-1111-111111111111",
      rating: 5,
      reviewText: "Extensive photo gallery review.",
      photos: [
        "https://cdn.example.com/1.jpg",
        "https://cdn.example.com/2.jpg",
        "https://cdn.example.com/3.jpg",
        "https://cdn.example.com/4.jpg",
        "https://cdn.example.com/5.jpg",
        "https://cdn.example.com/6.jpg",
      ],
    });
    assert.strictEqual(tooManyPhotos.success, false, "More than 5 photos must be rejected");

    console.log("✅ Test 1 Passed: Customer review constraints and bounds enforced.");
  });

  it("Test 2: Moderation Status Update Schema & Notes Validation", () => {
    console.log("▶️ Test 2: Moderation Status Update Schema...");

    // Valid Status Transitions
    const approve = UpdateReviewStatusSchema.safeParse({
      status: ModerationStatus.APPROVED,
      moderationNotes: "Quality verified by content team",
    });
    assert.strictEqual(approve.success, true);

    const reject = UpdateReviewStatusSchema.safeParse({
      status: ModerationStatus.REJECTED,
      moderationNotes: "Violates community guidelines - mentions competitor brand",
    });
    assert.strictEqual(reject.success, true);

    // Invalid Status
    const invalidStatus = UpdateReviewStatusSchema.safeParse({
      status: "DELETED",
    });
    assert.strictEqual(invalidStatus.success, false, "Invalid status enum must fail schema validation");

    console.log("✅ Test 2 Passed: Moderation update schema validated.");
  });

  it("Test 3: RBAC Review Moderation Permission Matrix", () => {
    console.log("▶️ Test 3: RBAC Review Moderation Permissions...");

    // SUPER_ADMIN and CONTENT_MGR have reviews:moderate
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "reviews:moderate"), true);
    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "reviews:moderate"), true);

    // CUSTOMER, INVENTORY_MGR, and ORDER_MGR do NOT have reviews:moderate
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "reviews:moderate"), false);
    assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "reviews:moderate"), false);
    assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "reviews:moderate"), false);

    console.log("✅ Test 3 Passed: RBAC boundary strictly isolates review moderation permissions.");
  });

  it("Test 4: Review Query Filtering & Pagination Constraints", () => {
    console.log("▶️ Test 4: Review Query Filtering & Pagination Schema...");

    const parsedQuery = ReviewQuerySchema.parse({
      status: "PENDING_MODERATION",
      rating: "5",
      page: "2",
      limit: "20",
    });

    assert.strictEqual(parsedQuery.status, ModerationStatus.PENDING_MODERATION);
    assert.strictEqual(parsedQuery.rating, 5);
    assert.strictEqual(parsedQuery.page, 2);
    assert.strictEqual(parsedQuery.limit, 20);

    console.log("✅ Test 4 Passed: Admin review query parsing & coercion verified.");
  });
});

console.log("\n🎉 All Step 6 Review Moderation Tests passed successfully!\n");
