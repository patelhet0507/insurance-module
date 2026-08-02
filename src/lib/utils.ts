import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount?: number | null, currency = "INR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(date?: string | Date | null) {
  if (!date) return "—";
  return dayjs(date).format("MMM D, YYYY");
}

export function formatDateTime(date?: string | Date | null) {
  if (!date) return "—";
  return dayjs(date).format("MMM D, YYYY · h:mm A");
}

export function daysUntil(date?: string | Date | null) {
  if (!date) return null;
  return dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
}

/** A seed-able timestamp key that keeps ordering stable within a single Firestore write. */
export function nowIso() {
  return dayjs().toISOString();
}

export function customerDisplayName(c?: {
  customerType?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
} | null) {
  if (!c) return "—";
  if (c.customerType === "company" || c.companyName) return c.companyName || "—";
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";
}
