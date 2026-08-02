import { useMemo, useState } from "react";
import { Bell, Trash2, CheckCircle2, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReminders, usePolicies } from "@/hooks/useData";
import { useRemove, useUpdate } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/context/AuthContext";
import { REMINDER_STATUS } from "@/lib/constants";
import { formatDate, daysUntil } from "@/lib/utils";
import { notifySuccess } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ReminderStatus } from "@/types";

const WINDOWS = [
  { value: "all", label: "All" },
  { value: "near30", label: "±30 days" },
  { value: "next30", label: "Next 30 days" },
  { value: "next60", label: "Next 60 days" },
  { value: "next90", label: "Next 90 days" },
] as const;
type Window = (typeof WINDOWS)[number]["value"];

export function RemindersPage() {
  const { profile } = useAuth();
  const { docs: reminders, loading } = useReminders();
  const { docs: policies } = usePolicies();
  const { update } = useUpdate();
  const { remove } = useRemove();

  const [statusFilter, setStatusFilter] = useState<"all" | ReminderStatus>("all");
  const [windowFilter, setWindowFilter] = useState<Window>("all");

  const writable = canWrite(profile?.role);

  const filtered = useMemo(() => {
    const rows = [...reminders].filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (windowFilter === "all") return true;
      const d = daysUntil(r.dueDate);
      if (d == null) return false;
      switch (windowFilter) {
        case "near30":
          return Math.abs(d) <= 30;
        case "next30":
          return d >= 0 && d <= 30;
        case "next60":
          return d >= 0 && d <= 60;
        case "next90":
          return d >= 0 && d <= 90;
        default:
          return true;
      }
    });
    return rows.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [reminders, statusFilter, windowFilter]);

  const policyNumber = (id: string) => policies.find((p) => p.id === id)?.policyNumber ?? "—";

  async function toggleStatus(id: string, current: ReminderStatus) {
    await update(`reminders/${id}`, { status: current === "done" ? "pending" : "done" });
  }

  async function deleteReminder(id: string) {
    await remove(`reminders/${id}`);
    notifySuccess("Reminder deleted");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reminders" description="Renewal and follow-up reminders" />

      <div className="flex flex-wrap items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | ReminderStatus)}
          className="w-40"
        >
          <option value="all">All statuses</option>
          {Object.entries(REMINDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
        <div className="flex flex-wrap gap-1">
          {WINDOWS.map((w) => (
            <Button
              key={w.value}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full px-3",
                windowFilter === w.value && "bg-accent text-accent-foreground"
              )}
              onClick={() => setWindowFilter(w.value)}
            >
              {w.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No reminders" description="Reminders for your policies will show up here." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                {writable && <TableHead className="w-24 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{policyNumber(r.policyId)}</TableCell>
                  <TableCell>{formatDate(r.dueDate)}</TableCell>
                  <TableCell className="capitalize">{r.channel}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} kind="reminder" />
                  </TableCell>
                  {writable && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={r.status === "done" ? "Mark pending" : "Mark done"}
                          onClick={() => toggleStatus(r.id, r.status)}
                        >
                          {r.status === "done" ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteReminder(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
