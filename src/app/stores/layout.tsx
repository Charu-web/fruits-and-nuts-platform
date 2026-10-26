import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutique Locator & Tasting Rooms",
  description:
    "Visit M/S Fruits & Nuts flagship boutiques and experience live gourmet tasting bars, single-origin samplers, and custom gifting lounges.",
  alternates: {
    canonical: "https://www.fruitsandnuts.co.in/stores",
  },
  openGraph: {
    title: "Boutique Locator & Tasting Rooms | M/S Fruits & Nuts",
    description:
      "Visit M/S Fruits & Nuts flagship boutiques and experience live gourmet tasting bars, single-origin samplers, and custom gifting lounges.",
    url: "https://www.fruitsandnuts.co.in/stores",
    siteName: "M/S Fruits & Nuts",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boutique Locator & Tasting Rooms | M/S Fruits & Nuts",
    description:
      "Visit M/S Fruits & Nuts flagship boutiques and experience live gourmet tasting bars, single-origin samplers, and custom gifting lounges.",
  },
};

const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "M/S Fruits & Nuts Flagship Boutique — Sapphire 90 Mall",
  image: "https://www.fruitsandnuts.co.in/images/brand/boutique-sapphire90.jpg",
  telephone: "+91-8368301495",
  email: "customersupport@fruitsandnuts.co.in",
  address: {
    "@type": "PostalAddress",
    streetAddress: "K-14 Sapphire 90 Mall, Sector 90",
    addressLocality: "Gurgaon",
    addressRegion: "Haryana",
    postalCode: "122505",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 28.3985,
    longitude: 76.9427,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "10:00",
      closes: "21:30",
    },
  ],
  priceRange: "₹₹₹",
};

export default function StoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      {children}
    </>
  );
}
