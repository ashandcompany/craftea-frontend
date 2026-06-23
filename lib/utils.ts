import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const COMMISSION = {
  RATE: 0.05,        // 5% brut prélevé sur la transaction
  FIXED_EUR: 0.25,   // 0.25€ fixe (couvre le fixe Stripe)
} as const;

// Frais Stripe selon origine de la carte (pour affichage transparent côté artisan)
export const STRIPE_FEES = {
  EEA: { rate: 0.015, fixedEur: 0.25 },  // 1.5% + 0.25€
  UK:  { rate: 0.025, fixedEur: 0.25 },  // 2.5% + 0.25€
} as const;

/** Calcule la commission plateforme en euros pour un montant en euros. */
export function calculateFeeEur(amountEur: number): number {
  return amountEur * COMMISSION.RATE + COMMISSION.FIXED_EUR;
}

type AssetBucket = "artist-images" | "product-images" | "user-images" | "review-images"

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
