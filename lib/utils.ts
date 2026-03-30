import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const COMMISSION = {
  RATE: 0.075,      // 7.5%
  FIXED_EUR: 0.15,  // 0.15€
} as const;

/** Calcule la commission plateforme en euros pour un montant en euros. */
export function calculateFeeEur(amountEur: number): number {
  return amountEur * COMMISSION.RATE + COMMISSION.FIXED_EUR;
}

type AssetBucket = "artist-images" | "product-images" | "user-images"

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
