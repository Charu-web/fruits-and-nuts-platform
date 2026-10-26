import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("🧪 Running Phase 17 Accessibility & Inclusive UX Test Suite...\n");

describe("Phase 17 Accessibility & Inclusive UX Tests", () => {
  it("Test 1: Skip to Content Link and Landmark Region in Root Layout", () => {
    const layoutContent = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "layout.tsx"),
      "utf8"
    );
    assert.ok(
      layoutContent.includes('href="#main-content"'),
      "Root layout must include skip-to-content anchor"
    );
    assert.ok(
      layoutContent.includes('id="main-content"'),
      "Main landmark must have id='main-content'"
    );
    assert.ok(
      layoutContent.includes('tabIndex={-1}'),
      "Main landmark must have tabIndex={-1} for keyboard focus management"
    );
  });

  it("Test 2: Header Navigation Accessibility Directives", () => {
    const headerContent = fs.readFileSync(
      path.join(process.cwd(), "src", "components", "layout", "header.tsx"),
      "utf8"
    );
    assert.ok(
      headerContent.includes('aria-expanded={isMobileMenuOpen}'),
      "Mobile hamburger toggle must dynamically reflect aria-expanded"
    );
    assert.ok(
      headerContent.includes('aria-label="Toggle navigation menu"'),
      "Mobile hamburger toggle must have accessible aria-label"
    );
    assert.ok(
      headerContent.includes('aria-label="Close navigation menu"'),
      "Mobile navigation drawer close button must have accessible aria-label"
    );
    assert.ok(
      headerContent.includes('role="dialog"') && headerContent.includes('aria-modal="true"'),
      "Mobile navigation drawer must have dialog and modal semantics"
    );
  });

  it("Test 3: Cart Drawer Keyboard Dismissal and Live Updates", () => {
    const cartDrawerContent = fs.readFileSync(
      path.join(process.cwd(), "src", "components", "cart", "cart-drawer.tsx"),
      "utf8"
    );
    assert.ok(
      cartDrawerContent.includes('e.key === "Escape"'),
      "Cart drawer must dismiss upon pressing Escape key"
    );
    assert.ok(
      cartDrawerContent.includes('role="status"') && cartDrawerContent.includes('aria-live="polite"'),
      "Coupon feedback must use live status region"
    );
  });

  it("Test 4: Search Modal Keyboard Navigation and Screen-Reader Directives", () => {
    const searchModalContent = fs.readFileSync(
      path.join(process.cwd(), "src", "components", "search", "search-modal.tsx"),
      "utf8"
    );
    assert.ok(
      searchModalContent.includes('e.key === "Escape"'),
      "Search modal must support Escape key dismissal"
    );
    assert.ok(
      searchModalContent.includes('aria-label="Search royal dry fruits, dates, artisanal teas, gifting"'),
      "Search input must have comprehensive aria-label"
    );
    assert.ok(
      searchModalContent.includes('role="region"') && searchModalContent.includes('aria-live="polite"'),
      "Search results area must have live region for dynamic query updates"
    );
  });

  it("Test 5: AI Sommelier Concierge Dialog and Input Accessibility", () => {
    const sommelierContent = fs.readFileSync(
      path.join(process.cwd(), "src", "components", "ai", "sommelier-concierge.tsx"),
      "utf8"
    );
    assert.ok(
      sommelierContent.includes('role="dialog"') && sommelierContent.includes('aria-modal="true"'),
      "Sommelier chat panel must have dialog and modal semantics"
    );
    assert.ok(
      sommelierContent.includes('e.key === "Escape"'),
      "Sommelier chat must support Escape key dismissal"
    );
    assert.ok(
      sommelierContent.includes('role="log"') && sommelierContent.includes('aria-live="polite"'),
      "Conversation log must announce incoming messages politely"
    );
    assert.ok(
      sommelierContent.includes('aria-label="Ask the Sommelier about gourmet harvests, origins, and pairings"'),
      "Chat input field must have accessible label"
    );
  });

  it("Test 6: Intelligent Gift Finder Radio Group Semantics", () => {
    const giftFinderContent = fs.readFileSync(
      path.join(process.cwd(), "src", "components", "gifting", "intelligent-gift-finder.tsx"),
      "utf8"
    );
    assert.ok(
      giftFinderContent.includes('role="radiogroup"'),
      "Selection steps must be structured as radiogroups"
    );
    assert.ok(
      giftFinderContent.includes('role="radio"'),
      "Selection cards must carry radio roles"
    );
    assert.ok(
      giftFinderContent.includes('aria-checked='),
      "Selection cards must report aria-checked state"
    );
  });

  it("Test 7: Authentication Form Field Error Live Announcements", () => {
    const loginContent = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "login", "page.tsx"),
      "utf8"
    );
    const forgotContent = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "forgot-password", "page.tsx"),
      "utf8"
    );

    assert.ok(
      loginContent.includes('role="alert"') && loginContent.includes('aria-live="assertive"'),
      "Login error banner must use assertive alert role"
    );
    assert.ok(
      loginContent.includes('aria-invalid='),
      "Login input fields must bind aria-invalid"
    );
    assert.ok(
      forgotContent.includes('role="alert"') && forgotContent.includes('aria-live="assertive"'),
      "Forgot password error banner must use assertive alert role"
    );
  });

  it("Test 8: Product Card and Catalogue Pagination Accessibility", () => {
    const productCardContent = fs.readFileSync(
      path.join(process.cwd(), "src", "components", "catalog", "product-card.tsx"),
      "utf8"
    );
    const listingContent = fs.readFileSync(
      path.join(process.cwd(), "src", "components", "catalog", "product-listing-view.tsx"),
      "utf8"
    );

    assert.ok(
      productCardContent.includes('Add ${name}'),
      "Quick Add button must announce specific product name"
    );
    assert.ok(
      listingContent.includes('<nav aria-label="Product catalogue pagination"'),
      "Pagination must be wrapped in semantic nav landmark"
    );
    assert.ok(
      listingContent.includes('aria-current={currentPage === idx + 1 ? "page" : undefined}'),
      "Current active page must carry aria-current='page'"
    );
  });
});
