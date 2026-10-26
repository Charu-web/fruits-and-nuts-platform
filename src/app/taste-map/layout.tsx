import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The India Taste Map — Terroirs & Single-Estate Origins",
  description:
    "Explore the geographic heritage of India's finest harvests: Kashmiri valleys, Goan coasts, and Himalayan orchards.",
  alternates: {
    canonical: "https://www.fruitsandnuts.co.in/taste-map",
  },
  openGraph: {
    title: "The India Taste Map — Terroirs & Single-Estate Origins | M/S Fruits & Nuts",
    description:
      "Explore the geographic heritage of India's finest harvests: Kashmiri valleys, Goan coasts, and Himalayan orchards.",
    url: "https://www.fruitsandnuts.co.in/taste-map",
    siteName: "M/S Fruits & Nuts",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The India Taste Map — Terroirs & Single-Estate Origins | M/S Fruits & Nuts",
    description:
      "Explore the geographic heritage of India's finest harvests: Kashmiri valleys, Goan coasts, and Himalayan orchards.",
  },
};

export default function TasteMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
