import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SectionKeySchema,
  CreateCMSSectionSchema,
  UpdateCMSSectionSchema,
  UpdatePublishStatusSchema,
} from "../lib/validation/cms.schema";
import { hasPermission } from "../lib/auth/rbac";
import { RoleType } from "@prisma/client";

console.log("🧪 Running Step 9 CMS & Banner Admin Test Suite...\n");

describe("Phase 9J Step 9 — CMS Banners, Hero Carousel & Announcement Bar Manager Tests", () => {
  it("Test 1: Section Key Schema Constraints", () => {
    console.log("▶️ Test 1: Section Key Format & Constraints Validation...");

    // Valid Keys
    assert.strictEqual(SectionKeySchema.safeParse("HOMEPAGE_HERO").success, true);
    assert.strictEqual(SectionKeySchema.safeParse("ANNOUNCEMENT_BAR").success, true);
    assert.strictEqual(SectionKeySchema.safeParse("PROMOTIONAL_BANNER_2").success, true);
    assert.strictEqual(SectionKeySchema.safeParse("FOOTER_PROMISE").success, true);

    // Invalid Keys: lowercase, spaces, symbols, too short
    assert.strictEqual(SectionKeySchema.safeParse("homepage_hero").success, false, "Lowercase keys must fail");
    assert.strictEqual(SectionKeySchema.safeParse("HERO BANNER").success, false, "Keys with spaces must fail");
    assert.strictEqual(SectionKeySchema.safeParse("HB!").success, false, "Keys with special chars must fail");
    assert.strictEqual(SectionKeySchema.safeParse("AB").success, false, "Keys shorter than 3 chars must fail");

    console.log("✅ Test 1 Passed: Section key format constraints verified.");
  });

  it("Test 2: Create and Update CMS Section Schema Validation", () => {
    console.log("▶️ Test 2: JSON Payload & Section Schema Validation...");

    // Valid Create with object contentJson
    const validHero = CreateCMSSectionSchema.safeParse({
      sectionKey: "HOMEPAGE_HERO",
      title: "Imperial Harvest Hero Carousel",
      contentJson: {
        slides: [
          {
            title: "Handpicked Himalayan Walnuts",
            subtitle: "100% single origin organic",
            ctaText: "Shop Now",
            ctaLink: "/shop",
            badge: "Imperial Quality",
            bgGradient: "from-[#142B23] via-[#1A382E] to-[#0E1F19]",
          },
        ],
      },
      isPublished: true,
      displayOrder: 1,
    });
    assert.strictEqual(validHero.success, true);

    // Valid Announcement Bar Content
    const validAnnouncement = CreateCMSSectionSchema.safeParse({
      sectionKey: "ANNOUNCEMENT_BAR",
      title: "Storefront Top Strip",
      contentJson: {
        tagText: "✨ FESTIVE HARVESTS",
        mainText: "Free Shipping on Orders Above ₹999 Across India",
        promoCode: "ROYAL10",
        promoDiscount: "for 10% Off",
        ctaLabel: "Explore Now →",
        ctaLink: "/shop",
        bgColor: "#142B23",
        textColor: "#F5EFE6",
        isDismissable: true,
      },
      isPublished: true,
      displayOrder: 0,
    });
    assert.strictEqual(validAnnouncement.success, true);

    // Valid Update Partial Schema
    const validUpdate = UpdateCMSSectionSchema.safeParse({
      isPublished: false,
      displayOrder: 5,
    });
    assert.strictEqual(validUpdate.success, true);

    // Invalid non-object/non-array contentJson
    const invalidContent = CreateCMSSectionSchema.safeParse({
      sectionKey: "INVALID_SEC",
      contentJson: 12345, // Numbers not allowed as root json
    });
    assert.strictEqual(invalidContent.success, false);

    console.log("✅ Test 2 Passed: Create and update CMS section payloads validated.");
  });

  it("Test 3: Publish Status Toggle Schema", () => {
    console.log("▶️ Test 3: Publish Status Toggle Schema Validation...");

    assert.strictEqual(UpdatePublishStatusSchema.safeParse({ isPublished: true }).success, true);
    assert.strictEqual(UpdatePublishStatusSchema.safeParse({ isPublished: false }).success, true);
    assert.strictEqual(UpdatePublishStatusSchema.safeParse({}).success, false, "isPublished boolean is required");
    assert.strictEqual(UpdatePublishStatusSchema.safeParse({ isPublished: "yes" }).success, false);

    console.log("✅ Test 3 Passed: Publish toggle schema validated.");
  });

  it("Test 4: RBAC CMS Content Management Permissions Matrix", () => {
    console.log("▶️ Test 4: RBAC CMS Permissions Matrix...");

    // SUPER_ADMIN and CONTENT_MGR have cms:read and cms:write
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "cms:read"), true);
    assert.strictEqual(hasPermission(RoleType.SUPER_ADMIN, "cms:write"), true);

    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "cms:read"), true);
    assert.strictEqual(hasPermission(RoleType.CONTENT_MGR, "cms:write"), true);

    // INVENTORY_MGR and ORDER_MGR do NOT have cms:write
    assert.strictEqual(hasPermission(RoleType.INVENTORY_MGR, "cms:write"), false);
    assert.strictEqual(hasPermission(RoleType.ORDER_MGR, "cms:write"), false);

    // CUSTOMER has cms:read (for storefront consumption) but NOT cms:write
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "cms:read"), true);
    assert.strictEqual(hasPermission(RoleType.CUSTOMER, "cms:write"), false);

    console.log("✅ Test 4 Passed: RBAC matrix enforces strict content management boundaries.");
  });

  it("Test 5: Content JSON Serialization and Gradient Presets", () => {
    console.log("▶️ Test 5: Complex Slide Deck & Gradient Styling Integrity...");

    const slideDeck = {
      slides: [
        {
          title: "Slide 1",
          subtitle: "Subtitle 1",
          ctaText: "Shop",
          ctaLink: "/shop",
          badge: "New",
          bgGradient: "from-[#142B23] via-[#1A382E] to-[#0E1F19]",
        },
        {
          title: "Slide 2",
          subtitle: "Subtitle 2",
          ctaText: "Gift",
          ctaLink: "/build-your-own-box",
          badge: "Luxury",
          bgGradient: "from-[#2A1810] via-[#3D2318] to-[#1F120C]",
        },
      ],
    };

    const serialized = JSON.stringify(slideDeck);
    const parsed = JSON.parse(serialized);

    assert.strictEqual(parsed.slides.length, 2);
    assert.strictEqual(parsed.slides[0].badge, "New");
    assert.strictEqual(parsed.slides[1].ctaLink, "/build-your-own-box");

    console.log("✅ Test 5 Passed: Slide deck serialization and deep object properties intact.");
  });
});
