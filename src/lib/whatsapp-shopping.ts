import { formatPrice } from "@/lib/utils";

export interface WhatsAppProductItemInput {
  productName: string;
  productSlug?: string | null;
  productUrl?: string | null;
  sku?: string | null;
  weightGrams?: number | null;
  unit?: string | null;
  packageType?: string | null;
  unitPrice: number;
  quantity: number;
}

export interface WhatsAppCartOrderInput {
  items: WhatsAppProductItemInput[];
  subtotal: number;
  discount?: number;
  shippingFee?: number;
  giftWrapFee?: number;
  giftMessage?: string | null;
  estimatedTotal?: number;
  appBaseUrl?: string;
}

export interface WhatsAppLinkResult {
  isConfigured: boolean;
  phoneNumber: string | null;
  message: string;
  url: string | null;
  error: string | null;
}

/**
 * Formats weight in grams/kilograms into a human-readable label (e.g., "250g", "1kg").
 */
export function formatVariantWeightLabel(weightGrams?: number | null, unit?: string | null): string | null {
  if (!weightGrams || weightGrams <= 0) return null;
  if (unit === "KILOGRAMS" || weightGrams >= 1000) {
    const kg = weightGrams >= 1000 ? weightGrams / 1000 : weightGrams;
    return `${kg}kg`;
  }
  return `${weightGrams}g`;
}

/**
 * Normalizes and validates the configured WhatsApp Business phone number
 * in international format without '+', spaces, or hyphens (e.g., "918368301495").
 */
