import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

const privateNoStore = "private, no-store, max-age=0, must-revalidate";
const publicAssetCache = "public, max-age=2592000, stale-while-revalidate=86400";

function imageCdnPattern(): RemotePattern | null {
  const host = process.env.NEXT_PUBLIC_IMAGE_CDN_HOST;
  if (!host) return null;

  try {
    const url = new URL(host);
    return {
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/**"
    };
  } catch {
    return null;
  }
}

const remotePatterns = [
  process.env.CLOUDINARY_CLOUD_NAME
    ? {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**`
      }
    : null,
  imageCdnPattern()
].filter(Boolean) as RemotePattern[];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"]
  },
  async headers() {
    const noStoreHeaders = [
      { key: "Cache-Control", value: privateNoStore },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" }
    ];

    return [
      {
        source: "/api/:path*",
        headers: noStoreHeaders
      },
      {
        source: "/admin/:path*",
        headers: noStoreHeaders
      },
      {
        source: "/cart",
        headers: noStoreHeaders
      },
      {
        source: "/checkout",
        headers: noStoreHeaders
      },
      {
        source: "/order-success/:path*",
        headers: noStoreHeaders
      },
      {
        source: "/logo/:path*",
        headers: [{ key: "Cache-Control", value: publicAssetCache }]
      },
      {
        source: "/banners/:path*",
        headers: [{ key: "Cache-Control", value: publicAssetCache }]
      },
      {
        source: "/book-covers/:path*",
        headers: [{ key: "Cache-Control", value: publicAssetCache }]
      },
      {
        source: "/sample-pages/:path*",
        headers: [{ key: "Cache-Control", value: publicAssetCache }]
      },
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: publicAssetCache }]
      }
    ];
  }
};

export default nextConfig;
