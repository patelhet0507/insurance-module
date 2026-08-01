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

export const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SAR"] as const;
