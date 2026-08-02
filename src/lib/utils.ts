import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import { POLICY_TERM_MONTHS } from "@/lib/constants";

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

export interface ScheduleRow {
  label: string;
  period: string;
  amount: number;
}

/** Premium payment schedule: per-quarter rows (Term=Quarterly) or per-year rows otherwise. */
export function policySchedule(term?: string, startDate?: string, premium?: number | string) {
  if (!term || !startDate) return null;
  const qty = typeof premium === "number" ? premium : parseFloat(premium ?? "");
  if (!qty || qty <= 0) return null;
  const months = POLICY_TERM_MONTHS[term as keyof typeof POLICY_TERM_MONTHS];
  if (!months) return null;
  const start = dayjs(startDate);

  if (term === "quarterly") {
    const rows: ScheduleRow[] = Array.from({ length: 4 }, (_, i) => {
      const s = start.add(i * 3, "month");
      const e = start.add((i + 1) * 3, "month").subtract(1, "day");
      return {
        label: `Q${i + 1}`,
        period: `${s.format("MMM D, YYYY")} – ${e.format("MMM D, YYYY")}`,
        amount: qty,
      };
    });
    return { rows, total: qty * 4, totalLabel: "Total (Yearly)" };
  }

  const years = months / 12;
  const rows: ScheduleRow[] = Array.from({ length: years }, (_, i) => {
    const s = start.add(i * 12, "month");
    const e = start.add((i + 1) * 12, "month").subtract(1, "day");
    return {
      label: `Year ${i + 1}`,
      period: `${s.format("MMM D, YYYY")} – ${e.format("MMM D, YYYY")}`,
      amount: qty,
    };
  });
  return { rows, total: qty * years, totalLabel: years > 1 ? `Total (${years} Years)` : "Total (Yearly)" };
}
