import type { NextConfig } from "next";

const minioUrl = new URL(
  process.env.NEXT_PUBLIC_MINIO_URL ?? "http://localhost:9000"
);

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: minioUrl.protocol.replace(":", "") as "http" | "https",
        hostname: minioUrl.hostname,
        ...(minioUrl.port ? { port: minioUrl.port } : {}),
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
