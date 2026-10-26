import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  formatVariantWeightLabel,
  getWhatsAppBusinessNumber,
  resolveProductPageUrl,
  buildSingleProductWhatsAppMessage,
  buildCartWhatsAppMessage,
  createWhatsAppOrderLink,
} from "../lib/whatsapp-shopping";
import { STOREFRONT_PRODUCTS } from "../lib/catalog/storefront-catalog";
import { OrderService } from "../services/order.service";

async function runWhatsAppShoppingTests() {
  console.log("🧪 Running WhatsApp Shopping Feature Test Suite...\n");

  // ----------------------------------------------------------------------
  // Test 1: Single-Product WhatsApp Message Generation
  // ----------------------------------------------------------------------
  console.log("▶️ Test 1: Single-Product WhatsApp Message Generation...");

  const mamraProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === "kashmiri-mamra-almonds");
  assert.ok(mamraProduct && mamraProduct.variants, "Catalog must contain Kashmiri Mamra Almonds");
  const variant250 = mamraProduct.variants[0];
  const variant500 = mamraProduct.variants[1] || mamraProduct.variants[0];

  const msgA = buildSingleProductWhatsAppMessage(
    {
      productName: mamraProduct.name,
      productSlug: mamraProduct.slug,
      sku: variant250.sku,
      weightGrams: variant250.weightGrams,
      unit: variant250.unit,
      packageType: "Airtight Nitrogen Tin",
      unitPrice: variant250.sellingPrice,
      quantity: 1,
    },
    "http://localhost:3000"
  );

  assert.ok(msgA.includes(mamraProduct.name), "Message must include product name");
  assert.ok(msgA.includes("250g"), "Message must include selected variant weight");
  assert.ok(msgA.includes(variant250.sku), "Message must include SKU");
  assert.ok(msgA.includes("Quantity: 1"), "Message must include quantity");
  assert.ok(
    msgA.includes("http://localhost:3000/product/kashmiri-mamra-almonds"),
    "Message must include product page URL"
  );
  assert.ok(
    msgA.includes("Please confirm availability"),
    "Message must state order requires confirmation on WhatsApp"
  );

  console.log("✅ Test 1 Passed: Single-product message generated with product name, variant, SKU, price, quantity, and URL.");

  // ----------------------------------------------------------------------
  // Test 2: Multi-Product Cart Message Generation & Order Summary
  // ----------------------------------------------------------------------
  console.log("▶️ Test 2: Multi-Product Cart WhatsApp Message Generation & Summary...");

  const medjoolProduct =
    STOREFRONT_PRODUCTS.find((p) => p.slug === "jumbo-medjool-dates") || STOREFRONT_PRODUCTS[1];
  assert.ok(medjoolProduct && medjoolProduct.variants, "Catalog must contain second product");
  const medjoolVariant = medjoolProduct.variants[0];

  const item1Total = variant250.sellingPrice * 2;
  const item2Total = medjoolVariant.sellingPrice * 1;
  const cartSubtotal = item1Total + item2Total;
  const discount = 100;
  const shippingFee = 0;
  const estimatedTotal = cartSubtotal - discount;

  const cartMessage = buildCartWhatsAppMessage({
    items: [
      {
        productName: mamraProduct.name,
        productSlug: mamraProduct.slug,
        sku: variant250.sku,
        weightGrams: variant250.weightGrams,
        unit: variant250.unit,
        unitPrice: variant250.sellingPrice,
        quantity: 2,
      },
      {
        productName: medjoolProduct.name,
        productSlug: medjoolProduct.slug,
        sku: medjoolVariant.sku,
        weightGrams: medjoolVariant.weightGrams,
        unit: medjoolVariant.unit,
        unitPrice: medjoolVariant.sellingPrice,
        quantity: 1,
      },
    ],
    subtotal: cartSubtotal,
    discount,
    shippingFee,
    estimatedTotal,
    appBaseUrl: "http://localhost:3000",
  });

  assert.ok(cartMessage.includes(`1. ${mamraProduct.name}`), "Cart message must include item 1");
  assert.ok(cartMessage.includes(`2. ${medjoolProduct.name}`), "Cart message must include item 2");
  assert.ok(cartMessage.includes(variant250.sku), "Cart message must include item 1 SKU");
  assert.ok(cartMessage.includes(medjoolVariant.sku), "Cart message must include item 2 SKU");
  assert.ok(
    cartMessage.includes("http://localhost:3000/product/kashmiri-mamra-almonds"),
    "Cart message must include item 1 URL"
  );
  assert.ok(
    cartMessage.includes(`http://localhost:3000/product/${medjoolProduct.slug}`),
    "Cart message must include item 2 URL"
  );
  assert.ok(
    cartMessage.includes(cartSubtotal.toLocaleString("en-IN")),
    "Cart message must include accurate Cart Subtotal"
  );
  assert.ok(
    cartMessage.includes(estimatedTotal.toLocaleString("en-IN")),
    "Cart message must include Estimated Order Total"
  );

  console.log("✅ Test 2 Passed: Multi-product cart message includes all items, SKUs, links, and order summary.");

  // ----------------------------------------------------------------------
  // Test 3: Quantity and Price Formatting
  // ----------------------------------------------------------------------
  console.log("▶️ Test 3: Quantity and Price Formatting...");

  const msgB = buildSingleProductWhatsAppMessage(
    {
      productName: mamraProduct.name,
      productSlug: mamraProduct.slug,
      sku: variant500.sku,
      weightGrams: variant500.weightGrams,
      unit: variant500.unit,
      unitPrice: variant500.sellingPrice,
      quantity: 3,
    },
    "http://localhost:3000"
  );

  const expectedSubtotalB = (variant500.sellingPrice * 3).toLocaleString("en-IN");
  assert.ok(msgB.includes(`${variant500.weightGrams}g`), "Message must reflect updated variant weight");
  assert.ok(msgB.includes("Quantity: 3"), "Message must reflect updated quantity");
  assert.ok(msgB.includes("₹"), "Price must be formatted in INR (₹)");
  assert.ok(msgB.includes(expectedSubtotalB), "Message must reflect accurate subtotal (unitPrice * 3)");
  assert.strictEqual(formatVariantWeightLabel(250, "GRAMS"), "250g");
  assert.strictEqual(formatVariantWeightLabel(1000, "GRAMS"), "1kg");
  assert.strictEqual(formatVariantWeightLabel(1000, "KILOGRAMS"), "1kg");

  console.log("✅ Test 3 Passed: Quantity and INR price formatting verified.");

  // ----------------------------------------------------------------------
  // Test 4: URL Encoding (Desktop & Mobile Universal wa.me Link)
  // ----------------------------------------------------------------------
  console.log("▶️ Test 4: Universal wa.me URL Encoding...");

  const linkResult = createWhatsAppOrderLink(cartMessage, "918368301495");
  assert.strictEqual(linkResult.isConfigured, true);
  assert.strictEqual(linkResult.phoneNumber, "918368301495");
  assert.ok(linkResult.url?.startsWith("https://wa.me/918368301495?text="));

  const parsedUrl = new URL(linkResult.url!);
  assert.strictEqual(parsedUrl.protocol, "https:");
  assert.strictEqual(parsedUrl.hostname, "wa.me");
  assert.strictEqual(parsedUrl.pathname, "/918368301495");
  assert.strictEqual(parsedUrl.searchParams.get("text"), cartMessage);
  assert.strictEqual(
    resolveProductPageUrl("kashmiri-mamra-almonds", null, "https://www.fruitsandnuts.co.in/"),
    "https://www.fruitsandnuts.co.in/product/kashmiri-mamra-almonds"
  );

  console.log("✅ Test 4 Passed: Universal wa.me URL encoding round-trip verified.");

  // ----------------------------------------------------------------------
  // Test 5: Missing Phone Number Handling
  // ----------------------------------------------------------------------
  console.log("▶️ Test 5: Missing Phone Number Handling...");

  assert.strictEqual(getWhatsAppBusinessNumber("918368301495"), "918368301495");
  assert.strictEqual(getWhatsAppBusinessNumber("+91-8368301495"), "918368301495");
  assert.strictEqual(getWhatsAppBusinessNumber("+91 83683 01495"), "918368301495");
  assert.strictEqual(getWhatsAppBusinessNumber("8368301495"), "918368301495");

  assert.strictEqual(getWhatsAppBusinessNumber(""), null);
  assert.strictEqual(getWhatsAppBusinessNumber("   "), null);
  assert.strictEqual(getWhatsAppBusinessNumber(null), null);
  assert.strictEqual(getWhatsAppBusinessNumber("12345"), null);

  const missingLink = createWhatsAppOrderLink("Test message", "");
  assert.strictEqual(missingLink.isConfigured, false);
  assert.strictEqual(missingLink.url, null);
  assert.ok(missingLink.error?.includes("NEXT_PUBLIC_WHATSAPP_NUMBER"));

  console.log("✅ Test 5 Passed: Missing or malformed phone number handled gracefully without throwing.");

  // ----------------------------------------------------------------------
  // Test 6: Empty Cart Handling
  // ----------------------------------------------------------------------
  console.log("▶️ Test 6: Empty Cart Handling...");

  const emptyCartMsg = buildCartWhatsAppMessage({
    items: [],
    subtotal: 0,
  });
  assert.strictEqual(emptyCartMsg, "", "Empty cart must return empty message string");

  const emptyCartLink = createWhatsAppOrderLink(emptyCartMsg, "918368301495");
  assert.strictEqual(emptyCartLink.isConfigured, true);
  assert.strictEqual(emptyCartLink.url, null, "Empty cart must not produce a wa.me link");
  assert.ok(
    emptyCartLink.error?.includes("empty cart"),
    "Empty cart link result must return a descriptive validation error"
  );

  console.log("✅ Test 6 Passed: Empty cart handled safely without generating an empty order link.");

  // ----------------------------------------------------------------------
  // Test 7: Invalid Product Data Handling
  // ----------------------------------------------------------------------
  console.log("▶️ Test 7: Invalid Product Data Handling...");

  // Blank product name must be rejected safely
  const blankNameMsg = buildSingleProductWhatsAppMessage({
    productName: "   ",
    unitPrice: 500,
    quantity: 1,
  });
  assert.strictEqual(blankNameMsg, "");
  const blankNameLink = createWhatsAppOrderLink(blankNameMsg, "918368301495");
  assert.strictEqual(blankNameLink.url, null);

  // Negative/NaN quantity or price on a named single product is sanitized safely
  const sanitizedSingleMsg = buildSingleProductWhatsAppMessage({
    productName: "Royal Kashmiri Saffron",
    unitPrice: -100,
    quantity: 0,
  });
  assert.ok(sanitizedSingleMsg.includes("Quantity: 1"));
  assert.ok(sanitizedSingleMsg.includes("₹0"));

  // Cart containing both invalid and valid items filters out invalid entries
  const mixedCartMsg = buildCartWhatsAppMessage({
    items: [
      { productName: "", unitPrice: 500, quantity: 1 },
      { productName: "Invalid Qty Item", unitPrice: 500, quantity: 0 },
      { productName: "Invalid Price Item", unitPrice: -50, quantity: 2 },
      { productName: "Valid Pistachios", unitPrice: 650, quantity: 2, productSlug: "california-pistachios" },
    ],
    subtotal: 1300,
  });
  assert.ok(mixedCartMsg.includes("1. Valid Pistachios"), "Valid item must be numbered 1");
  assert.ok(!mixedCartMsg.includes("Invalid Qty Item"), "Zero-quantity item must be excluded");
  assert.ok(!mixedCartMsg.includes("Invalid Price Item"), "Negative-price item must be excluded");

  console.log("✅ Test 7 Passed: Invalid product data handled gracefully.");

  // ----------------------------------------------------------------------
  // Test 8 & 9: No Unintended Database Order Creation or Inventory Deduction
  // ----------------------------------------------------------------------
  console.log("▶️ Test 8 & 9: Verifying No Database Order Creation & No Inventory Deduction...");

  const testUserId = "usr-whatsapp-non-mutation-check";
  const ordersBefore = await OrderService.listCustomerOrders(testUserId, { page: 1, limit: 50 });
  const availabilityBefore = variant250.isAvailable;
  const stockStatusBefore = mamraProduct.stockStatus;

  // Generate both single-product and cart WhatsApp links
  const singleLink = createWhatsAppOrderLink(msgA, "918368301495");
  const multiLink = createWhatsAppOrderLink(cartMessage, "918368301495");
  assert.ok(singleLink.url && multiLink.url);

  const ordersAfter = await OrderService.listCustomerOrders(testUserId, { page: 1, limit: 50 });
  const availabilityAfter = variant250.isAvailable;
  const stockStatusAfter = mamraProduct.stockStatus;

  assert.strictEqual(
    ordersAfter.items.length,
    ordersBefore.items.length,
    "WhatsApp link generation must NOT create any database order"
  );
  assert.strictEqual(
    availabilityAfter,
    availabilityBefore,
    "WhatsApp link generation must NOT modify variant availability"
  );
  assert.strictEqual(
    stockStatusAfter,
    stockStatusBefore,
    "WhatsApp link generation must NOT deduct product inventory"
  );

  console.log("✅ Test 8 & 9 Passed: Confirmed zero database orders created and zero inventory deducted.");

  // ----------------------------------------------------------------------
  // Test 10: UI Visibility Verification Across Shop, Product Card, PDP, and Cart
  // ----------------------------------------------------------------------
  console.log("▶️ Test 10: Verifying WhatsApp Buttons Across Shop Page, Product Cards, PDP, and Cart...");

  const rootDir = process.cwd();
  const shopViewSource = fs.readFileSync(
    path.join(rootDir, "src/components/catalog/product-listing-view.tsx"),
    "utf8"
  );
  const productCardSource = fs.readFileSync(
    path.join(rootDir, "src/components/catalog/product-card.tsx"),
    "utf8"
  );
  const pdpSource = fs.readFileSync(
    path.join(rootDir, "src/components/catalog/pdp-client-view.tsx"),
    "utf8"
  );
  const cartPageSource = fs.readFileSync(
    path.join(rootDir, "src/app/cart/page.tsx"),
    "utf8"
  );
  const cartDrawerSource = fs.readFileSync(
    path.join(rootDir, "src/components/cart/cart-drawer.tsx"),
    "utf8"
  );

  assert.ok(
    shopViewSource.includes("Shop on WhatsApp") && shopViewSource.includes("WhatsAppIcon"),
    "Shop page (ProductListingView) must render 'Shop on WhatsApp' with WhatsAppIcon"
  );
  assert.ok(
    productCardSource.includes("Shop on WhatsApp") && productCardSource.includes("WhatsAppIcon"),
    "ProductCard on Shop page must render 'Shop on WhatsApp' with WhatsAppIcon"
  );
  assert.ok(
    pdpSource.includes("Order on WhatsApp") && pdpSource.includes("WhatsAppIcon"),
    "Individual Product Page (PDPClientView) must render 'Order on WhatsApp' with WhatsAppIcon"
  );
  assert.ok(
    cartPageSource.includes("Shop on WhatsApp") && cartPageSource.includes("WhatsAppIcon"),
    "Shopping Cart Page must render 'Shop on WhatsApp' with WhatsAppIcon"
  );
  assert.ok(
    cartDrawerSource.includes("Shop on WhatsApp") && cartDrawerSource.includes("WhatsAppIcon"),
    "Shopping Cart Drawer must render 'Shop on WhatsApp' with WhatsAppIcon"
  );

  console.log("✅ Test 10 Passed: WhatsApp buttons verified across Shop page, Product cards, PDP, and Cart.");
  // ----------------------------------------------------------------------
  // Test 11: WhatsApp Cart Gift Wrapping & Personalized Gift Message
  // ----------------------------------------------------------------------
  console.log("▶️ Test 11: Verifying WhatsApp Cart Gift Wrapping & Personalized Message...");

  const giftMsgCart = buildCartWhatsAppMessage({
    items: [
      {
        productName: mamraProduct.name,
        productSlug: mamraProduct.slug,
        unitPrice: 650,
        quantity: 1,
      },
    ],
    subtotal: 650,
    shippingFee: 75,
    giftWrapFee: 50,
    giftMessage: "Warm Festive Wishes from the Sharma Family!",
    estimatedTotal: 775,
  });

  assert.ok(giftMsgCart.includes("Gift Wrap: ₹50"), "Message must include Gift Wrap fee");
  assert.ok(
    giftMsgCart.includes('Gift Message: "Warm Festive Wishes from the Sharma Family!"'),
    "Message must include personalized greeting note when gift wrapping is enabled"
  );
  assert.ok(giftMsgCart.includes("Estimated Order Total: ₹775"), "Estimated total must include ₹50 gift wrap fee");
  assert.strictEqual(
    giftMsgCart.split('Gift Message: "Warm Festive Wishes from the Sharma Family!"').length - 1,
    1,
    "Gift message must not be duplicated"
  );

  // Empty or whitespace-only gift message should be omitted
  const emptyNoteCart = buildCartWhatsAppMessage({
    items: [{ productName: mamraProduct.name, unitPrice: 650, quantity: 1 }],
    subtotal: 650,
    shippingFee: 75,
    giftWrapFee: 50,
    giftMessage: "   ",
    estimatedTotal: 775,
  });
  assert.ok(emptyNoteCart.includes("Gift Wrap: ₹50"), "Message must include Gift Wrap fee");
  assert.ok(!emptyNoteCart.includes("Gift Message:"), "Whitespace-only gift message must be omitted");
  assert.ok(emptyNoteCart.includes("Estimated Order Total: ₹775"), "Total must remain correct");

  // Gift message omitted when gift wrap fee is 0 or disabled
  const noWrapCart = buildCartWhatsAppMessage({
    items: [{ productName: mamraProduct.name, unitPrice: 650, quantity: 1 }],
    subtotal: 650,
    shippingFee: 75,
    giftWrapFee: 0,
    giftMessage: "Should not appear without gift wrap",
    estimatedTotal: 725,
  });
  assert.ok(!noWrapCart.includes("Gift Wrap:"), "Zero gift wrap fee must not display");
  assert.ok(!noWrapCart.includes("Gift Message:"), "Gift message must not appear if gift wrapping is disabled");
  assert.ok(noWrapCart.includes("Estimated Order Total: ₹725"), "Total must reflect ₹0 gift wrap fee");

  console.log("✅ Test 11 Passed: WhatsApp gift wrap fee, gift message, omission of empty message, and total verified.");

  console.log("\n🎉 All WhatsApp Shopping Feature Tests passed successfully!\n");
}

runWhatsAppShoppingTests().catch((err) => {
  console.error("❌ WhatsApp Shopping test failure:", err);
  process.exit(1);
});
