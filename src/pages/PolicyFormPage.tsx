import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePolicies, useCustomers, useCompanies, useBrokers, useInsuranceTypes, usePolicy } from "@/hooks/useData";
import { useCreate, useUpdate } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/context/AuthContext";
import { CURRENCIES } from "@/lib/constants";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import { nowIso, customerDisplayName } from "@/lib/utils";
import type { Policy, PolicyStatus } from "@/types";

export function PolicyFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { doc: policy, loading: polLoading } = usePolicy(id);
  const { docs: customers } = useCustomers();
  const { docs: companies } = useCompanies();
  const { docs: brokers } = useBrokers();
  const { docs: insuranceTypes } = useInsuranceTypes();
  const { create } = useCreate("policies");
  const { update } = useUpdate();

  const writable = canWrite(profile?.role);

  const [form, setForm] = useState({
    policyNumber: "",
    customerId: "",
    companyId: "",
    insuranceTypeId: "",
    brokerId: "",
    premium: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    status: "pending" as PolicyStatus,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (policy) {
      setForm({
        policyNumber: policy.policyNumber || "",
        customerId: policy.customerId || "",
        companyId: policy.companyId || "",
        insuranceTypeId: policy.insuranceTypeId || "",
        brokerId: policy.brokerId || "",
        premium: policy.premium != null ? String(policy.premium) : "",
        currency: policy.currency || "USD",
        startDate: policy.startDate || "",
        endDate: policy.endDate || "",
        status: policy.status || "pending",
        notes: policy.notes || "",
      });
    }
  }, [policy]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit = useMemo(
    () =>
      form.policyNumber.trim() &&
      form.customerId &&
      form.companyId &&
      form.insuranceTypeId &&
      form.premium &&
      form.startDate &&
      form.endDate,
    [form]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const num = form.policyNumber.trim();
      const dup = await getDocs(query(collection(db, "policies"), where("policyNumber", "==", num)));
      if (dup.docs.some((d) => d.id !== id)) {
        notifyError("A policy with this number already exists");
        return;
      }
      const payload = {
        policyNumber: num,
        customerId: form.customerId,
        companyId: form.companyId,
        insuranceTypeId: form.insuranceTypeId,
        brokerId: form.brokerId || null,
        premium: parseFloat(form.premium),
        currency: form.currency,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (isEdit && id) {
        await update(`policies/${id}`, payload);
        notifySuccess("Policy updated");
        navigate(`/policies/${id}`);
      } else {
        const { id: newId } = await create({ ...payload, createdAt: nowIso() });
        notifySuccess("Policy created");
        navigate(`/policies/${newId}`);
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Failed to save policy");
    } finally {
      setSaving(false);
    }
  }  if (isEdit && polLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isEdit && !policy) {
    return <div className="text-muted-foreground">Policy not found.</div>;
  }

  if (!writable) {
    return <div className="text-muted-foreground">You don't have permission to edit policies.</div>;
  }

  const input = "bg-background";

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? "Edit Policy" : "New Policy"}>
        <Button variant="outline" onClick={() => navigate(isEdit ? `/policies/${id}` : "/policies")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input id="policyNumber" required value={form.policyNumber} onChange={set("policyNumber")} placeholder="e.g. POL-2026-001" className={input} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select id="status" value={form.status} onChange={set("status")} className={input}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <Select id="customerId" required value={form.customerId} onChange={set("customerId")} className={input}>
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {customerDisplayName(c)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyId">Insurance Company *</Label>
              <Select id="companyId" required value={form.companyId} onChange={set("companyId")} className={input}>
                <option value="">Select company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceTypeId">Insurance Type *</Label>
              <Select id="insuranceTypeId" required value={form.insuranceTypeId} onChange={set("insuranceTypeId")} className={input}>
                <option value="">Select type…</option>
                {insuranceTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brokerId">Broker</Label>
              <Select id="brokerId" value={form.brokerId} onChange={set("brokerId")} className={input}>
                <option value="">No broker</option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="premium">Premium *</Label>
              <Input id="premium" required type="number" min="0" step="0.01" value={form.premium} onChange={set("premium")} placeholder="0.00" className={input} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" value={form.currency} onChange={set("currency")} className={input}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" required type="date" value={form.startDate} onChange={set("startDate")} className={input} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" required type="date" value={form.endDate} onChange={set("endDate")} className={input} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={set("notes")} placeholder="Optional notes…" className={input} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/policies/${id}` : "/policies")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || saving}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Policy"}
          </Button>
        </div>
      </form>
    </div>
  );
}
