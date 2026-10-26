import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { metadata as shopMetadata } from "@/app/shop/page";
import { metadata as contactMetadata } from "@/app/contact/layout";
import { metadata as faqMetadata } from "@/app/faq/layout";
import { metadata as storesMetadata } from "@/app/stores/layout";
import { metadata as tasteMapMetadata } from "@/app/taste-map/layout";
import { metadata as byobMetadata } from "@/app/build-your-own-box/layout";
import { generateMetadata as generateCategoryMetadata } from "@/app/category/[slug]/page";
import { generateMetadata as generateProductMetadata } from "@/app/product/[slug]/page";
import { STOREFRONT_CATEGORIES, STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";

async function runSeoPerformanceTests() {
  console.log("Starting SEO & Performance Audit Tests...");

  // 1. Sitemap Verification
  console.log("  Checking Sitemap Generator...");
  const sitemapEntries = await sitemap();
  assert(Array.isArray(sitemapEntries), "Sitemap must return an array of entries");
  assert(sitemapEntries.length > 20, `Sitemap must contain at least 20 entries, found ${sitemapEntries.length}`);

  const sitemapUrls = sitemapEntries.map((e) => e.url);
  assert(sitemapUrls.includes("https://www.fruitsandnuts.co.in"), "Sitemap must include root URL");
  assert(sitemapUrls.includes("https://www.fruitsandnuts.co.in/shop"), "Sitemap must include /shop");
  assert(sitemapUrls.includes("https://www.fruitsandnuts.co.in/gifting"), "Sitemap must include /gifting");
  assert(sitemapUrls.includes("https://www.fruitsandnuts.co.in/build-your-own-box"), "Sitemap must include /build-your-own-box");
  assert(sitemapUrls.includes("https://www.fruitsandnuts.co.in/taste-map"), "Sitemap must include /taste-map");
  assert(sitemapUrls.includes("https://www.fruitsandnuts.co.in/stores"), "Sitemap must include /stores");
  assert(sitemapUrls.includes("https://www.fruitsandnuts.co.in/about"), "Sitemap must include /about");
  assert(sitemapUrls.includes("https://www.fruitsandnuts.co.in/contact"), "Sitemap must include /contact");
  assert(sitemapUrls.includes("https://www.fruitsandnuts.co.in/faq"), "Sitemap must include /faq");

  // Verify category URLs
  STOREFRONT_CATEGORIES.forEach((cat) => {
    if (cat.slug && cat.slug !== "all") {
      assert(
        sitemapUrls.includes(`https://www.fruitsandnuts.co.in/category/${cat.slug}`),
        `Sitemap must include category ${cat.slug}`
      );
    }
  });

  // Verify product URLs
  STOREFRONT_PRODUCTS.forEach((prod) => {
    if (prod.slug) {
      assert(
        sitemapUrls.includes(`https://www.fruitsandnuts.co.in/product/${prod.slug}`),
        `Sitemap must include product ${prod.slug}`
      );
    }
  });

  // Verify NO sensitive or non-indexable routes in sitemap
  for (const url of sitemapUrls) {
    assert(!url.includes("/admin"), `Sitemap must not contain admin route: ${url}`);
    assert(!url.includes("/account"), `Sitemap must not contain account route: ${url}`);
    assert(!url.includes("/cart"), `Sitemap must not contain cart route: ${url}`);
    assert(!url.includes("/checkout"), `Sitemap must not contain checkout route: ${url}`);
    assert(!url.includes("/login"), `Sitemap must not contain login route: ${url}`);
    assert(!url.includes("/register"), `Sitemap must not contain register route: ${url}`);
    assert(!url.includes("/api"), `Sitemap must not contain api route: ${url}`);
  }
  console.log("  ✓ Sitemap contains valid canonical URLs and strictly excludes private/admin routes.");

  // 2. Robots Rules Verification
  console.log("  Checking Robots.txt Rules...");
  const robotsConfig = robots();
  assert(robotsConfig.sitemap === "https://www.fruitsandnuts.co.in/sitemap.xml", "Robots must point to valid sitemap.xml");
  assert(robotsConfig.host === "https://www.fruitsandnuts.co.in", "Robots must declare host");

  const disallowList = Array.isArray(robotsConfig.rules)
    ? (robotsConfig.rules[0].disallow as string[])
    : (robotsConfig.rules.disallow as string[]);

  assert(disallowList.includes("/admin"), "Robots must disallow /admin");
  assert(disallowList.includes("/account"), "Robots must disallow /account");
  assert(disallowList.includes("/cart"), "Robots must disallow /cart");
  assert(disallowList.includes("/checkout"), "Robots must disallow /checkout");
  assert(disallowList.includes("/login"), "Robots must disallow /login");
  assert(disallowList.includes("/register"), "Robots must disallow /register");
  assert(disallowList.includes("/forgot-password"), "Robots must disallow /forgot-password");
  assert(disallowList.includes("/reset-password"), "Robots must disallow /reset-password");
  console.log("  ✓ Robots rules protect sensitive user and admin endpoints from search indexation.");

  // 3. Root Layout Static Inspection
  console.log("  Checking Root Metadata & Social Sharing Tags in Source...");
  const rootLayoutCode = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
  assert(rootLayoutCode.includes("metadataBase: new URL(\"https://www.fruitsandnuts.co.in\")"), "metadataBase must be set");
  assert(rootLayoutCode.includes("openGraph:"), "OpenGraph metadata must be declared in root");
  assert(rootLayoutCode.includes("twitter:"), "Twitter card metadata must be declared in root");
  assert(rootLayoutCode.includes("summary_large_image"), "Twitter card must use summary_large_image");
  assert(rootLayoutCode.includes("robots:"), "Robots metadata must be declared in root");
  assert(rootLayoutCode.includes("organizationJsonLd"), "Organization JSON-LD must be present");
  assert(rootLayoutCode.includes("websiteJsonLd"), "WebSite SearchAction JSON-LD must be present");
  console.log("  ✓ Root layout contains complete metadataBase, OpenGraph, Twitter card, and crawler directives.");

  // 4. Section & Layout Metadata Verification
  console.log("  Checking Public Pages Metadata...");
  const metadataChecks = [
    { name: "Shop", meta: shopMetadata, expectedCanonical: "https://www.fruitsandnuts.co.in/shop" },
    { name: "Contact", meta: contactMetadata, expectedCanonical: "https://www.fruitsandnuts.co.in/contact" },
    { name: "FAQ", meta: faqMetadata, expectedCanonical: "https://www.fruitsandnuts.co.in/faq" },
    { name: "Stores", meta: storesMetadata, expectedCanonical: "https://www.fruitsandnuts.co.in/stores" },
    { name: "Taste Map", meta: tasteMapMetadata, expectedCanonical: "https://www.fruitsandnuts.co.in/taste-map" },
    { name: "BYOB", meta: byobMetadata, expectedCanonical: "https://www.fruitsandnuts.co.in/build-your-own-box" },
  ];

  for (const check of metadataChecks) {
    assert(check.meta.title, `${check.name} must define a title`);
    assert(check.meta.description, `${check.name} must define a meta description`);
    assert(
      check.meta.alternates?.canonical === check.expectedCanonical,
      `${check.name} canonical URL must match ${check.expectedCanonical}`
    );
    assert(check.meta.openGraph, `${check.name} must define openGraph`);
    assert(check.meta.twitter, `${check.name} must define twitter card`);
  }
  console.log("  ✓ All 6 previously untagged/client public pages now export canonical metadata and social cards.");

  // 5. Dynamic Category & Product Metadata Verification
  console.log("  Checking Dynamic Metadata Generators...");
  const catMeta = await generateCategoryMetadata({ params: Promise.resolve({ slug: "dry-fruits" }) });
  assert(catMeta.title?.toString().includes("Dry Fruits"), "Category metadata title must include formatted name");
  assert(catMeta.alternates?.canonical === "https://www.fruitsandnuts.co.in/category/dry-fruits", "Category canonical matches");
  assert(catMeta.twitter, "Category metadata includes twitter card");

  const prodMeta = await generateProductMetadata({ params: Promise.resolve({ slug: "kashmiri-mamra-almonds" }) });
  assert(prodMeta.title?.toString().includes("Kashmiri Imperial Mamra Almonds"), "Product title must match harvest name");
  assert(prodMeta.alternates?.canonical === "https://www.fruitsandnuts.co.in/product/kashmiri-mamra-almonds", "Product canonical matches");
  assert(prodMeta.openGraph?.images, "Product OpenGraph must specify image preview");
  assert(prodMeta.twitter, "Product metadata includes twitter card");
  console.log("  ✓ Dynamic metadata generators generate valid canonicals, OpenGraph, and Twitter tags.");

  console.log("\nALL SEO & PERFORMANCE AUDIT TESTS PASSED (0 FAILURES)!\n");
}

runSeoPerformanceTests().catch((err) => {
  console.error("❌ SEO Test Failed:", err);
  process.exit(1);
});
