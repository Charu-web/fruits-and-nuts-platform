import { ProductListingView } from "@/components/catalog/product-listing-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Royal Harvests Catalogue | M/S Fruits & Nuts",
  description: "Browse our handpicked assortment of imperial dry fruits, royal nuts, single-origin berries, and curated luxury gift hampers.",
  alternates: {
    canonical: "https://www.fruitsandnuts.co.in/shop",
  },
  openGraph: {
    title: "Royal Harvests Catalogue | M/S Fruits & Nuts",
    description: "Browse our handpicked assortment of imperial dry fruits, royal nuts, single-origin berries, and curated luxury gift hampers.",
    url: "https://www.fruitsandnuts.co.in/shop",
    siteName: "M/S Fruits & Nuts",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Royal Harvests Catalogue | M/S Fruits & Nuts",
    description: "Browse our handpicked assortment of imperial dry fruits, royal nuts, single-origin berries, and curated luxury gift hampers.",
  },
};

export default function ShopPage() {
  return <ProductListingView />;
}
