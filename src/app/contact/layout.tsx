import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Concierge & Boutiques",
  description:
    "Connect with our royal gourmet concierges for corporate orders, bespoke hampers, or customer care across our boutiques.",
  alternates: {
    canonical: "https://www.fruitsandnuts.co.in/contact",
  },
  openGraph: {
    title: "Contact Concierge & Boutiques | M/S Fruits & Nuts",
    description:
      "Connect with our royal gourmet concierges for corporate orders, bespoke hampers, or customer care across our boutiques.",
    url: "https://www.fruitsandnuts.co.in/contact",
    siteName: "M/S Fruits & Nuts",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Concierge & Boutiques | M/S Fruits & Nuts",
    description:
      "Connect with our royal gourmet concierges for corporate orders, bespoke hampers, or customer care across our boutiques.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
