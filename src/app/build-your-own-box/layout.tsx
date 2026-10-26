import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Own Box (BYOB) — Bespoke Luxury Caskets",
  description:
    "Curate a personalized gourmet gift box. Select handcrafted pine or silk dual-layer caskets and fill them with your choice of royal dry fruits.",
  alternates: {
    canonical: "https://www.fruitsandnuts.co.in/build-your-own-box",
  },
  openGraph: {
    title: "Build Your Own Box (BYOB) — Bespoke Luxury Caskets | M/S Fruits & Nuts",
    description:
      "Curate a personalized gourmet gift box. Select handcrafted pine or silk dual-layer caskets and fill them with your choice of royal dry fruits.",
    url: "https://www.fruitsandnuts.co.in/build-your-own-box",
    siteName: "M/S Fruits & Nuts",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Your Own Box (BYOB) — Bespoke Luxury Caskets | M/S Fruits & Nuts",
    description:
      "Curate a personalized gourmet gift box. Select handcrafted pine or silk dual-layer caskets and fill them with your choice of royal dry fruits.",
  },
};

export default function ByobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
