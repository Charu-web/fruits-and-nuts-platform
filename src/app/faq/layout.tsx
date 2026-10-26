import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions & Heritage FAQ",
  description:
    "Learn about our single-origin grading, nitrogen vacuum sealing, cold-chain fulfillment, and gifting services.",
  alternates: {
    canonical: "https://www.fruitsandnuts.co.in/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions & Heritage FAQ | M/S Fruits & Nuts",
    description:
      "Learn about our single-origin grading, nitrogen vacuum sealing, cold-chain fulfillment, and gifting services.",
    url: "https://www.fruitsandnuts.co.in/faq",
    siteName: "M/S Fruits & Nuts",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions & Heritage FAQ | M/S Fruits & Nuts",
    description:
      "Learn about our single-origin grading, nitrogen vacuum sealing, cold-chain fulfillment, and gifting services.",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What makes Kashmiri Mamra Almonds different from regular California almonds?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kashmiri Mamra almonds are celebrated globally as the royalty of almonds. Unlike California almonds, which undergo industrial hybrid scaling and oil extraction, Kashmiri Mamra are 100% natural and grown in high-altitude Himalayan orchards with glacier meltwater. They retain up to 50% natural almond oil content, feature a distinct concave boat curve, and provide superior crunch and cognitive nourishment.",
      },
    },
    {
      "@type": "Question",
      name: "Are your dry fruits chemically bleached or polished?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Never. We maintain a zero-tolerance policy against chemical polishing, sulfur bleaching, and synthetic glucose glazing. Every batch retains its authentic earthy hue, natural oils, and unadulterated botanical fragrance.",
      },
    },
    {
      "@type": "Question",
      name: "Are Fruits & Nuts products certified under FSSAI food safety regulations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All packaging, processing, and handling procedures comply rigorously with Food Safety and Standards Authority of India (FSSAI) guidelines. Every harvest is tested for aflatoxins, microbial safety, and moisture standards.",
      },
    },
    {
      "@type": "Question",
      name: "What is nitrogen-flushed packaging and why is it important?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dry fruits and nuts are rich in delicate polyunsaturated fatty acids that oxidize and turn rancid when exposed to ambient atmospheric oxygen. Our state-of-the-art packaging extracts oxygen and introduces inert food-grade nitrogen, sealing in crispness, flavor, and nutrition for months without artificial chemical preservatives.",
      },
    },
    {
      "@type": "Question",
      name: "What are your shipping rates and how do I qualify for free delivery?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We offer complimentary express delivery across India on all orders of ₹999 and above. For orders under ₹999, a nominal flat express shipping charge of ₹99 is calculated at checkout.",
      },
    },
  ],
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
