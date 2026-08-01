import { Badge } from "@/components/ui/badge";
import { POLICY_STATUS, REMINDER_STATUS } from "@/lib/constants";
import type { PolicyStatus, ReminderStatus } from "@/types";

const COLOR_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted" | "secondary"> = {
  success: "success",
  warning: "warning",
  destructive: "destructive",
  muted: "muted",
};

export function StatusBadge({ status, kind }: { status: string; kind: "policy" | "reminder" }) {
  const map = (kind === "policy" ? POLICY_STATUS : REMINDER_STATUS) as Record<string, { label: string; color: string }>;
  const entry = map[status];
  if (!entry) return <Badge variant="secondary">{status}</Badge>;
  return <Badge variant={COLOR_VARIANT[entry.color] ?? "secondary"}>{entry.label}</Badge>;
}
