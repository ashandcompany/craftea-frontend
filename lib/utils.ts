import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type AssetBucket = "artist-images" | "product-images"

const MINIO_BASE_URL = (process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000").replace(/\/+$/, "")

export function assetUrl(value?: string | null, bucket?: AssetBucket) {
  if (!value) return ""

  if (/^(https?:|blob:|data:)/i.test(value)) return value

  if (!bucket) return value

  const normalized = value.replace(/^\/+/, "")
  if (normalized.startsWith(`${bucket}/`)) {
    return `${MINIO_BASE_URL}/${normalized}`
  }

  return `${MINIO_BASE_URL}/${bucket}/${normalized}`
}