export function getWhatsAppBusinessNumber(rawOverride?: string | null): string | null {
  const raw =
    rawOverride !== undefined
      ? rawOverride
      : process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (!raw || typeof raw !== "string") {
    return null;
  }

  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) {
    return null;
  }

  // If a 10-digit Indian mobile number is provided without country code, prefix '91'
  const normalized = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;

  // International E.164 digits length check (10 to 15 digits)
  if (!/^\d{10,15}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Resolves the full product page URL for a given product slug or explicit URL.
 */
export function resolveProductPageUrl(
  productSlug?: string | null,
  explicitUrl?: string | null,
  appBaseUrl?: string
): string | null {
  if (explicitUrl && explicitUrl.trim()) {
    return explicitUrl.trim();
  }
  if (!productSlug || !productSlug.trim()) {
    return null;
  }
  const baseOrigin = (
    appBaseUrl ||
    (typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://www.fruitsandnuts.co.in")
  ).replace(/\/$/, "");

  return `${baseOrigin}/product/${productSlug.trim()}`;
}

/**
 * Builds the pre-filled WhatsApp message for a single product on the Product Detail Page.
 * Returns an empty string if product data is missing a valid product name.
 */
export function buildSingleProductWhatsAppMessage(
  item: WhatsAppProductItemInput,
  appBaseUrl?: string
): string {
  if (!item || typeof item.productName !== "string" || !item.productName.trim()) {
    return "";
  }

  const productName = item.productName.trim();
  const rawQty = Number(item.quantity);
  const quantity = Number.isFinite(rawQty) && rawQty > 0 ? Math.floor(rawQty) : 1;
  const rawPrice = Number(item.unitPrice);
  const unitPrice = Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : 0;
  const subtotal = unitPrice * quantity;
  const weightLabel = formatVariantWeightLabel(item.weightGrams, item.unit);
  const productUrl = resolveProductPageUrl(item.productSlug, item.productUrl, appBaseUrl);

  const lines: string[] = [
    "Hello M/S Fruits & Nuts Team,",
    "I would like to place a shopping order on WhatsApp:",
    "",
    `• Product: ${productName}`,
  ];

  if (weightLabel) {
    const pkgSuffix = item.packageType ? ` (${item.packageType.replace(/_/g, " ")})` : "";
    lines.push(`• Variant / Weight: ${weightLabel}${pkgSuffix}`);
  }

  if (item.sku && item.sku.trim()) {
    lines.push(`• SKU: ${item.sku.trim()}`);
  }

  lines.push(`• Quantity: ${quantity}`);
  lines.push(`• Price: ${formatPrice(unitPrice)} each`);
  lines.push(`• Subtotal: ${formatPrice(subtotal)}`);

  if (productUrl) {
    lines.push(`• Product Link: ${productUrl}`);
  }

  lines.push("");
  lines.push("Please confirm availability, delivery details, and payment options for my order. Thank you!");

  return lines.join("\n");
}

/**
 * Builds the pre-filled WhatsApp message for one or more products in the Shopping Cart.
 * Returns an empty string if the cart is empty or contains no valid product items.
 */
export function buildCartWhatsAppMessage(input: WhatsAppCartOrderInput): string {
  if (!input || !Array.isArray(input.items)) {
    return "";
  }

  const validItems = input.items.filter(
    (i) =>
      i &&
      typeof i.productName === "string" &&
      i.productName.trim().length > 0 &&
      Number.isFinite(Number(i.quantity)) &&
      Number(i.quantity) > 0 &&
      Number.isFinite(Number(i.unitPrice)) &&
      Number(i.unitPrice) >= 0
  );

  if (validItems.length === 0) {
    return "";
  }

  const computedSubtotal = validItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Math.floor(Number(item.quantity)),
    0
  );
  const subtotal =
    input.subtotal !== undefined && Number.isFinite(Number(input.subtotal)) && Number(input.subtotal) >= 0
      ? Number(input.subtotal)
      : computedSubtotal;

  const lines: string[] = [
    "Hello M/S Fruits & Nuts Team,",
    "I would like to place an order from my shopping cart on WhatsApp:",
    "",
  ];

  validItems.forEach((item, idx) => {
    const productName = item.productName.trim();
    const quantity = Math.floor(Number(item.quantity));
    const unitPrice = Number(item.unitPrice);
    const lineTotal = unitPrice * quantity;
    const weightLabel = formatVariantWeightLabel(item.weightGrams, item.unit);
    const productUrl = resolveProductPageUrl(item.productSlug, item.productUrl, input.appBaseUrl);

    lines.push(`${idx + 1}. ${productName}`);
    if (weightLabel) {
      lines.push(`   Variant / Weight: ${weightLabel}`);
    }
    if (item.sku && item.sku.trim()) {
      lines.push(`   SKU: ${item.sku.trim()}`);
    }
    lines.push(`   Quantity: ${quantity} × ${formatPrice(unitPrice)} = ${formatPrice(lineTotal)}`);
    if (productUrl) {
      lines.push(`   Product Link: ${productUrl}`);
    }
    lines.push("");
  });

  lines.push(`Cart Subtotal: ${formatPrice(subtotal)}`);
  if (input.discount !== undefined && Number(input.discount) > 0) {
    lines.push(`Discount Savings: -${formatPrice(Number(input.discount))}`);
  }
  if (input.shippingFee !== undefined && Number(input.shippingFee) >= 0) {
    lines.push(
      `Shipping: ${Number(input.shippingFee) === 0 ? "FREE" : formatPrice(Number(input.shippingFee))}`
    );
  }
  if (input.giftWrapFee !== undefined && Number(input.giftWrapFee) > 0) {
    lines.push(`Gift Wrap: ${formatPrice(Number(input.giftWrapFee))}`);
    const cleanGiftMessage =
      typeof input.giftMessage === "string" ? input.giftMessage.trim() : null;
    if (cleanGiftMessage) {
      lines.push(`Gift Message: "${cleanGiftMessage}"`);
    }
  }
  if (input.estimatedTotal !== undefined && Number(input.estimatedTotal) >= 0) {
    lines.push(`Estimated Order Total: ${formatPrice(Number(input.estimatedTotal))}`);
  }
  lines.push("");
  lines.push("Please confirm availability, delivery charges, and payment options to finalize my order. Thank you!");

  return lines.join("\n");
}

/**
 * Constructs a properly encoded `https://wa.me/<number>?text=<encoded>` link
 * that works across WhatsApp Web on desktop and the WhatsApp app on mobile.
 */
export function createWhatsAppOrderLink(
  message: string,
  rawNumberOverride?: string | null
): WhatsAppLinkResult {
  const phoneNumber = getWhatsAppBusinessNumber(rawNumberOverride);
  if (!phoneNumber) {
    return {
      isConfigured: false,
      phoneNumber: null,
      message,
      url: null,
      error:
        "WhatsApp ordering is temporarily unavailable (NEXT_PUBLIC_WHATSAPP_NUMBER is not configured).",
    };
  }

  if (!message || !message.trim()) {
    return {
      isConfigured: true,
      phoneNumber,
      message: "",
      url: null,
      error: "Cannot generate a WhatsApp order link for an empty cart or invalid product.",
    };
  }

  const encodedText = encodeURIComponent(message);
  const url = `https://wa.me/${phoneNumber}?text=${encodedText}`;

  return {
    isConfigured: true,
    phoneNumber,
    message,
    url,
    error: null,
  };
}
