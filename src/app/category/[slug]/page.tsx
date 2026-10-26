import { ProductListingView } from "@/components/catalog/product-listing-view";
import { Metadata } from "next";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const formattedName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const url = `https://www.fruitsandnuts.co.in/category/${slug}`;

  return {
    title: `${formattedName} | M/S Fruits & Nuts`,
    description: `Explore premium single-origin ${formattedName} directly sourced and vacuum-packed for royal freshness.`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${formattedName} | M/S Fruits & Nuts`,
      description: `Explore premium single-origin ${formattedName} directly sourced and vacuum-packed for royal freshness.`,
      url,
      siteName: "M/S Fruits & Nuts",
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${formattedName} | M/S Fruits & Nuts`,
      description: `Explore premium single-origin ${formattedName} directly sourced and vacuum-packed for royal freshness.`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const formattedName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const url = `https://www.fruitsandnuts.co.in/category/${slug}`;

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${formattedName} — Royal Gourmet Collection`,
    url,
    description: `Handpicked and rigorously graded ${formattedName.toLowerCase()} with single-origin traceability.`,
    isPartOf: {
      "@type": "WebSite",
      name: "M/S Fruits & Nuts",
      url: "https://www.fruitsandnuts.co.in",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.fruitsandnuts.co.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catalogue",
        item: "https://www.fruitsandnuts.co.in/shop",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: formattedName,
        item: `https://www.fruitsandnuts.co.in/category/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductListingView
        initialCategorySlug={slug}
        categoryTitle={formattedName}
        categoryDescription={`Handpicked and rigorously graded ${formattedName.toLowerCase()} with single-origin traceability.`}
      />
    </>
  );
}
