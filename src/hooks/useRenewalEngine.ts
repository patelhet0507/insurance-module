import { useEffect, useRef } from "react";
import { usePolicies, useReminders, useSettings } from "@/hooks/useData";
import { useNotifications } from "@/hooks/useNotifications";
import { useCreate, useUpdate } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/context/AuthContext";
import { daysUntil, nowIso } from "@/lib/utils";

/**
 * Client-side renewal engine. Runs once per session for staff/admin:
 * - flips active/pending policies past their endDate to "expired"
 * - creates notifications for policies expiring within the window
 * - creates notifications for due reminders
 * Notifications are deduped by a stable `key` so re-runs don't spam.
 * ponytail: client-side approximation; replace with a scheduled Cloud Function for production-scale.
 */
export function useRenewalEngine() {
  const { profile } = useAuth();
  const { docs: policies, loading: polLoading } = usePolicies();
  const { docs: reminders, loading: remLoading } = useReminders();
  const { doc: settings } = useSettings();
  const { notifications } = useNotifications();
  const { create } = useCreate("notifications");
  const { update } = useUpdate();
  const fired = useRef(false);

  const writable = canWrite(profile?.role);
  const windowDays = settings?.defaultReminderDays ?? 30;
  const ready = writable && !polLoading && !remLoading;

  const existingKeys = new Set(notifications.map((n) => n.key).filter(Boolean));

  useEffect(() => {
    if (!ready || fired.current) return;
    fired.current = true;

    (async () => {
      for (const p of policies) {
        const d = daysUntil(p.endDate);
        if (d == null) continue;

        if (d < 0 && (p.status === "active" || p.status === "pending")) {
          await update(`policies/${p.id}`, { status: "expired" });
          continue;
        }

        if (d <= windowDays && p.status === "active") {
          const key = `expiry-${p.id}`;
          if (existingKeys.has(key)) continue;
          await create({
            key,
            title: "Policy expiring soon",
            message: `${p.policyNumber} expires in ${d === 0 ? "today" : `${d} days`}`,
            link: `/policies/${p.id}`,
            read: false,
            createdAt: nowIso(),
          });
        }
      }

      for (const r of reminders) {
        if (r.status !== "pending") continue;
        const d = daysUntil(r.dueDate);
        if (d == null || d > 0) continue;
        const key = `reminder-${r.id}`;
        if (existingKeys.has(key)) continue;
        await create({
          key,
          title: `Reminder: ${r.title}`,
          message: `Due ${d === 0 ? "today" : "yesterday"}`,
          link: `/policies/${r.policyId}`,
          read: false,
          createdAt: nowIso(),
        });
      }
    })();
  }, [ready, policies, reminders, windowDays, existingKeys, create, update]);
}
