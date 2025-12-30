import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  // Convert string to number if needed
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount

  // Handle NaN, null, undefined, or invalid numbers
  if (!Number.isFinite(numAmount) || isNaN(numAmount)) {
    return "₦0.00"
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(numAmount)
    .replace("NGN", "₦")
}

export function formatNumber(amount: number | string): string {
  // Convert string to number if needed
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount

  // Handle NaN, null, undefined, or invalid numbers
  if (!Number.isFinite(numAmount) || isNaN(numAmount)) {
    return "0.00"
  }

  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

export function safeNumber(value: any): number {
  const num = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  return Number.isFinite(num) && !isNaN(num) ? num : 0
}
