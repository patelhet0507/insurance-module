import type { PolicyStatus, ReminderChannel, ReminderStatus, Role } from "@/types";

export const APP_NAME = "Renewal Manager";

export const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  staff: "Staff",
  viewer: "Viewer",
};

export const POLICY_STATUS: Record<PolicyStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "success" },
  pending: { label: "Pending", color: "warning" },
  expired: { label: "Expired", color: "muted" },
  cancelled: { label: "Cancelled", color: "destructive" },
};

export const REMINDER_STATUS: Record<ReminderStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "warning" },
  done: { label: "Done", color: "success" },
  expired: { label: "Expired", color: "muted" },
  cancelled: { label: "Cancelled", color: "destructive" },
};

export const REMINDER_CHANNELS: ReminderChannel[] = ["app", "email", "sms"];

export const REMINDER_CHANNEL_LABEL: Record<ReminderChannel, string> = {
  app: "In-app",
  email: "Email",
  sms: "SMS",
};

export const CURRENCIES = ["INR"] as const;

export const POLICY_TERMS = [
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "3years", label: "3 Years" },
] as const;

export const POLICY_TERM_MONTHS: Record<(typeof POLICY_TERMS)[number]["value"], number> = {
  quarterly: 3,
  yearly: 12,
  "3years": 36,
};

export const POLICY_TERM_LABEL: Record<(typeof POLICY_TERMS)[number]["value"], string> = {
  quarterly: "Quarterly",
  yearly: "Yearly",
  "3years": "3 Years",
};

export const PAYMENT_MODES = ["Quarterly", "Yearly"] as const;

export const CUSTOMER_TYPES = [
  { value: "person", label: "Person" },
  { value: "company", label: "Company" },
] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;

export const COMPANY_TYPES = [
  "Private Limited",
  "Public Limited",
  "LLP",
  "Partnership",
  "Sole Proprietorship",
  "One Person Company",
  "Firm",
  "Other",
] as const;
