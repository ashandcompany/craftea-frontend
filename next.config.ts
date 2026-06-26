import type { NextConfig } from "next";

const minioUrlStr = process.env.NEXT_PUBLIC_MINIO_URL ?? "http://localhost:9000";
// May be a relative path (e.g. "/assets") when proxied through Next.js rewrites
const minioUrl = /^https?:\/\//i.test(minioUrlStr) ? new URL(minioUrlStr) : null;
const minioInternalUrl = (process.env.MINIO_INTERNAL_URL ?? "http://localhost:9000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      ...(minioUrl
        ? [
            {
              protocol: minioUrl.protocol.replace(":", "") as "http" | "https",
              hostname: minioUrl.hostname,
              ...(minioUrl.port ? { port: minioUrl.port } : {}),
              pathname: "/**",
            },
          ]
        : [{ protocol: "http" as const, hostname: "localhost", port: "9000", pathname: "/**" }]),
      { protocol: "https" as const, hostname: "picsum.photos", pathname: "/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/assets/:path*",
        destination: `${minioInternalUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
