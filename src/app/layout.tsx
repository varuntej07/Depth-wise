import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { PostHogProvider, PostHogAuthIdentifier } from "@/providers/posthog-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://depthwise.app"),
  title: {
    default: "Depthwise – Explore Any Topic as a Visual Knowledge Tree",
    template: "%s | Depthwise",
  },
  description:
    "Depthwise uses AI to let you explore any topic as an interactive branching knowledge tree. Go deep on any branch, not just linearly.",
  keywords: [
    "interactive knowledge tree",
    "visual learning",
    "AI topic explorer",
    "non-linear learning",
    "branching explanation",
    "concept mapping",
    "depthwise exploration",
    "learn layer by layer",
    'visualize complex topics',
    "knowledge graph explorer",
  ],
  openGraph: {
    title: "Depthwise – Explore Any Topic as a Visual Knowledge Tree",
    description:
      "Depthwise uses AI to let you explore any topic as an interactive branching knowledge tree. Go deep on any branch, not just linearly.",
    type: "website",
    url: "https://depthwise.app",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Depthwise – Visual Knowledge Tree Explorer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Depthwise – Explore Any Topic as a Visual Knowledge Tree",
    description:
      "Depthwise uses AI to let you explore any topic as an interactive branching knowledge tree. Go deep on any branch, not just linearly.",
  },
  alternates: {
    canonical: "https://depthwise.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Depthwise",
  url: "https://depthwise.app",
  description: "AI-powered visual knowledge tree explorer",
  applicationCategory: "EducationApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PostHogProvider>
          <SessionProvider>
            <PostHogAuthIdentifier />
            {children}
          </SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
