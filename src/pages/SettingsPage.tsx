import { useEffect, useState } from "react";
import { Plus, Trash2, Save, UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSettings, useInsuranceTypes, useUsers } from "@/hooks/useData";
import { useUpdate, useCreate, useRemove } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { canManageUsers, canWrite, canEditUser } from "@/context/AuthContext";
import { ROLES, ROLE_LABEL, REMINDER_CHANNELS, REMINDER_CHANNEL_LABEL } from "@/lib/constants";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import type { Role } from "@/types";

export function SettingsPage() {
  const { profile } = useAuth();
  const { doc: settings, loading: settingsLoading } = useSettings();
  const { docs: insuranceTypes } = useInsuranceTypes();
  const { docs: users } = useUsers();
  const { update } = useUpdate();
  const { create } = useCreate("insuranceTypes");
  const { remove } = useRemove();

  const admin = canManageUsers(profile?.role);
  const writable = canWrite(profile?.role);

  const [form, setForm] = useState({
    companyName: "",
    currency: "USD",
    defaultReminderDays: "30",
  });
  const [channels, setChannels] = useState<string[]>([]);
  const [newType, setNewType] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        companyName: settings.companyName || "",
        currency: settings.currency || "USD",
        defaultReminderDays: String(settings.defaultReminderDays ?? 30),
      });
      setChannels(settings.reminderChannels ?? ["app"]);
    }
  }, [settings]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await update("settings/general", {
        companyName: form.companyName.trim(),
        currency: form.currency,
        defaultReminderDays: parseInt(form.defaultReminderDays) || 30,
        reminderChannels: channels,
      });
      notifySuccess("Settings saved");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function addType(e: React.FormEvent) {
    e.preventDefault();
    const name = newType.trim();
    if (!name) return;
    await create({ name });
    setNewType("");
  }

  async function changeRole(uid: string, role: Role) {
    await update(`users/${uid}`, { role });
    notifySuccess("Role updated");
  }

  if (settingsLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your workspace configuration" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select id="currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                    <option value="SAR">SAR</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderDays">Default Reminder (days)</Label>
                  <Input id="reminderDays" type="number" min="1" value={form.defaultReminderDays} onChange={(e) => setForm((f) => ({ ...f, defaultReminderDays: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reminder Channels</Label>
                <div className="flex flex-col gap-2">
                  {REMINDER_CHANNELS.map((c) => (
                    <label key={c} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{REMINDER_CHANNEL_LABEL[c]}</span>
                      <Switch
                        checked={channels.includes(c)}
                        onCheckedChange={(on) =>
                          setChannels((prev) => (on ? [...prev, c] : prev.filter((x) => x !== c)))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
              {writable && (
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Settings"}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insurance Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {writable && (
              <form onSubmit={addType} className="flex gap-2">
                <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="e.g. Motor, Life, Health" />
                <Button type="submit" variant="secondary">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </form>
            )}
            <ul className="space-y-2">
              {insuranceTypes.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-sm">{t.name}</span>
                  {writable && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(`insuranceTypes/${t.id}`)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {admin && (
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <UserCog className="h-5 w-5 text-muted-foreground" />
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.displayName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="w-40">
                      {canEditUser(profile?.role, u.role) ? (
                        <Select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge variant="secondary">{ROLE_LABEL[u.role]}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
