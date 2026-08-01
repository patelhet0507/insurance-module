import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2, Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  usePolicy,
  useCustomers,
  useCompanies,
  useBrokers,
  useInsuranceTypes,
  useReminders,
} from "@/hooks/useData";
import { useCreate, useRemove, useUpdate } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/context/AuthContext";
import { REMINDER_CHANNELS, REMINDER_CHANNEL_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate, daysUntil, nowIso } from "@/lib/utils";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import type { Reminder, ReminderChannel } from "@/types";

export function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { doc: policy, loading } = usePolicy(id);
  const { docs: customers } = useCustomers();
  const { docs: companies } = useCompanies();
  const { docs: brokers } = useBrokers();
  const { docs: insuranceTypes } = useInsuranceTypes();
  const { docs: reminders } = useReminders();
  const { create } = useCreate("reminders");
  const { remove } = useRemove();
  const { update } = useUpdate();

  const writable = canWrite(profile?.role);

  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    dueDate: "",
    channel: "app" as ReminderChannel,
    notes: "",
  });

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!policy) return <div className="text-muted-foreground">Policy not found.</div>;
  const p = policy;

  const customer = customers.find((c) => c.id === p.customerId);
  const company = companies.find((c) => c.id === p.companyId);
  const broker = brokers.find((b) => b.id === p.brokerId);
  const insuranceType = insuranceTypes.find((t) => t.id === p.insuranceTypeId);
  const policyReminders = reminders.filter((r) => r.policyId === p.id);
  const daysLeft = daysUntil(p.endDate);

  async function addReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!reminderForm.title.trim() || !reminderForm.dueDate) return;
    try {
      await create({
        policyId: p.id,
        type: "custom",
        title: reminderForm.title.trim(),
        dueDate: reminderForm.dueDate,
        channel: reminderForm.channel,
        status: "pending",
        notes: reminderForm.notes.trim() || null,
        createdAt: nowIso(),
      });
      setReminderOpen(false);
      setReminderForm({ title: "", dueDate: "", channel: "app", notes: "" });
      notifySuccess("Reminder added");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Failed to add reminder");
    }
  }

  async function toggleReminder(r: Reminder) {
    await update(`reminders/${r.id}`, { status: r.status === "done" ? "pending" : "done" });
  }

  async function deleteReminder(r: Reminder) {
    await remove(`reminders/${r.id}`);
    notifySuccess("Reminder deleted");
  }

  const infoRows: { label: string; value: React.ReactNode }[] = [
    { label: "Customer", value: customer ? <Link className="hover:underline" to={`/customers/${customer.id}`}>{customer.firstName} {customer.lastName}</Link> : "—" },
    { label: "Insurance Company", value: company ? <Link className="hover:underline" to={`/companies/${company.id}`}>{company.name}</Link> : "—" },
    { label: "Insurance Type", value: insuranceType?.name ?? "—" },
    { label: "Broker", value: broker?.name ?? "—" },
    { label: "Premium", value: formatCurrency(p.premium, p.currency) },
    { label: "Start Date", value: formatDate(p.startDate) },
    { label: "End Date", value: formatDate(p.endDate) },
    {
      label: "Days Until Expiry",
      value: daysLeft == null ? "—" : daysLeft < 0 ? <span className="text-destructive">Expired {Math.abs(daysLeft)}d ago</span> : `${daysLeft} days`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={p.policyNumber} description={`Policy ${p.policyNumber}`}>
        <Button variant="outline" onClick={() => navigate("/policies")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {writable && (
          <>
            <Button variant="outline" onClick={() => navigate(`/policies/${p.id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button onClick={() => setReminderOpen(true)}>
              <Plus className="h-4 w-4" /> Add Reminder
            </Button>
          </>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Policy Information</CardTitle>
            <StatusBadge status={p.status} kind="policy" />
          </CardHeader>
          <CardContent className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {infoRows.map((row) => (
              <div key={row.label}>
                <p className="text-xs font-medium text-muted-foreground">{row.label}</p>
                <p className="mt-0.5 text-sm">{row.value}</p>
              </div>
            ))}
            {p.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="mt-0.5 text-sm whitespace-pre-wrap">{p.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Reminders</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {policyReminders.length === 0 ? (
              <EmptyState title="No reminders" description="Add a reminder for this policy." />
            ) : (
              <ul className="space-y-2">
                {policyReminders
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((r) => (
                    <li key={r.id} className="flex items-center gap-2 rounded-md border p-3">
                      <button
                        onClick={() => toggleReminder(r)}
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                        title={r.status === "done" ? "Mark pending" : "Mark done"}
                      >
                        {r.status === "done" && <span className="text-primary text-xs">✓</span>}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm ${r.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {r.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(r.dueDate)} · {REMINDER_CHANNEL_LABEL[r.channel]}
                        </p>
                      </div>
                      {writable && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteReminder(r)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogHeader>
          <DialogTitle>Add Reminder</DialogTitle>
          <DialogDescription>Reminders appear on the reminders page and can be marked done as they're handled.</DialogDescription>
        </DialogHeader>
        <form onSubmit={addReminder} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rem-title">Title *</Label>
            <Input id="rem-title" required value={reminderForm.title} onChange={(e) => setReminderForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Renewal call with customer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rem-date">Due Date *</Label>
              <Input id="rem-date" required type="date" value={reminderForm.dueDate} onChange={(e) => setReminderForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rem-channel">Channel</Label>
              <Select id="rem-channel" value={reminderForm.channel} onChange={(e) => setReminderForm((f) => ({ ...f, channel: e.target.value as ReminderChannel }))}>
                {REMINDER_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {REMINDER_CHANNEL_LABEL[c]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setReminderOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Reminder</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
