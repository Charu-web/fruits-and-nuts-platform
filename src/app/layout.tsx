import type { Metadata } from "next";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SommelierConcierge } from "@/components/ai/sommelier-concierge";

export const metadata: Metadata = {
  title: {
    default: "M/S Fruits & Nuts | Luxury Gourmet Dry Fruits, Dates, Teas & Gifting",
    template: "%s | M/S Fruits & Nuts",
  },
  description:
    "Discover the world's and India's finest gourmet harvests. Certified grade-A Kashmiri Mamra almonds, royal Medjool dates, single-estate teas, super seeds, and bespoke festive gifting boxes.",
  keywords: [
    "Dry Fruits",
    "Mamra Almonds",
    "Medjool Dates",
    "Kashmiri Saffron",
    "Artisanal Tea",
    "Festive Gifting Boxes",
    "Fruits and Nuts India",
  ],
  metadataBase: new URL("https://www.fruitsandnuts.co.in"),
  alternates: {
    canonical: "https://www.fruitsandnuts.co.in",
  },
  openGraph: {
    title: "M/S Fruits & Nuts — Flagship Gourmet E-Commerce",
    description: "Pure harvests. Royal terroirs. Direct from the orchards of Kashmir and the world.",
    url: "https://www.fruitsandnuts.co.in",
    siteName: "M/S Fruits & Nuts",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://www.fruitsandnuts.co.in/images/brand/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "M/S Fruits & Nuts — Luxury Gourmet Dry Fruits, Dates, Teas & Gifting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "M/S Fruits & Nuts | Luxury Gourmet Dry Fruits, Dates, Teas & Gifting",
    description:
      "Discover the world's and India's finest gourmet harvests. Certified grade-A Kashmiri Mamra almonds, royal Medjool dates, single-estate teas, and bespoke festive gifting boxes.",
    images: ["https://www.fruitsandnuts.co.in/images/brand/og-banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "M/S Fruits & Nuts",
  alternateName: "Fruits & Nuts India",
  url: "https://www.fruitsandnuts.co.in",
  logo: "https://www.fruitsandnuts.co.in/images/logo.jpg",
  description:
    "India's premier purveyor of luxury single-origin dry fruits, Kashmiri Mamra almonds, royal Medjool dates, single-estate teas, and bespoke gifting.",
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
  sameAs: [
    "https://www.instagram.com/fruitsandnuts.co.in",
    "https://www.facebook.com/fruitsandnuts.co.in",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "M/S Fruits & Nuts",
  url: "https://www.fruitsandnuts.co.in",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.fruitsandnuts.co.in/shop?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F6F0E5] text-[#123D30] antialiased selection:bg-[#B99553]/25 selection:text-[#123D30] overflow-x-hidden w-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#173D2C] focus:text-[#FAF7F0] focus:ring-2 focus:ring-[#B89453] focus:rounded-md focus:shadow-lg focus:outline-none text-xs font-semibold tracking-wide"
        >
          Skip to main content
        </a>
        <CartProvider>
          <AnnouncementBar />
          <Header />
          <CartDrawer />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none overflow-x-hidden w-full">
            {children}
          </main>
          <Footer />
          <SommelierConcierge />
        </CartProvider>
      </body>
    </html>
  );
}
